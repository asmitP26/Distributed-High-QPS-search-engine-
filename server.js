const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

// 🔴 CHANGE THIS to your Solr collection
const SOLR_URL = "http://localhost:8983/solr/movies/select";

// API route
app.get("/search", async (req, res) => {
    const query = req.query.q;

    if (!query) {
        return res.status(400).json({ error: "Query is required" });
    }

    try {
        const response = await axios.get(SOLR_URL, {
            params: {
                q: `name:${query}`,   // search by movie name
                wt: "json",
                rows: 20
            }
        });

        const results = response.data.response.docs;

        res.json(results);

    } catch (error) {
        console.error(error.message);
        res.status(500).send("Error fetching data from Solr");
    }
});

// start server
app.listen(5000, () => {
    console.log("Backend running on http://localhost:5000");
});