#!/bin/bash

# =========================================================
# MANUAL CONFIGURATION REQUIRED BEFORE STARTING SOLR:
# =========================================================
# STEP 1: Update your Bash Profile
# Run: nano ~/.bashrc
# Add these to the bottom:
# export SOLR_JAVA_HOME="/usr/lib/jvm/java-11-openjdk-amd64"
# export PATH="$PATH:$HOME/solr-9.10.1/bin"
# Save, exit, and run: source ~/.bashrc
#
# STEP 2: Increase OS Limits for the Siege Test
# Run: sudo nano /etc/security/limits.conf
# Add these to the bottom:
# * soft nofile 65000
# * hard nofile 65000
# * soft nproc 65
# * hard nproc 65
# ---------------------------------------------------------
# Script: setup_solr_primary.sh
# Purpose: Bootstraps the Primary Solr node and ZooKeeper
# ---------------------------------------------------------

echo "Starting Solr in Cloud Mode..."
solr start -cloud -p 8983

echo "Waiting for ZooKeeper to spin up..."
sleep 5

echo "Creating the 'imdb' collection (1 Shard, 4 Replicas)..."
curl "http://localhost:8983/solr/admin/collections?action=CREATE&name=imdb&numShards=1&replicationFactor=4"

echo "Disabling data-driven schema guessing..."
curl "http://localhost:8983/solr/imdb/config" -d '{"set-user-property": {"update.autoCreateFields":"false"}}'

echo "Enforcing strict IMDb schema with DocValues..."
curl -X POST -H 'Content-type:application/json' --data-binary '{
  "add-field": [
    { "name": "id", "type": "string", "indexed": true, "stored": true },
    { "name": "title_type", "type": "string", "indexed": true, "stored": true },
    { "name": "title", "type": "text_general", "indexed": true, "stored": true },
    { "name": "genres", "type": "strings", "indexed": true, "stored": true, "multiValued": true },
    { "name": "release_year", "type": "pint", "indexed": true, "stored": true, "docValues": true },
    { "name": "rating", "type": "pfloat", "indexed": true, "stored": true, "docValues": true },
    { "name": "votes", "type": "pint", "indexed": true, "stored": true, "docValues": true },
    { "name": "runtime", "type": "pint", "indexed": false, "stored": true }
  ]
}' http://localhost:8983/solr/imdb/schema

echo "Primary Solr Node configured successfully!"