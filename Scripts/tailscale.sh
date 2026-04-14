#!/bin/bash
# ---------------------------------------------------------
# Script: tailscale.sh
# Purpose: Downloads, installs, and connects Tailscale
# ---------------------------------------------------------

echo "Downloading and installing Tailscale..."
curl -fsSL https://tailscale.com/install.sh | sh

echo "Bringing up Tailscale network..."
sudo tailscale up

echo "Current Tailscale status and IP:"
tailscale status

# =========================================================
# MANUAL STEP REQUIRED: UPDATE HOSTS FILE
# =========================================================
# Now that Tailscale is running, you must map the IPs.
# Run: sudo nano /etc/hosts
#
# Add your cluster's Tailscale IPs at the bottom like this:
# 100.x.x.x    solr     (Primary Node)
# 100.x.x.x    solr1    (Replica 1)
# 100.x.x.x    solr2    (Replica 2)
# 100.x.x.x    solr3    (Replica 3)
# =========================================================