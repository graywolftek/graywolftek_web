const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf-8');
const lines = content.split('\n');
let foundLine = -1;
lines.forEach((l, i) => {
  if (l.includes('class="obj"')) foundLine = i;
});
if (foundLine !== -1) {
  console.log(lines.slice(Math.max(0, foundLine - 15), foundLine + 25).join('\n'));
}

