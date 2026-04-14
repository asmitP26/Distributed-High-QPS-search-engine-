// Run this with: node test-siege.js
// It tells you EXACTLY why siege isn't working from Node

const { spawn, execSync } = require('child_process');
const os   = require('os');
const path = require('path');

// ── 1. Where is siege? ────────────────────────────────────────
let siegePath;
try {
  siegePath = execSync('which siege').toString().trim();
  console.log('✅ siege found at:', siegePath);
} catch {
  console.error('❌ siege not found in PATH — Node cannot find it');
  console.log('   Fix: use full path like /usr/bin/siege in server.js');
  process.exit(1);
}

// ── 2. Does the URLs file exist? ──────────────────────────────
const urlsPath = path.join(os.homedir(), 'solr_urls.txt');
const fs = require('fs');
if (fs.existsSync(urlsPath)) {
  const lines = fs.readFileSync(urlsPath, 'utf8').trim().split('\n');
  console.log(`✅ solr_urls.txt found at ${urlsPath} (${lines.length} URLs)`);
  console.log('   First URL:', lines[0]);
} else {
  console.error('❌ solr_urls.txt NOT found at:', urlsPath);
  // Try Backend dir
  const backendPath = path.join(__dirname, 'solr_urls.txt');
  if (fs.existsSync(backendPath)) {
    console.log('   But found it at:', backendPath);
    console.log('   Fix: change urlsPath in server.js to use __dirname');
  }
  process.exit(1);
}

// ── 3. Spawn siege for 10 seconds and print raw output ────────
console.log('\n🚀 Spawning siege for 10 seconds...\n');

const cmd = `${siegePath} -c 5 -t 10S -d 0 -v -f "${urlsPath}" 2>&1`;
console.log('Command:', cmd, '\n');

const proc = spawn('bash', ['-c', cmd]);

console.log('PID:', proc.pid);

let gotOutput = false;

proc.stdout.on('data', (data) => {
  gotOutput = true;
  process.stdout.write('[STDOUT] ' + data.toString());
});

proc.stderr.on('data', (data) => {
  gotOutput = true;
  process.stdout.write('[STDERR] ' + data.toString());
});

proc.on('error', (err) => {
  console.error('💥 Spawn error:', err.message);
});

proc.on('close', (code) => {
  console.log('\n── Siege exited with code:', code);
  if (!gotOutput) {
    console.error('❌ ZERO output received — siege ran but printed nothing');
    console.log('   This means the -v flag is not enough for non-TTY output');
    console.log('   Fix: add --log=/dev/stdout or pipe through unbuffer');
  } else {
    console.log('✅ Output was received — Node CAN read siege output');
  }
});

setTimeout(() => {}, 15000); // keep process alive