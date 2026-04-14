const express = require("express");
const axios = require("axios");
const cors = require("cors");
const { spawn } = require('child_process');
require("dotenv").config();

const app = express();
app.use(cors());


const solrNodes = [
  { ip: process.env.SOLR_IP1 || "100.100.186.77",  name: "solr1 (w1)",     weight: 1, isMaster: false },
  { ip: process.env.SOLR_IP2 || "100.65.255.76",   name: "solr2 (w2)",     weight: 1, isMaster: false },
  { ip: process.env.SOLR_IP3 || "100.96.118.120",  name: "solr3 (master)", weight: 1, isMaster: true  },
  { ip: process.env.SOLR_IP4 || "100.91.5.87",     name: "solr (main)",    weight: 1, isMaster: false },
].map(node => ({
  ...node,
  url: `http://${node.ip}:8983/solr/imdb/select`,
  healthy: true,          
  activeConnections: 0,   
  totalRequests: 0,       
  totalErrors: 0,         
  lastChecked: null,      
  consecutiveFails: 0,    
}));


const HEALTH_CHECK_INTERVAL_MS = 15000;  
const HEALTH_CHECK_TIMEOUT_MS  = 3000;   
const MAX_CONSECUTIVE_FAILS    = 10;      
const RECOVERY_CHECK_MS        = 30000;  

async function checkNodeHealth(node) {
  try {
    await axios.get(`http://${node.ip}:8983/solr/imdb/select`, {
      params: { q: "*:*", rows: 0, wt: "json" },
      timeout: HEALTH_CHECK_TIMEOUT_MS,
    });
    if (!node.healthy) {
      console.log(` Node RECOVERED: ${node.name} (${node.ip})`);
    }
    node.healthy = true;
    node.consecutiveFails = 0;
    node.lastChecked = new Date();
  } catch (err) {
    node.consecutiveFails++;
    node.lastChecked = new Date();
    if (node.consecutiveFails >= MAX_CONSECUTIVE_FAILS && node.healthy) {
      node.healthy = false;
      console.warn(` Node DEAD: ${node.name} (${node.ip}) — removed from rotation`);
    }
  }
}


async function runHealthChecks() {
  await Promise.all(solrNodes.map(checkNodeHealth));
}


runHealthChecks(); 
setInterval(runHealthChecks, HEALTH_CHECK_INTERVAL_MS);









function getBestNode() {
  const healthy = solrNodes.filter(n => n.healthy);

  if (healthy.length === 0) {
    
    const master = solrNodes.find(n => n.isMaster) || solrNodes[0];
    console.warn(`  All nodes unhealthy! Falling back to master: ${master.name}`);
    return master;
  }

  
  return healthy.reduce((best, node) => {
    const nodeScore  = node.activeConnections  / node.weight;
    const bestScore  = best.activeConnections  / best.weight;
    if (nodeScore < bestScore) return node;
    if (nodeScore === bestScore && node.totalRequests < best.totalRequests) return node;
    return best;
  });
}






const MAX_RETRIES = 2;

async function querySolr(params) {
  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const node = getBestNode();
    node.activeConnections++;
    node.totalRequests++;

  console.log(` [Attempt ${attempt + 1}] Routing to: ${node.name} (${node.ip}) | active: ${node.activeConnections}`);
    
    try {
      
      const builtParams = new URLSearchParams();
      
      for (const [key, value] of Object.entries(params)) {
          if (key === 'fq' && Array.isArray(value)) {
              value.forEach(v => builtParams.append('fq', v));
          } else if (Array.isArray(value)) {
              value.forEach(v => builtParams.append(key, v));
          } else if (value !== undefined) {
              builtParams.append(key, value);
          }
      }

      
      if (params.fq && !Array.isArray(params.fq)) {
         builtParams.append('fq', params.fq);
      }

  const fullUrl = `${node.url}?${builtParams.toString()}`;
  console.log(` Solr request: ${fullUrl}`);

  const response = await axios.get(fullUrl, { timeout: 8000 });
      node.activeConnections--;
      return { data: response.data, node: node.name };
    } catch (err) {
      node.activeConnections--;
      node.totalErrors++;
      node.consecutiveFails++;

      if (node.consecutiveFails >= MAX_CONSECUTIVE_FAILS) {
        node.healthy = false;
        console.warn(` Node failed during request: ${node.name} — marking unhealthy`);
      }

      lastError = err;
      console.error(`  Request failed on ${node.name}: ${err.message}`);
    }
  }

  throw lastError;
}




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


app.get("/test", (req, res) => {
  res.json({ message: "Backend working " });
});


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

  const solrParams = {
    q: q ? q : "*:*",
    fq: filterQuery.length > 0 ? filterQuery : undefined,
    sort: "rating desc",
    rows: 20,
    wt: "json",
  };

  if (q) {
    solrParams.defType = "edismax";
    solrParams.qf = "title^2 title_type genres";
    solrParams["q.op"] = "AND";
  }

  try {
    const { data, node } = await querySolr(solrParams);

    res.json({
      results:     data.response.docs,
      numFound:    data.response.numFound,
      servedBy:    node,   
    });
  } catch (error) {
    console.error(" SEARCH ERROR (all retries exhausted):", error.message);
    res.status(500).json({
      error:   "Search failed — all Solr nodes unavailable",
      details: error.message,
    });
  }
});


app.get("/top", async (req, res) => {
  try {
    const { data, node } = await querySolr({
      q:    "*:*",
      sort: "rating desc",
      rows: 20,
      wt:   "json",
    });

    res.json({
      results:  data.response.docs,
      servedBy: node,
    });
  } catch (error) {
    console.error(" TOP ERROR (all retries exhausted):", error.message);
    res.status(500).json({
      error:   "Top movies fetch failed — all Solr nodes unavailable",
      details: error.message,
    });
  }
});



app.get('/api/simulation/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const os   = require('os');
  const path = require('path');

  
  const urlsPath = path.join(__dirname, 'solr_urls.txt');

  res.write(`event: status\ndata: ${JSON.stringify({ status: 'started', timestamp: Date.now() })}\n\n`);

  const heartbeatId = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 1000);

  let closed = false;

  const sendError = (message) => {
    try {
      res.write(`event: error\ndata: ${JSON.stringify({ message, timestamp: Date.now() })}\n\n`);
    } catch (_) {}
  };

  
  let hitCount    = 0;
  let windowStart = Date.now();

  const qpsInterval = setInterval(() => {
    const now     = Date.now();
    const elapsed = (now - windowStart) / 1000;   
    const qps     = elapsed > 0 ? hitCount / elapsed : 0;

    try {
      res.write(`data: ${JSON.stringify({
        type:      'qps',
        qps:       Math.round(qps * 10) / 10,
        hits:      hitCount,
        timestamp: now,
      })}\n\n`);
      if (res.flush) res.flush();
    } catch (_) {}

    
    hitCount    = 0;
    windowStart = now;
  }, 5000);

  
  
  const siegeProcess = spawn('bash', [
    '-c',
    `siege -c 50 -t 1M -d 0 -f "${urlsPath}" 2>&1`
  ]);
  console.log(" Siege spawned, PID:", siegeProcess.pid);
  console.log(" URLs file:", urlsPath);

  siegeProcess.on('error', (err) => {
    console.error(" SPAWN ERROR:", err); 
    sendError(err?.message || 'Failed to spawn siege');
  });

  
  let streamBuffer = '';

  const handleData = (data) => {
    // 2. Add the incoming data chunk to whatever was left over from the last chunk
    streamBuffer += data.toString();
    
    // 3. Split the buffered text into lines
    const lines = streamBuffer.split('\n');
    
    
    
    streamBuffer = lines.pop();

    for (const line of lines) {
      if (!line.trim()) continue;

      
      
      
      
      
      const cleanLine = line.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
      const match = cleanLine.match(/^HTTP\/[\d.]+\s+(\d+)\s+([\d.]+)\s+secs/);
      
      if (match) {
        hitCount++;                               // count every HTTP hit for QPS

        const statusCode   = parseInt(match[1], 10);
        const responseTime = parseFloat(match[2]);

        try {
          res.write(`data: ${JSON.stringify({
            type:         'metric',
            responseTime,
            statusCode,
            raw:          line,
            timestamp:    Date.now(),
          })}\n\n`);
          if (res.flush) res.flush();
        } catch (_) {}
      } else {
        
        try {
          res.write(`data: ${JSON.stringify({ type: 'log', raw: line, timestamp: Date.now() })}\n\n`);
          if (res.flush) res.flush();
        } catch (_) {}
      }
    }
  };

  siegeProcess.stdout.on('data', handleData);
  siegeProcess.stderr.on('data', handleData);

  siegeProcess.on('error', (err) => {
    console.error('Siege spawn error:', err);
    sendError(err?.message || 'Failed to spawn siege');
  });

  siegeProcess.on('close', (code, signal) => {
    if (closed) return;
    closed = true;

    clearInterval(heartbeatId);
    clearInterval(qpsInterval);   

    if (code && code !== 0) {
      console.log(`Siege exited non-zero (code=${code}, signal=${signal || 'none'})`);
      sendError(`siege exited with code ${code}`);
    }

    res.write(`data: ${JSON.stringify({ done: true, code, signal, timestamp: Date.now() })}\n\n`);
    res.end();
  });

  req.on('close', () => {
    if (closed) return;
    closed = true;

    clearInterval(heartbeatId);
    clearInterval(qpsInterval);   

    try { siegeProcess.kill('SIGTERM'); } catch (_) {}

    const killTimer = setTimeout(() => {
      try { siegeProcess.kill('SIGKILL'); } catch (_) {}
    }, 1500);

    siegeProcess.once('close', () => clearTimeout(killTimer));

    try { res.end(); } catch (_) {}
  });
});


app.listen(5000, () => {
  console.log(" Backend running at http://localhost:5000");
  console.log(" Solr Nodes:");
  solrNodes.forEach(n => console.log(`   • ${n.name}: ${n.ip}`));
  console.log(" Health checks every", HEALTH_CHECK_INTERVAL_MS / 1000, "seconds");
});