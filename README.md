# Distributed Big Data Pipeline: Hadoop-HBase-Solr Integration for High-Throughput Search

## 1. Project Overview
This repository contains the architecture, configuration, and automation scripts for a distributed, enterprise-grade data pipeline.

Standard monolithic databases struggle to ingest massive datasets and serve complex analytical queries with sub-second latency under high concurrency.

To resolve this, our system integrates:
- **Hadoop HDFS** for distributed storage  
- **MapReduce** for parallel data processing  
- **SolrCloud** for in-memory, high-throughput search operations  

The processed data is served through a **Next.js web application**, while system resilience is benchmarked using the **Siege testing utility**.

### Academic Context
- **Authors:** Team Quintet & Sayon Mondal  
- **Institution:** Department of Computer Science and Engineering, Indian Institute of Technology Kharagpur  
- **Date:** April 2026  

---

## 2. System Architecture & Data Flow

The pipeline follows a highly decoupled, linear flow:

### 🔹 Raw Data Ingestion
- Combined `.tsv` file from:
  - `title.basics.tsv`
  - `title.ratings.tsv`
- Total records: **1,658,156**

### 🔹 HDFS Storage Layer
- Data stored across a **3-node cluster**
- Replication factor: **3**
- Block-based distribution for fault tolerance

### 🔹 MapReduce Processing Layer
- Two sequential jobs:
  - Data cleaning
  - JSON transformation
- Output:
  - Reduced from **1.6M → 330,665 records**

### 🔹 SolrCloud Serving Layer
- **4-node distributed Solr cluster**
- Builds:
  - Inverted Index
  - Columnar DocValues (RAM-based)

### 🔹 Application Layer
- **Next.js backend**
- Queries Solr via REST API
- Uses **round-robin load balancing**
- Serves data to frontend

---

## 3. Cluster Topology & Networking

### 3.1 VPN Mesh Network (Tailscale)
- All communication routed via **Tailscale VPN (100.x.x.x)**
- Covers:
  - HDFS transfers
  - YARN scheduling
  - Solr replication

---

### 3.2 Hadoop Cluster (3 Nodes)

| Node        | Role |
|------------|------|
| **Master (master)** | NameNode, SecondaryNameNode, ResourceManager, NodeManager |
| **Worker 1 (w1)**   | DataNode, NodeManager |
| **Worker 2 (w2)**   | DataNode, NodeManager |

---

### 3.3 SolrCloud Cluster (4 Nodes)

| Node        | Role |
|------------|------|
| **Primary (solr)** | Main Solr + ZooKeeper (port 9983) |
| **Replicas (solr1, solr2, solr3)** | Followers |

- Architecture: **1 Shard, 4 Replicas**
- Strategy: **Zero scatter-gather**
- Result: Any node answers queries independently (**O(1)**)

---

## 4. Prerequisites & Environment Setup

### System Requirements
- Ubuntu 24.04 (Noble Numbat)
- Java 11 (`openjdk-11-jdk`)
- Apache Hadoop 3.3.6
- Apache Solr 9.10.1
- `curl`, `wget`, `rsync`, `ssh`

---

### Environment Variables

Add to `~/.bashrc`:

```bash
export SOLR_JAVA_HOME="/usr/lib/jvm/java-11-openjdk-amd64"
export PATH="$PATH:$HOME/solr-9.10.1/bin"
```

---

### OS File Limits (Critical for Benchmarking)

Edit `/etc/security/limits.conf`:

```plaintext
* soft nofile 65000
* hard nofile 65000
* soft nproc 65000
* hard nproc 65000
```

---

## 5. Deployment Instructions

### Phase 1: Network Initialization

```bash
chmod +x tailscale.sh
./tailscale.sh
```

**Manual Steps:**
- Update `/etc/hosts` with Tailscale IPs
- Open Solr port:

```bash
sudo ufw allow 8983/tcp
```

---

### Phase 2: Hadoop MapReduce Pipeline

```bash
chmod +x Hadoop_TS_MapRed.sh
./Hadoop_TS_MapRed.sh
```

Output:
- `./json_output` → rename to `movies_solr.json`
- Transfer to Solr primary node

---

### Phase 3: SolrCloud Bootstrapping

#### Primary Node:
```bash
chmod +x setup_solr_primary.sh
./setup_solr_primary.sh
```

#### Replica Nodes:
```bash
chmod +x setup_solr_replicas.sh
./setup_solr_replicas.sh
```

---

### Phase 4: Data Ingestion

```bash
chmod +x ingest_solr_data.sh
./ingest_solr_data.sh
```

- Pushes ~1.5GB dataset
- Triggers index creation

---

## 6. Solr Schema Definition

| Field        | Type            | Indexed | DocValues |
|-------------|-----------------|--------|----------|
| id          | string          | Yes    | No       |
| title_type  | string          | Yes    | No       |
| title       | text_general    | Yes    | No       |
| genres      | strings (multi) | Yes    | No       |
| release_year| pint            | Yes    | Yes      |
| rating      | pfloat          | Yes    | Yes      |
| votes       | pint            | Yes    | Yes      |
| runtime     | pint            | No     | No       |

---

## 7. Stress Testing & Benchmarking

We use **Siege** to simulate high concurrency.

### Run Benchmark:
```bash
siege -c 200 -t 60S -i -f urls.txt
```

### Metrics Collected:
- Total Transactions
- Availability (% success)
- Average Response Time
- Queries Per Second (QPS)

---

## Summary

This system demonstrates a **fully distributed, fault-tolerant, high-throughput data pipeline** capable of:

- Processing **millions of records**
- Serving **low-latency queries**
- Handling **high concurrency workloads**

---