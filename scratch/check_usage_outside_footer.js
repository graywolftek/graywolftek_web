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
  const countObj = (content.match(/class="[^"]*\bobj\b[^"]*"/g) || []).length;
  const countShadow = (content.match(/logo-3d-shadow/g) || []).length;
  const countInn = (content.match(/class="[^"]*\binn6\b[^"]*"/g) || []).length;
  console.log(`${f}: obj=${countObj}, shadow=${countShadow}, inn6=${countInn}`);
});

