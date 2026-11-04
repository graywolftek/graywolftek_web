const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf-8');

const footerIdx = content.indexOf('<footer');
const footerHtml = content.substring(footerIdx);

const objIdx = footerHtml.indexOf('class="obj"');
console.log(footerHtml.substring(objIdx - 200, objIdx + 400));

