const fs = require('fs');
const path = require('path');

const dirs = ['server/routes', 'server/utils'];

dirs.forEach(dir => {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    if (file.endsWith('.js')) {
      const p = path.join(dir, file);
      let data = fs.readFileSync(p, 'utf8');
      
      let modified = false;
      if (data.includes('\\`')) {
        data = data.replace(/\\`/g, '`');
        modified = true;
      }
      if (data.includes('\\$')) {
        data = data.replace(/\\\$/g, '$');
        modified = true;
      }
      
      if (modified) {
        fs.writeFileSync(p, data);
        console.log(`Fixed ${p}`);
      }
    }
  });
});
