import fs from 'fs';
let c = fs.readFileSync('src/App.tsx', 'utf8');
c = c.replace('import { AccountProvider } from "@/contexts/AccountContext";', 'import { AccountProvider } from "@/contexts/AccountContext";\nimport { BudgetProvider } from "@/contexts/BudgetContext";');
c = c.replace('<AccountProvider>', '<AccountProvider>\n                <BudgetProvider>');
c = c.replace('</AccountProvider>', '</BudgetProvider>\n              </AccountProvider>');
fs.writeFileSync('src/App.tsx', c);
