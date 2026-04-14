const fs = require('fs');
const path = require('path');

const files = [
    'Backend/server.js',
    'Frontend/app/page.tsx',
    'Frontend/app/simulation/page.tsx'
];

// Emoji regex to catch emojis
const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2B50}\u{200D}\u{FE0F}]+/gu;

files.forEach(file => {
    const fullPath = path.join('/home/shresth/Desktop/Distributed-High-QPS-search-engine-', file);
    if (!fs.existsSync(fullPath)) return;
    
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Remove emojis
    content = content.replace(emojiRegex, '');
    
    // Remove html entity emojis like &#127916;
    content = content.replace(/&#\d+;/g, '');
    
    // Strip emojis like ⚡
    content = content.replace(/⚡/g, '');
    content = content.replace(/️/g, ''); // variation selector

    // Strip lines that only contain comments
    content = content.replace(/^\s*\/\/.*$/gm, '');
    
    // Strip trailing line comments (excluding those part of URLs like http://)
    content = content.replace(/([^\\])\/\/.*$/gm, '$1');
    
    // Strip multi-line comments /* ... */
    content = content.replace(/\/\*[\s\S]*?\*\//g, '');

    // Cleanup empty lines
    content = content.replace(/^\s*[\r\n]/gm, '');

    fs.writeFileSync(fullPath, content);
});
console.log("Cleanup complete!");
