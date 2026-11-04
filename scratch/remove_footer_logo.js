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
  let content = fs.readFileSync(f, 'utf-8');

  // 1. Remove the 3D Animated Logo HTML markup from footer
  const logoRegex = /\s*<!--\s*3D Animated Logo on Top Left Blank Space\s*-->\s*<div class="flex justify-center lg:justify-start[^"]*" style="perspective:\s*1000px;">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;

  if (logoRegex.test(content)) {
    content = content.replace(logoRegex, '');
    console.log(`Removed 3D logo markup from ${f}`);
  } else {
    // Fallback regex matching just the div structure if comment is slightly different
    const fallbackRegex = /\s*<div class="flex justify-center lg:justify-start[^"]*" style="perspective:\s*1000px;">\s*<div class="obj">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
    if (fallbackRegex.test(content)) {
      content = content.replace(fallbackRegex, '');
      console.log(`Removed 3D logo markup via fallback regex from ${f}`);
    } else {
      console.warn(`Could not match 3D logo markup in ${f}`);
    }
  }

  // 2. Remove the unused CSS rules for the 3D logo
  const cssRegex = /\s*\/\*\s*From Uiverse\.io by Saad3092003\s*\*\/[\s\S]*?@keyframes updown\s*\{[\s\S]*?\}\s*\}/;
  if (cssRegex.test(content)) {
    content = content.replace(cssRegex, '');
    console.log(`Removed 3D logo CSS from ${f}`);
  }

  fs.writeFileSync(f, content, 'utf-8');
});

console.log('\nAll files processed successfully!');

