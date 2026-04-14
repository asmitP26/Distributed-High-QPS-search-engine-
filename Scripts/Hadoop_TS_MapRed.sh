#!/bin/bash

set -e  # stop on error

############################################################
# CONFIG (EDIT THIS)
############################################################

HADOOP_VERSION="3.3.6"
SOLR_VERSION="9.10.1"

MASTER_HOSTNAME="master"
WORKERS=("w1" "w2")

HADOOP_HOME="$HOME/hadoop"
PROJECT_DIR="$HOME/hadoop-project"

############################################################
# 1. SYSTEM PREP
############################################################

echo "=== Installing dependencies ==="
sudo apt update
sudo apt install -y openjdk-11-jdk ssh rsync curl wget

echo "=== Setting JAVA_HOME ==="
echo 'export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64' >> ~/.bashrc
echo 'export PATH=$PATH:$JAVA_HOME/bin' >> ~/.bashrc

############################################################
# 2. INSTALL HADOOP
############################################################

echo "=== Installing Hadoop ==="
cd ~
wget -q https://downloads.apache.org/hadoop/common/hadoop-$HADOOP_VERSION/hadoop-$HADOOP_VERSION.tar.gz
tar -xzf hadoop-$HADOOP_VERSION.tar.gz
mv hadoop-$HADOOP_VERSION hadoop

echo "=== Setting Hadoop env ==="
echo "export HADOOP_HOME=$HADOOP_HOME" >> ~/.bashrc
echo 'export PATH=$PATH:$HADOOP_HOME/bin:$HADOOP_HOME/sbin' >> ~/.bashrc
source ~/.bashrc

############################################################
# 3. CONFIGURE HADOOP
############################################################

cd $HADOOP_HOME/etc/hadoop

echo "=== Configuring Hadoop ==="

# core-site.xml
cat > core-site.xml <<EOF
<configuration>
 <property>
  <name>fs.defaultFS</name>
  <value>hdfs://$MASTER_HOSTNAME:9000</value>
 </property>
</configuration>
EOF

# hdfs-site.xml
cat > hdfs-site.xml <<EOF
<configuration>
 <property>
  <name>dfs.replication</name>
  <value>3</value>
 </property>
</configuration>
EOF

# yarn-site.xml
cat > yarn-site.xml <<EOF
<configuration>
 <property>
  <name>yarn.resourcemanager.hostname</name>
  <value>$MASTER_HOSTNAME</value>
 </property>
</configuration>
EOF

# mapred-site.xml
cp mapred-site.xml.template mapred-site.xml
cat > mapred-site.xml <<EOF
<configuration>
 <property>
  <name>mapreduce.framework.name</name>
  <value>yarn</value>
 </property>
</configuration>
EOF

# workers
echo "=== Setting workers ==="
printf "%s\n" "${WORKERS[@]}" > workers

############################################################
# 4. SSH SETUP
############################################################

echo "=== Setting up SSH ==="
ssh-keygen -t rsa -N "" -f ~/.ssh/id_rsa || true

for host in "${WORKERS[@]}"; do
  ssh-copy-id $host || true
done

############################################################
# 5. TAILSCALE SETUP (RUN ON ALL NODES)
############################################################

echo "=== Installing Tailscale ==="
curl -fsSL https://tailscale.com/install.sh | sh
echo "Run manually: sudo tailscale up"
echo "Then verify with: tailscale status"

############################################################
# 6. START HADOOP
############################################################

echo "=== Formatting HDFS ==="
hdfs namenode -format || true

echo "=== Starting Hadoop ==="
start-dfs.sh
start-yarn.sh

############################################################
# 7. HEALTH CHECK
############################################################

echo "=== Cluster Status ==="
jps
hdfs dfsadmin -report
yarn node -list

############################################################
# 8. HDFS SETUP
############################################################

echo "=== Creating HDFS directories ==="
hdfs dfs -mkdir -p /input

############################################################
# 9. MAPREDUCE BUILD
############################################################

echo "=== Building MapReduce JAR ==="
cd $PROJECT_DIR

# Compile Java code and create JAR

javac -classpath `hadoop classpath` *.java
jar cf imdb.jar *.class

############################################################
# 10. RUN JOBS
############################################################

echo "=== Running Cleaning Job ==="
hdfs dfs -rm -r /cleaned || true
hadoop jar imdb.jar CleanDriver /input /cleaned

echo "=== Running JSON Job ==="
hdfs dfs -rm -r /json_output || true
hadoop jar imdb.jar JsonDriver /cleaned /json_output

############################################################
# 11. DOWNLOAD OUTPUT
############################################################

echo "=== Downloading output ==="
hdfs dfs -get /json_output ./json_output || true

echo "=== DEPLOYMENT COMPLETE ✅ ==="