const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf-8');
const match = content.match(/<!--\s*3D Animated Logo[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/);
console.log(match[0]);

