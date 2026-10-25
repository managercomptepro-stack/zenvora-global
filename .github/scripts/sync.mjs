// Copie le catalogue de Google Sheets dans catalogue.json (servi avec le site),
// et rapatrie les photos envoyées depuis la gestion (Google Drive) dans assets/uploads/.
import fs from 'node:fs';

const cfg = fs.readFileSync('assets/js/config.js', 'utf8');
const m = /CATALOGUE_ENDPOINT\s*=\s*"([^"]*)"/.exec(cfg);
if (!m || !/^https:\/\/script\.google/.test(m[1])) { console.log('::notice::Google Sheets non branché : rien à faire'); process.exit(0); }

let res;
try { res = await fetch(m[1] + '?action=catalogue&t=' + Date.now(), { redirect: 'follow' }); }
catch (e) { console.log('::warning::Google injoignable : ' + e.message); process.exit(0); }
const json = await res.json().catch(() => null);
if (!json || json.ok !== true || !json.data || !(json.data.products || []).length) {
  console.log('::warning::Réponse inattendue de Google (HTTP ' + res.status + '), catalogue.json inchangé');
  process.exit(0);
}
const data = json.data;
fs.mkdirSync('assets/uploads', { recursive: true });
let fetched = 0;
for (const p of data.products) {
  const out = [];
  for (const src of p.images || []) {
    const d = /lh3\.googleusercontent\.com\/d\/([\w-]+)/.exec(src) || /drive\.google\.com\/.*[?&/]id[=/]([\w-]+)/.exec(src);
    if (!d) { out.push(src); continue; }
    const file = `assets/uploads/${d[1]}.jpg`;
    if (!fs.existsSync(file)) {
      try {
        const r = await fetch(`https://lh3.googleusercontent.com/d/${d[1]}=w1400`, { redirect: 'follow' });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()));
        fetched++;
      } catch (e) { console.log('Photo non copiée', d[1], e.message); out.push(src); continue; }
    }
    out.push(file);
  }
  p.images = out;
}
const text = JSON.stringify(data, null, 1) + '\n';
const before = fs.existsSync('catalogue.json') ? fs.readFileSync('catalogue.json', 'utf8') : '';
if (before !== text) fs.writeFileSync('catalogue.json', text);
console.log(`::notice::${data.products.length} produits, ${fetched} nouvelles photos, ${before === text ? 'aucun changement' : 'catalogue.json mis à jour'}`);
