const fs = require('fs');
const content = fs.readFileSync('founder/index.html', 'utf-8');
console.log('founder/index.html has obj:', content.includes('class="obj"'));

