const express = require("express");
const axios = require("./node_modules/axios/index.d.cts");
const cors = require("cors");

const app = express();
app.use(cors());

// ✅ Safe SOLR URL (fallback to localhost)
const SOLR_URL = process.env.SOLR_IP
  ? `http://${process.env.SOLR_IP}:8983/solr/imdb/select`
  : "http://100.91.5.87:8983/solr/imdb/select";

// ✅ Test route
app.get("/test", (req, res) => {
    res.json({ message: "Backend working ✅" });
});

// 🔍 SEARCH API
app.get("/search", async (req, res) => {
    const { q, genre, minRating, year } = req.query;

    let filterQuery = [];

    // ✅ Genre (array field in Solr)
    if (genre) {
        filterQuery.push(`genres:"${genre}"`);
    }

    // ✅ Rating filter
    if (minRating) {
        filterQuery.push(`rating:[${minRating} TO *]`);
    }

    // ✅ Year filter
    if (year) {
        filterQuery.push(`release_year:[${year} TO *]`);
    }

    try {
        const response = await axios.get(SOLR_URL, {
            params: {
                q: q ? `title:${q}` : "*:*",
                fq: filterQuery,
                sort: "rating desc",
                rows: 10,
                wt: "json"
            }
        });

        res.json(response.data.response.docs);

    } catch (error) {
        console.error("❌ SEARCH ERROR:");
        console.error(error.response?.data || error.message);

        res.status(500).json({
            error: "Search failed",
            details: error.response?.data || error.message
        });
    }
});

// 🔥 TOP MOVIES API
app.get("/top", async (req, res) => {
    try {
        const response = await axios.get(SOLR_URL, {
            params: {
                q: "*:*",
                sort: "rating desc",
                rows: 10,
                wt: "json"
            }
        });

        res.json(response.data.response.docs);

    } catch (error) {
        console.error("❌ TOP ERROR:");
        console.error(error.response?.data || error.message);

        res.status(500).json({
            error: "Top movies fetch failed",
            details: error.response?.data || error.message
        });
    }
});

// 🚀 START SERVER
app.listen(3000, () => {
    console.log("🚀 Backend running at http://localhost:3000");
    console.log("🔗 Solr URL:", SOLR_URL);
});