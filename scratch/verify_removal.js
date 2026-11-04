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

let allClean = true;

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf-8');
  const hasObj = content.includes('class="obj"');
  const hasShadow = content.includes('logo-3d-shadow');
  const hasInn6 = content.includes('class="inn6"');
  const hasCloseFooter = content.includes('</footer>');
  const hasCloseBody = content.includes('</body>');
  const hasCloseHtml = content.includes('</html>');

  if (hasObj || hasShadow || hasInn6 || !hasCloseFooter || !hasCloseBody || !hasCloseHtml) {
    console.error(`Issue in ${f}:`, { hasObj, hasShadow, hasInn6, hasCloseFooter, hasCloseBody, hasCloseHtml });
    allClean = false;
  } else {
    console.log(`✓ ${f} is completely clean and valid.`);
  }
});

if (allClean) {
  console.log('\nAll pages verified: 3D rotating wolf logo completely removed from footer!');
}

