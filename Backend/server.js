const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());

// ─── Node Registry ────────────────────────────────────────────────────────────
const solrNodes = [
  { ip: process.env.SOLR_IP1 || "100.100.186.77",  name: "solr1 (w1)",     weight: 1, isMaster: false },
  { ip: process.env.SOLR_IP2 || "100.65.255.76",   name: "solr2 (w2)",     weight: 1, isMaster: false },
  { ip: process.env.SOLR_IP3 || "100.96.118.120",  name: "solr3 (master)", weight: 1, isMaster: true  },
  { ip: process.env.SOLR_IP4 || "100.91.5.87",     name: "solr (main)",    weight: 1, isMaster: false },
].map(node => ({
  ...node,
  url: `http://${node.ip}:8983/solr/imdb/select`,
  healthy: true,          // is the node currently alive?
  activeConnections: 0,   // how many requests are in-flight right now?
  totalRequests: 0,       // lifetime request count
  totalErrors: 0,         // lifetime error count
  lastChecked: null,      // last health-check timestamp
  consecutiveFails: 0,    // how many health checks failed in a row
}));

// ─── Health Check Config ──────────────────────────────────────────────────────
const HEALTH_CHECK_INTERVAL_MS = 15000;  // check every 15 seconds
const HEALTH_CHECK_TIMEOUT_MS  = 3000;   // 3s timeout for health ping
const MAX_CONSECUTIVE_FAILS    = 2;      // mark dead after 2 consecutive fails
const RECOVERY_CHECK_MS        = 30000;  // re-check dead nodes every 30 seconds

async function checkNodeHealth(node) {
  try {
    await axios.get(`http://${node.ip}:8983/solr/imdb/select`, {
      params: { q: "*:*", rows: 0, wt: "json" },
      timeout: HEALTH_CHECK_TIMEOUT_MS,
    });
    if (!node.healthy) {
      console.log(`✅ Node RECOVERED: ${node.name} (${node.ip})`);
    }
    node.healthy = true;
    node.consecutiveFails = 0;
    node.lastChecked = new Date();
  } catch (err) {
    node.consecutiveFails++;
    node.lastChecked = new Date();
    if (node.consecutiveFails >= MAX_CONSECUTIVE_FAILS && node.healthy) {
      node.healthy = false;
      console.warn(`❌ Node DEAD: ${node.name} (${node.ip}) — removed from rotation`);
    }
  }
}

// Run health checks on all nodes
async function runHealthChecks() {
  await Promise.all(solrNodes.map(checkNodeHealth));
}

// Start periodic health checks
runHealthChecks(); // immediate first check on startup
setInterval(runHealthChecks, HEALTH_CHECK_INTERVAL_MS);

// ─── Load Balancer — Least Connections (health-aware) ─────────────────────────
//
//  Algorithm:
//    1. Filter to only healthy nodes
//    2. If NO healthy nodes → fallback to master node regardless
//    3. Among healthy nodes pick the one with fewest active connections
//    4. Ties broken by total lifetime requests (prefer less-used node)
//
function getBestNode() {
  const healthy = solrNodes.filter(n => n.healthy);

  if (healthy.length === 0) {
    // Emergency fallback: try the master node even if marked unhealthy
    const master = solrNodes.find(n => n.isMaster) || solrNodes[0];
    console.warn(`⚠️  All nodes unhealthy! Falling back to master: ${master.name}`);
    return master;
  }

  // Least connections with weight factoring
  return healthy.reduce((best, node) => {
    const nodeScore  = node.activeConnections  / node.weight;
    const bestScore  = best.activeConnections  / best.weight;
    if (nodeScore < bestScore) return node;
    if (nodeScore === bestScore && node.totalRequests < best.totalRequests) return node;
    return best;
  });
}

// ─── Execute Query with Retry ─────────────────────────────────────────────────
//
//  Tries the best node first. If it fails, marks it unhealthy and retries
//  on the next best node — up to MAX_RETRIES times.
//
const MAX_RETRIES = 2;

async function querySolr(params) {
  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const node = getBestNode();
    node.activeConnections++;
    node.totalRequests++;

  console.log(`🔀 [Attempt ${attempt + 1}] Routing to: ${node.name} (${node.ip}) | active: ${node.activeConnections}`);
    
    try {
      // Build proper QueryString that Solr understands since Axios array serializing is broken for Solr `fq` (produces `fq[]=...` instead of repeating `fq=...`)
      const builtParams = new URLSearchParams();
      // Iterate via URLSearchParams rather than object params because axios will url encode + escape everything correctly.
      for (const [key, value] of Object.entries(params)) {
          if (key === 'fq' && Array.isArray(value)) {
              value.forEach(v => builtParams.append('fq', v));
          } else if (Array.isArray(value)) {
              value.forEach(v => builtParams.append(key, v));
          } else if (value !== undefined) {
              builtParams.append(key, value);
          }
      }

      // Important: if fq was a single string, axios serializes correctly, but let's enforce multiple FQs.
      if (params.fq && !Array.isArray(params.fq)) {
         builtParams.append('fq', params.fq);
      }

  const fullUrl = `${node.url}?${builtParams.toString()}`;
  console.log(`🧾 Solr request: ${fullUrl}`);

  const response = await axios.get(fullUrl, { timeout: 8000 });
      node.activeConnections--;
      return { data: response.data, node: node.name };
    } catch (err) {
      node.activeConnections--;
      node.totalErrors++;
      node.consecutiveFails++;

      if (node.consecutiveFails >= MAX_CONSECUTIVE_FAILS) {
        node.healthy = false;
        console.warn(`❌ Node failed during request: ${node.name} — marking unhealthy`);
      }

      lastError = err;
      console.error(`⚠️  Request failed on ${node.name}: ${err.message}`);
    }
  }

  throw lastError;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// Health check endpoint — shows live cluster status
app.get("/cluster-status", (req, res) => {
  res.json({
    nodes: solrNodes.map(n => ({
      name:               n.name,
      ip:                 n.ip,
      healthy:            n.healthy,
      isMaster:           n.isMaster,
      activeConnections:  n.activeConnections,
      totalRequests:      n.totalRequests,
      totalErrors:        n.totalErrors,
      errorRate:          n.totalRequests > 0
                            ? ((n.totalErrors / n.totalRequests) * 100).toFixed(1) + "%"
                            : "0%",
      lastChecked:        n.lastChecked,
    })),
    healthyNodes: solrNodes.filter(n => n.healthy).length,
    totalNodes:   solrNodes.length,
  });
});

// Test route
app.get("/test", (req, res) => {
  res.json({ message: "Backend working ✅" });
});

// Search API
app.get("/search", async (req, res) => {
  const { q, genre, minRating, year, contentType } = req.query;
  const filterQuery = [];

  if (genre && genre !== "All Genres")     filterQuery.push(`genres:"${genre}"`);
  if (minRating && minRating > 1) filterQuery.push(`rating:[${minRating} TO *]`);
  if (year && year !== "all")      filterQuery.push(`release_year:${year}`);

  if (contentType && contentType !== "All Types") {
     let solrType = contentType;
     if (contentType === "Movies") solrType = "movie";
     else if (contentType === "TV Shows") solrType = "tvSeries";
     else if (contentType === "Series") solrType = "tvMiniSeries";
     else if (contentType === "Documentary") solrType = "documentary";

     filterQuery.push(`title_type:"${solrType}"`);
  }

  try {
    const { data, node } = await querySolr({
  // Use a fielded query so Solr doesn't fall back to a default field that can ignore your intent.
  // Also, don't use wildcard-leading queries (`*term*`) since they're slow; rely on Solr analysis.
  q:    q ? `title:${q}` : "*:*",
  // IMPORTANT: if there are no filters, omit fq completely.
  fq:   filterQuery.length > 0 ? filterQuery : undefined,
      sort: "rating desc",
      rows: 10,
      wt:   "json",
    });

    res.json({
      results:     data.response.docs,
      numFound:    data.response.numFound,
      servedBy:    node,   // shows which node handled the request
    });
  } catch (error) {
    console.error("❌ SEARCH ERROR (all retries exhausted):", error.message);
    res.status(500).json({
      error:   "Search failed — all Solr nodes unavailable",
      details: error.message,
    });
  }
});

// Top Movies API
app.get("/top", async (req, res) => {
  try {
    const { data, node } = await querySolr({
      q:    "*:*",
      sort: "rating desc",
      rows: 10,
      wt:   "json",
    });

    res.json({
      results:  data.response.docs,
      servedBy: node,
    });
  } catch (error) {
    console.error("❌ TOP ERROR (all retries exhausted):", error.message);
    res.status(500).json({
      error:   "Top movies fetch failed — all Solr nodes unavailable",
      details: error.message,
    });
  }
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(5000, () => {
  console.log("🚀 Backend running at http://localhost:5000");
  console.log("🔗 Solr Nodes:");
  solrNodes.forEach(n => console.log(`   • ${n.name}: ${n.ip}`));
  console.log("🏥 Health checks every", HEALTH_CHECK_INTERVAL_MS / 1000, "seconds");
});