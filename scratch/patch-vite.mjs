import fs from 'fs';
let c = fs.readFileSync('vite.config.ts', 'utf8');
c = c.replace('mode === "development" && componentTagger(),', '');
fs.writeFileSync('vite.config.ts', c);
