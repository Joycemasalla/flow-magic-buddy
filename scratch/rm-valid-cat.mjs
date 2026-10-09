import fs from 'fs';
let c = fs.readFileSync('src/contexts/TransactionContext.tsx', 'utf8');

c = c.replace(/const validCategories: TransactionCategory\[\] = \[.*?\];/s, '');
c = c.replace(/const category = validCategories\.includes\(t\.category as TransactionCategory\)\s+\?\s+\(t\.category as TransactionCategory\)\s+:\s+'other';/g, 'const category = t.category || "other";');
c = c.replace(/const category = validCategories\.includes\(r\.category as TransactionCategory\)\s+\?\s+\(r\.category as TransactionCategory\)\s+:\s+'other';/g, 'const category = r.category || "other";');
c = c.replace(/const category = validCategories\.includes\(d\.category as TransactionCategory\)\s+\?\s+\(d\.category as TransactionCategory\)\s+:\s+'other';/g, 'const category = d.category || "other";');

fs.writeFileSync('src/contexts/TransactionContext.tsx', c);
