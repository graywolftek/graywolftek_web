const fs = require('fs');

const files = [
  'index.html',
  'product.html',
  'projects.html',
  'software.html',
  'datacenter.html',
  'staffing.html',
  'blog-hr-management.html',
  'blog-infrastructure.html',
  'blog-remote-teams.html'
];

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf-8');
  const match = content.match(/<!--\s*3D Animated Logo[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/);
  if (match) {
    console.log(`Matched standard comment block in: ${f} (${match[0].length} chars)`);
  } else {
    const objMatch = content.match(/<div class="obj">[\s\S]*?<\/div>\s*<\/div>/);
    console.log(`Matched obj div in: ${f} (${objMatch ? objMatch[0].length : 0} chars)`);
  }
});

