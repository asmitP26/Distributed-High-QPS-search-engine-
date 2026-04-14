#!/bin/bash
# ---------------------------------------------------------
# Script: ingest_solr_data.sh
# Purpose: Pushes the MapReduce output into the Solr cluster
# ---------------------------------------------------------

DATA_FILE="./movies_solr.json"

if [ ! -f "$DATA_FILE" ]; then
    echo "Error: $DATA_FILE not found! Run MapReduce first."
    exit 1
fi

echo "Uploading 1.5GB dataset to Solr and triggering Hard Commit..."
echo "This will take approximately 10-15 minutes. Please wait..."

curl -# -X POST -H 'Content-type: application/json' \
--data-binary @"$DATA_FILE" \
"http://solr:8983/solr/imdb/update?commit=true"

echo ""
echo "Data successfully ingested and replicated across the mesh!"