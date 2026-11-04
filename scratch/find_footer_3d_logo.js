const fs = require('fs');

const files = [
  'index.html',
  'founder/index.html',
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
  if (!fs.existsSync(f)) return;
  const content = fs.readFileSync(f, 'utf-8');
  const footerStart = content.indexOf('<footer');
  if (footerStart !== -1) {
    const footerHtml = content.substring(footerStart);
    if (footerHtml.includes('obj') || footerHtml.includes('logo-3d-shadow') || footerHtml.includes('inn6') || footerHtml.includes('objchild')) {
      console.log(`Found 3D logo in footer of: ${f}`);
    }
  }
});

