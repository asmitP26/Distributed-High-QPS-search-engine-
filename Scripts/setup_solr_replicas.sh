#!/bin/bash
# ---------------------------------------------------------
# Script: setup_solr_replicas.sh
# Purpose: Connects follower laptops to the Solr cluster
# ---------------------------------------------------------

echo "Joining the SolrCloud Cluster via Tailscale VPN..."
solr start -cloud -z solr:9983 -p 8983

echo "Replica Node successfully joined the cluster!"