import fs from 'fs';
let c = fs.readFileSync('src/components/layout/AppLayout.tsx', 'utf8');
c = c.replace("{ path: '/emprestimos', icon: HandCoins, label: 'Empréstimos', mobileLabel: 'Emprést.' },", "{ path: '/emprestimos', icon: HandCoins, label: 'Empréstimos', mobileLabel: 'Emprést.' },\n  { path: '/orcamentos', icon: Receipt, label: 'Orçamentos', mobileLabel: 'Orçam.' },");
fs.writeFileSync('src/components/layout/AppLayout.tsx', c);
