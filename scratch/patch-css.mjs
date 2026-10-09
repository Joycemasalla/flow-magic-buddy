import fs from 'fs';
let c = fs.readFileSync('src/index.css', 'utf8');

if (!c.includes('lovable-badge')) {
  c += `
/* Remove Lovable Badge */
#lovable-badge, .lovable-badge, [id^="lovable-"] {
  display: none !important;
}
`;
  fs.writeFileSync('src/index.css', c);
}
