const fs = require('fs');
const path = require('path');

const DIRS = ['app', 'components'];
const EXTENSIONS = ['.tsx', '.ts'];

const REPLACEMENTS = [
  { regex: /\bbg-white\b/g, replacement: 'bg-[var(--color-surface)]' },
  { regex: /\bborder-black\b/g, replacement: 'border-[var(--color-border)]' },
  { regex: /\btext-black\b/g, replacement: 'text-[var(--color-text)]' },
  { regex: /\bbg-gray-50\b/g, replacement: 'bg-[var(--color-bg)]' },
  { regex: /shadow-\[(.*?)(?:#000|#000000|rgba\(0,0,0,1\))\]/g, replacement: 'shadow-[$1var(--color-border)]' }
];

function processDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      processDir(fullPath);
    } else if (EXTENSIONS.some(ext => fullPath.endsWith(ext))) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      
      for (const { regex, replacement } of REPLACEMENTS) {
        if (regex.test(content)) {
          content = content.replace(regex, replacement);
          modified = true;
        }
      }
      
      if (modified) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

for (const dir of DIRS) {
  processDir(path.join(__dirname, dir));
}

console.log("Replacement complete.");
