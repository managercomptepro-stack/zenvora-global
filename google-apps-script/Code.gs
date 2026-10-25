/* ============================================================================
   ZENVORA GLOBAL — base de données Google Sheets (Google Apps Script)
   ----------------------------------------------------------------------------
   À coller dans : Google Sheets > Extensions > Apps Script (voir le guide).

   1. Changez le mot de passe ci-dessous.
   2. Exécutez une fois la fonction « installer » (bouton ▶) et autorisez.
   3. Déployez > Nouveau déploiement > Application Web
        Exécuter en tant que : Moi · Qui a accès : Tout le monde
   4. Copiez l'adresse /exec dans assets/js/config.js (CATALOGUE_ENDPOINT).
   ============================================================================ */

const MOT_DE_PASSE = 'ChangezMoi-2026';          // ← mot de passe de l'espace de gestion
const DOSSIER_PHOTOS = 'Zenvora Global — photos produits';

const F_PRODUITS = 'Produits';
const F_RAYONS = 'Rayons';
const F_REGLAGES = 'Reglages';
const F_DEMANDES = 'Demandes';

const COL_PRODUITS = ['id', 'num', 'nom', 'rayon', 'prix_usd', 'quantite_min', 'accroche', 'description',
                      'photos', 'carrousel', 'en_tete', 'visible', 'mis_a_jour'];
const COL_RAYONS = ['cle', 'nom', 'photo'];
const COL_DEMANDES = ['date', 'numero', 'produits', 'total_usd', 'total_fcfa', 'expedition', 'pays', 'ville'];

/* ---------------- Installation (à lancer une fois) ---------------- */
function installer(){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  feuille_(F_PRODUITS, COL_PRODUITS);
  feuille_(F_RAYONS, COL_RAYONS);
  feuille_(F_DEMANDES, COL_DEMANDES);
  const r = feuille_(F_REGLAGES, ['cle', 'valeur']);
  if (r.getLastRow() < 2){
    r.getRange(2, 1, 3, 2).setValues([['minOrderUSD', 500], ['usdToXof', 600], ['whatsappNumber', '+4915510520344']]);
  }
  dossier_();
  const s1 = ss.getSheetByName('Feuille 1') || ss.getSheetByName('Sheet1');
  if (s1 && s1.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(s1);
  viderCache_();
  return 'Installation terminée';
}

/* ---------------- Lecture publique ---------------- */
function doGet(e){
  const action = (e && e.parameter && e.parameter.action) || 'catalogue';
  try {
    if (action === 'catalogue') return json_({ok:true, data:catalogue_(true)});
    return json_({ok:false, error:'Action inconnue'});
  } catch(err){ return json_({ok:false, error:String(err.message || err)}); }
}

/* ---------------- Écritures ---------------- */
function doPost(e){
  let body = {};
  try { body = JSON.parse(e.postData.contents || '{}'); } catch(x){ return json_({ok:false, error:'Requête illisible'}); }
  const a = body.action;
  try {
    /* Public : trace d'une demande WhatsApp */
    if (a === 'demande') return json_({ok:true, data:demande_(body.order || {})});

    /* Tout le reste exige le mot de passe */
    if (String(body.password || '') !== MOT_DE_PASSE){
      Utilities.sleep(900);
      return json_({ok:false, error:'Mot de passe incorrect'});
    }
    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      switch (a){
        case 'login':          return json_({ok:true, data:true});
        case 'adminCatalogue': return json_({ok:true, data:catalogue_(false)});
        case 'saveProduct':    return json_({ok:true, data:enregistrerProduit_(body.product || {})});
        case 'deleteProduct':  return json_({ok:true, data:supprimerProduit_(String(body.id || ''))});
        case 'saveCategories': return json_({ok:true, data:enregistrerRayons_(body.categories || [])});
        case 'saveSettings':   return json_({ok:true, data:enregistrerReglages_(body.settings || {})});
        case 'upload':         return json_({ok:true, data:envoyerPhoto_(body)});
        case 'importSeed':     return json_({ok:true, data:importer_(body)});
        case 'demandes':       return json_({ok:true, data:listeDemandes_()});
      }
      return json_({ok:false, error:'Action inconnue'});
    } finally { lock.releaseLock(); viderCacheSi_(a); }
  } catch(err){ return json_({ok:false, error:String(err.message || err)}); }
}

/* ============================================================
   CATALOGUE
   ============================================================ */
function catalogue_(publicOnly){
  if (publicOnly){
    const c = lireCache_();
    if (c) return c;
  }
  const produits = lignes_(F_PRODUITS).map(versProduit_)
    .filter(p => p.id && (!publicOnly || p.active));
  const rayons = lignes_(F_RAYONS).map(r => ({key:String(r.cle), label:String(r.nom), image:String(r.photo || '')}))
    .filter(r => r.key);
  const reglages = {};
  lignes_(F_REGLAGES).forEach(r => { if (r.cle) reglages[r.cle] = r.valeur; });
  const data = {categories:rayons, products:produits, settings:{
    minOrderUSD:Number(reglages.minOrderUSD) || 500,
    usdToXof:Number(reglages.usdToXof) || 600,
    whatsappNumber:String(reglages.whatsappNumber || '')
  }};
  if (publicOnly) ecrireCache_(data);
  return data;
}
function versProduit_(r){
  return {
    id:String(r.id || ''), num:String(r.num || ''), name:String(r.nom || ''), category:String(r.rayon || ''),
    price:Number(String(r.prix_usd).replace(',', '.')) || 0, moq:Number(r.quantite_min) || 0,
    tagline:String(r.accroche || ''), description:String(r.description || ''),
    images:String(r.photos || '').split(/\s*\n\s*/).filter(String),
    featured:vrai_(r.carrousel), top:Number(r.en_tete) || 0,
    active:r.visible === '' ? true : vrai_(r.visible)
  };
}
function versLigne_(p){
  return [p.id, p.num, p.name, p.category, Number(p.price) || 0, Number(p.moq) || 0, p.tagline || '', p.description || '',
          (p.images || []).join('\n'), p.featured ? 'oui' : 'non', Number(p.top) || 0, p.active === false ? 'non' : 'oui', new Date()];
}

function enregistrerProduit_(p){
  const sh = feuille_(F_PRODUITS, COL_PRODUITS);
  p.name = String(p.name || '').trim();
  if (p.name.length < 2) throw new Error('Nom manquant');
  if (!(Number(p.price) > 0)) throw new Error('Prix manquant');
  const ids = colonne_(sh, 1);
  if (!p.id){
    p.id = slug_(p.name) + '-' + Date.now().toString(36);
    p.num = prochainNumero_(sh);
    sh.insertRowAfter(1);
    sh.getRange(2, 1, 1, COL_PRODUITS.length).setValues([versLigne_(p)]);
  } else {
    const i = ids.indexOf(p.id);
    if (!p.num) p.num = i > -1 ? String(sh.getRange(i + 2, 2).getValue()) : prochainNumero_(sh);
    if (i > -1) sh.getRange(i + 2, 1, 1, COL_PRODUITS.length).setValues([versLigne_(p)]);
    else sh.appendRow(versLigne_(p));
  }
  return p;
}
function supprimerProduit_(id){
  const sh = feuille_(F_PRODUITS, COL_PRODUITS);
  const i = colonne_(sh, 1).indexOf(id);
  if (i > -1) sh.deleteRow(i + 2);
  return true;
}
function enregistrerRayons_(list){
  const sh = feuille_(F_RAYONS, COL_RAYONS);
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, COL_RAYONS.length).clearContent();
  const rows = list.filter(c => c && c.key).map(c => [String(c.key), String(c.label || c.key), String(c.image || '')]);
  if (rows.length) sh.getRange(2, 1, rows.length, COL_RAYONS.length).setValues(rows);
  return true;
}
function enregistrerReglages_(s){
  const sh = feuille_(F_REGLAGES, ['cle', 'valeur']);
  const rows = [['minOrderUSD', Number(s.minOrderUSD) || 500], ['usdToXof', Number(s.usdToXof) || 600],
                ['whatsappNumber', String(s.whatsappNumber || '')]];
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 2).clearContent();
  sh.getRange(2, 1, rows.length, 2).setValues(rows);
  return true;
}
function importer_(body){
  const sh = feuille_(F_PRODUITS, COL_PRODUITS);
  if (sh.getLastRow() > 1 && !body.force) throw new Error('La feuille Produits contient déjà des produits : import annulé.');
  const rows = (body.products || []).map(versLigne_);
  if (rows.length) sh.getRange(2, 1, rows.length, COL_PRODUITS.length).setValues(rows);
  if (feuille_(F_RAYONS, COL_RAYONS).getLastRow() < 2) enregistrerRayons_(body.categories || []);
  return rows.length;
}

/* ---------------- Photos (Google Drive) ---------------- */
function envoyerPhoto_(b){
  if (!b.data) throw new Error('Photo vide');
  const blob = Utilities.newBlob(Utilities.base64Decode(b.data), b.mime || 'image/jpeg', b.name || 'photo.jpg');
  const file = dossier_().createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return {id:file.getId(), url:'https://lh3.googleusercontent.com/d/' + file.getId()};
}
function dossier_(){
  const it = DriveApp.getFoldersByName(DOSSIER_PHOTOS);
  return it.hasNext() ? it.next() : DriveApp.createFolder(DOSSIER_PHOTOS);
}

/* ---------------- Demandes WhatsApp ---------------- */
function demande_(o){
  const sh = feuille_(F_DEMANDES, COL_DEMANDES);
  const cut = (v, n) => String(v == null ? '' : v).slice(0, n);
  sh.appendRow([new Date(), cut(o.numero, 40), cut(o.produits, 1500), Number(o.total_usd) || 0, Number(o.total_fcfa) || 0,
                cut(o.expedition, 30), cut(o.pays, 60), cut(o.ville, 80)]);
  return true;
}
function listeDemandes_(){
  return lignes_(F_DEMANDES).slice(-150).reverse().map(r => ({
    date:r.date instanceof Date ? r.date.toISOString() : String(r.date), numero:r.numero, produits:r.produits,
    total_usd:r.total_usd, total_fcfa:r.total_fcfa, expedition:r.expedition, pays:r.pays, ville:r.ville
  }));
}

/* ============================================================
   OUTILS
   ============================================================ */
function json_(o){ return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function feuille_(nom, entetes){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(nom);
  if (!sh){
    sh = ss.insertSheet(nom);
    sh.getRange(1, 1, 1, entetes.length).setValues([entetes]).setFontWeight('bold').setBackground('#0B1828').setFontColor('#FFFFFF');
    sh.setFrozenRows(1);
  }
  return sh;
}
function lignes_(nom){
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nom);
  if (!sh || sh.getLastRow() < 2) return [];
  const v = sh.getRange(1, 1, sh.getLastRow(), sh.getLastColumn()).getValues();
  const h = v.shift().map(String);
  return v.filter(r => r.some(c => c !== '')).map(r => { const o = {}; h.forEach((k, i) => o[k] = r[i]); return o; });
}
function colonne_(sh, c){
  if (sh.getLastRow() < 2) return [];
  return sh.getRange(2, c, sh.getLastRow() - 1, 1).getValues().map(r => String(r[0]));
}
function prochainNumero_(sh){
  let max = 0;
  colonne_(sh, 2).forEach(n => { const m = /(\d+)\s*$/.exec(n); if (m) max = Math.max(max, Number(m[1])); });
  return 'ZG-' + ('000' + (max + 1)).slice(-4);
}
function slug_(s){
  return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'produit';
}
function vrai_(v){ return v === true || /^(oui|true|1|x|yes)$/i.test(String(v).trim()); }

/* Cache du catalogue public (5 min), découpé en morceaux de 90 Ko */
function lireCache_(){
  const c = CacheService.getScriptCache();
  const n = Number(c.get('cat_n') || 0);
  if (!n) return null;
  const keys = []; for (let i = 0; i < n; i++) keys.push('cat_' + i);
  const parts = c.getAll(keys);
  let s = '';
  for (let i = 0; i < n; i++){ if (parts['cat_' + i] == null) return null; s += parts['cat_' + i]; }
  try { return JSON.parse(s); } catch(e){ return null; }
}
function ecrireCache_(data){
  try {
    const s = JSON.stringify(data), size = 90000, obj = {};
    let n = 0;
    for (let i = 0; i < s.length; i += size) obj['cat_' + (n++)] = s.slice(i, i + size);
    obj.cat_n = String(n);
    CacheService.getScriptCache().putAll(obj, 300);
  } catch(e){}
}
function viderCache_(){ CacheService.getScriptCache().remove('cat_n'); }
function viderCacheSi_(a){ if (['saveProduct', 'deleteProduct', 'saveCategories', 'saveSettings', 'importSeed'].indexOf(a) > -1) viderCache_(); }
