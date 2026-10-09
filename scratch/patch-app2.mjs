import fs from 'fs';
let c = fs.readFileSync('src/App.tsx', 'utf8');

c = c.replace('const NotFound = lazy(() => import("@/pages/NotFound"));', 'const Budgets = lazy(() => import("@/pages/Budgets"));\nconst NotFound = lazy(() => import("@/pages/NotFound"));');

c = c.replace('<Route path="/contas" element={<Accounts />} />', '<Route path="/contas" element={<Accounts />} />\n          <Route path="/orcamentos" element={<Budgets />} />');

fs.writeFileSync('src/App.tsx', c);
