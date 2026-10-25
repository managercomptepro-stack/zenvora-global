/* ============================================================================
   ZENVORA GLOBAL — ACCÈS AUX DONNÉES (partagé par le site et la gestion)

   Le catalogue est le fichier catalogue.json du dépôt GitHub (GITHUB_REPO).
   - Le site le lit sur raw.githubusercontent.com / jsDelivr : aucun serveur,
     aucune dépendance à Google, il s'ouvre partout et sur tous les navigateurs.
   - L'espace de gestion l'écrit directement dans le dépôt (API GitHub) avec
     une clé d'accès personnelle : chaque modification est en ligne sous ~5 min,
     sans rien redéployer.
   - Sans GITHUB_REPO : « mode démo » (modifications gardées sur l'appareil).
   Google Sheets (CATALOGUE_ENDPOINT) ne sert plus qu'à noter les demandes,
   en option : s'il est injoignable, rien n'est bloqué.
   ============================================================================ */
(function(){
  'use strict';

  var ENDPOINT = (typeof CATALOGUE_ENDPOINT === 'string' ? CATALOGUE_ENDPOINT : '').trim();
  var SHEETS = /^https:\/\/script\.google(usercontent)?\.com\//.test(ENDPOINT);
  var REPO = (typeof GITHUB_REPO === 'string' ? GITHUB_REPO : '').trim();
  var BRANCH = (typeof GITHUB_BRANCH === 'string' && GITHUB_BRANCH) || 'main';
  var GH_MODE = /^[\w.-]+\/[\w.-]+$/.test(REPO);
  var RAW = GH_MODE ? 'https://raw.githubusercontent.com/' + REPO + '/' + BRANCH + '/' : '';
  var CDN = GH_MODE ? 'https://cdn.jsdelivr.net/gh/' + REPO + '@' + BRANCH + '/' : '';
  var KEY_CACHE = 'zg-cache-v2';
  var KEY_DEMO = 'zg-demo-db-v1';
  var NNBSP = ' ', NBSP = ' ';

  function ls(key, val){
    try {
      if (val === undefined) return JSON.parse(localStorage.getItem(key));
      if (val === null) localStorage.removeItem(key);
      else localStorage.setItem(key, JSON.stringify(val));
    } catch(e){ return null; }
    return true;
  }

  /* Racine du site (là où se trouvent assets/) */
  var ROOT = (function(){
    var sc = document.currentScript && document.currentScript.src;
    return sc ? sc.replace(/assets\/js\/store\.js.*$/, '') : '';
  })();
  /* Adresse publique d'un fichier du dépôt : photos de démo sur le CDN jsDelivr,
     photos envoyées depuis la gestion sur raw (disponibles immédiatement). */
  function assetUrl(path){
    if (!/^assets\//.test(path)) return path;
    if (GH_MODE) return (/^assets\/uploads\//.test(path) ? RAW : CDN) + path;
    return ROOT + path;
  }

  /* ---------------- Normalisation ---------------- */
  function num(v, d){ var n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : (d || 0); }
  function bool(v){ return v === true || v === 1 || /^(true|1|oui|yes|x)$/i.test(String(v).trim()); }
  function normProduct(p){
    var imgs = p.images;
    if (typeof imgs === 'string') imgs = imgs.split(/\s*[\n|]\s*/);
    return {
      id: String(p.id || ''), num: String(p.num || ''), name: String(p.name || ''),
      category: String(p.category || ''), price: num(p.price), moq: Math.max(0, Math.round(num(p.moq))),
      tagline: String(p.tagline || ''), description: String(p.description || ''),
      images: (imgs || []).filter(Boolean).map(String),
      featured: bool(p.featured), top: Math.max(0, Math.round(num(p.top))),
      active: p.active === undefined || p.active === '' ? true : bool(p.active)
    };
  }
  function normDb(db){
    db = db || {};
    var s = db.settings || {};
    return {
      updated: String(db.updated || ''),
      categories: (db.categories || []).filter(function(c){ return c && c.key; })
        .map(function(c){ return {key:String(c.key), label:String(c.label || c.key), image:String(c.image || '')}; }),
      products: (db.products || []).map(normProduct).filter(function(p){ return p.id && p.name; }),
      settings: {
        minOrderUSD: num(s.minOrderUSD, SHOP_CONFIG.minOrderUSD) || SHOP_CONFIG.minOrderUSD,
        usdToXof: num(s.usdToXof, SHOP_CONFIG.usdToXof) || SHOP_CONFIG.usdToXof,
        whatsappNumber: String(s.whatsappNumber || SHOP_CONFIG.whatsappNumber)
      }
    };
  }
  function seedDb(){
    return normDb({
      categories: (typeof CATEGORIES !== 'undefined' ? CATEGORIES : []),
      products: (typeof PRODUCTS !== 'undefined' ? PRODUCTS : []),
      settings: {}
    });
  }

  /* ---------------- Règles métier ---------------- */
  /* Quantité minimum : celle fixée sur le produit, sinon de quoi atteindre
     le montant minimum de commande (500 $ par défaut). */
  function minQty(p, s){
    if (p.moq > 0) return p.moq;
    var min = (s && s.minOrderUSD) || SHOP_CONFIG.minOrderUSD;
    if (!(p.price > 0)) return 1;
    return Math.max(1, Math.ceil((min - 1e-9) / p.price));
  }
  /* Pas du sélecteur de quantité, adapté au volume */
  function qtyStep(min){
    if (min >= 1000) return 100;
    if (min >= 200) return 50;
    if (min >= 50) return 10;
    if (min >= 10) return 5;
    return 1;
  }
  function group(intStr){ return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, NNBSP); }
  function fmtUSD(n){
    n = +n || 0;
    var dec = (Math.round(n * 100) % 100 !== 0) ? 2 : 0;
    var s = n.toFixed(dec).split('.');
    return group(s[0]) + (s[1] ? ',' + s[1] : '') + NBSP + '$';
  }
  function toXof(usd, s){ return Math.round((+usd || 0) * ((s && s.usdToXof) || SHOP_CONFIG.usdToXof)); }
  function fmtXOF(n){ return group(String(Math.round(+n || 0))) + NBSP + 'FCFA'; }

  /* ---------------- Photos ---------------- */
  var LOCAL = typeof LOCAL_PHOTOS === 'undefined' ? false : !!LOCAL_PHOTOS;
  function unsplashId(src){ var m = /images\.unsplash\.com\/(photo-[A-Za-z0-9-]+)/.exec(src || ''); return m ? m[1] : ''; }
  /* Copie hébergée avec le site d'une photo de démonstration (sinon '') */
  function local(src){
    if (/^assets\//.test(src || '')) return assetUrl(src);
    var id = LOCAL && unsplashId(src);
    return id ? assetUrl('assets/photos/' + id + '.jpg') : '';
  }
  /* Photo redimensionnée selon l'hébergeur */
  function sized(src, w){
    if (!src) return '';
    if (/^assets\//.test(src)) return assetUrl(src);
    if (/images\.unsplash\.com/.test(src)) return src.split('?')[0] + '?auto=format&fit=crop&w=' + w + '&q=72';
    if (/lh3\.googleusercontent\.com\/d\//.test(src)) return src.split('=')[0] + '=w' + w;
    return src;
  }

  /* ---------------- Réseau ---------------- */
  /* fetch avec délai maximum : une connexion qui traîne ne bloque jamais le site */
  function timed(url, opts, ms){
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    if (ctrl) opts.signal = ctrl.signal;
    return new Promise(function(resolve, reject){
      var t = setTimeout(function(){ if (ctrl) ctrl.abort(); reject(new Error('Délai dépassé : la connexion ne répond pas. Vérifiez internet et réessayez.')); }, ms);
      fetch(url, opts).then(function(r){ clearTimeout(t); resolve(r); }, function(e){ clearTimeout(t); reject(new Error('Pas de connexion internet (ou site bloqué par ce réseau).')); });
    });
  }
  function getJSON(url, ms){
    return timed(url, {method:'GET', cache:'no-store'}, ms || 8000).then(function(r){
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  /* ---------------- Chargement du catalogue ---------------- */
  function newer(a, b){ return (a && a.updated || '') >= (b && b.updated || '') ? a : b; }
  function cached(){
    if (!GH_MODE){
      var demo = ls(KEY_DEMO);
      return demo ? normDb(demo) : null;
    }
    var c = ls(KEY_CACHE);
    return c ? normDb(c) : null;
  }
  function remember(db){ if (GH_MODE) ls(KEY_CACHE, db); }
  /* Essaie chaque adresse l'une après l'autre ; la première qui répond gagne. */
  function loadStatic(){
    var urls = GH_MODE
      ? [RAW + 'catalogue.json?t=' + Math.floor(Date.now() / 60000), CDN + 'catalogue.json', ROOT + 'catalogue.json']
      : [ROOT + 'catalogue.json'];
    var i = 0;
    function next(){
      if (i >= urls.length) return Promise.reject(new Error('Catalogue introuvable'));
      return getJSON(urls[i++], 7000).then(function(d){
        var db = normDb(d);
        if (!db.products.length) throw new Error('catalogue vide');
        return db;
      })['catch'](next);
    }
    return next().then(function(db){
      /* L'administrateur voit tout de suite ses propres changements (avant la mise à jour du CDN) */
      var c = cached();
      db = c && c.updated > db.updated ? c : db;
      remember(db);
      return db;
    });
  }
  function load(){
    if (!GH_MODE){ var demo = ls(KEY_DEMO); return demo ? Promise.resolve(normDb(demo)) : loadStatic()['catch'](seedDb); }
    return loadStatic()['catch'](function(){ return cached() || seedDb(); });
  }

  /* Trace de la demande dans Google Sheets (facultatif) — n'empêche jamais WhatsApp */
  function logRequest(order){
    if (!SHEETS) return;
    try {
      var body = JSON.stringify({action:'demande', order:order});
      var blob = new Blob([body], {type:'text/plain;charset=utf-8'});
      if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, blob)) return;
      fetch(ENDPOINT, {method:'POST', mode:'no-cors', keepalive:true, headers:{'Content-Type':'text/plain;charset=utf-8'}, body:body})['catch'](function(){});
    } catch(e){}
  }

  /* ============================================================
     GESTION (administration)
     ============================================================ */
  var KEY_TOKEN = 'zg-gh-key';
  var KEY_PASS = 'zg-admin-pass';
  var DEMO_PASS = 'demo';
  function token(){
    try { return localStorage.getItem(KEY_TOKEN) || sessionStorage.getItem(KEY_TOKEN) || ''; } catch(e){ return ''; }
  }
  function setToken(t, keep){
    try {
      localStorage.removeItem(KEY_TOKEN); sessionStorage.removeItem(KEY_TOKEN);
      if (t) (keep ? localStorage : sessionStorage).setItem(KEY_TOKEN, t);
    } catch(e){}
  }
  function demoPass(){ try { return sessionStorage.getItem(KEY_PASS) || ''; } catch(e){ return ''; } }
  function setDemoPass(p){ try { if (p) sessionStorage.setItem(KEY_PASS, p); else sessionStorage.removeItem(KEY_PASS); } catch(e){} }

  /* --- API GitHub --- */
  function gh(method, path, body, tok){
    var headers = {'Accept':'application/vnd.github+json', 'Authorization':'Bearer ' + (tok || token())};
    if (body) headers['Content-Type'] = 'application/json';
    return timed('https://api.github.com/repos/' + REPO + path, {
      method:method, headers:headers, cache:'no-store', body: body ? JSON.stringify(body) : undefined
    }, 90000).then(function(r){
      return r.text().then(function(t){
        var j = null; try { j = t ? JSON.parse(t) : null; } catch(e){}
        if (!r.ok){
          var msg = r.status === 401 ? 'Clé d’accès invalide ou expirée.'
            : (r.status === 403 || r.status === 404) ? 'Cette clé n’a pas le droit de modifier le dépôt ' + REPO + '.'
            : (j && j.message) || ('Erreur GitHub ' + r.status);
          var e = new Error(msg); e.status = r.status; throw e;
        }
        return j;
      });
    });
  }
  function b64enc(str){
    var bytes = new TextEncoder().encode(str), bin = '';
    for (var i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  function b64dec(b64){
    var bin = atob(String(b64).replace(/\s/g, '')), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  function ghRead(){
    return gh('GET', '/contents/catalogue.json?ref=' + encodeURIComponent(BRANCH)).then(function(f){
      return {db: normDb(JSON.parse(b64dec(f.content))), sha: f.sha};
    });
  }
  function ghWrite(db, sha, message){
    db.updated = new Date().toISOString();
    var text = JSON.stringify({updated:db.updated, categories:db.categories, products:db.products, settings:db.settings}, null, 1) + '\n';
    return gh('PUT', '/contents/catalogue.json', {message:message, content:b64enc(text), sha:sha, branch:BRANCH})
      .then(function(){ remember(db); return db; });
  }
  /* Lit la dernière version, applique la modification, enregistre.
     Si quelqu'un a modifié entre-temps (conflit), on recommence une fois. */
  function commit(mutate, message){
    function attempt(retry){
      return ghRead().then(function(cur){
        var result = mutate(cur.db);
        return ghWrite(cur.db, cur.sha, message).then(function(){ return result; });
      })['catch'](function(e){
        if (retry && (e.status === 409 || e.status === 422)) return attempt(false);
        throw e;
      });
    }
    return attempt(true);
  }

  /* --- Mode démo (appareil) --- */
  function demoDb(){ return ls(KEY_DEMO) ? normDb(ls(KEY_DEMO)) : seedDb(); }
  function demoCommit(mutate){
    var db = demoDb(), result = mutate(db);
    db.updated = new Date().toISOString();
    if (ls(KEY_DEMO, db) !== true) return Promise.reject(new Error('Mémoire de l’appareil pleine : supprimez des photos importées.'));
    return Promise.resolve(result);
  }
  function apply(mutate, message){ return GH_MODE ? commit(mutate, message) : demoCommit(mutate); }

  function nextNum(products){
    var max = 0;
    products.forEach(function(p){ var m = /(\d+)\s*$/.exec(p.num); if (m) max = Math.max(max, +m[1]); });
    return (SHOP_CONFIG.orderPrefix || 'ZG') + '-' + ('000' + (max + 1)).slice(-4);
  }
  function slug(name){
    return String(name).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'produit';
  }

  /* Réduit une photo du téléphone avant l'envoi (JPEG) */
  function shrink(file, max, quality){
    return new Promise(function(resolve, reject){
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function(){
        var k = Math.min(1, max / Math.max(img.width, img.height));
        var c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        var ctx = c.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL('image/jpeg', quality));
      };
      img.onerror = function(){ URL.revokeObjectURL(url); reject(new Error('Image illisible')); };
      img.src = url;
    });
  }

  var admin = {
    mode: GH_MODE ? 'github' : 'demo',
    live: GH_MODE,
    repo: REPO,
    login: function(secret, keep){
      secret = String(secret || '').trim();
      if (!GH_MODE){
        if (secret !== DEMO_PASS) return Promise.reject(new Error('Mot de passe incorrect (mode démo : « demo »).'));
        setDemoPass(secret); return Promise.resolve(true);
      }
      if (secret.length < 20) return Promise.reject(new Error('Collez la clé d’accès GitHub complète (elle commence par ghp_ ou github_pat_).'));
      return gh('GET', '', null, secret).then(function(r){
        if (!r || !r.permissions || !r.permissions.push) throw new Error('Cette clé peut lire le dépôt mais pas le modifier : cochez l’accès en écriture (Contents : Read and write).');
        setToken(secret, keep !== false);
        return true;
      });
    },
    logout: function(){ setToken(''); setDemoPass(''); },
    isLogged: function(){ return GH_MODE ? !!token() : !!demoPass(); },
    load: function(){
      if (!GH_MODE) return Promise.resolve(demoDb());
      return ghRead().then(function(cur){ remember(cur.db); return cur.db; });
    },
    saveProduct: function(p){
      p = normProduct(p);
      return apply(function(db){
        if (!p.id){ p.id = slug(p.name) + '-' + Date.now().toString(36); p.num = nextNum(db.products); db.products.unshift(p); }
        else {
          var i = db.products.findIndex(function(x){ return x.id === p.id; });
          if (i < 0) db.products.unshift(p); else db.products[i] = p;
        }
        return p;
      }, 'Produit : ' + p.name);
    },
    deleteProduct: function(id){
      return apply(function(db){ db.products = db.products.filter(function(x){ return x.id !== id; }); return true; }, 'Suppression du produit ' + id);
    },
    saveCategories: function(list){
      return apply(function(db){ db.categories = list; return list; }, 'Rayons mis à jour');
    },
    saveSettings: function(s){
      return apply(function(db){ db.settings = s; return s; }, 'Réglages mis à jour');
    },
    /* Envoie une photo : retourne son adresse publique */
    upload: function(file){
      if (!GH_MODE) return shrink(file, 900, 0.74);
      return shrink(file, 1400, 0.84).then(function(dataUrl){
        var name = slug((file.name || 'photo').replace(/\.[^.]+$/, '')) + '-' + Date.now().toString(36) + '.jpg';
        var path = 'assets/uploads/' + name;
        return gh('PUT', '/contents/' + path, {message:'Photo ' + name, content:dataUrl.split(',')[1], branch:BRANCH})
          .then(function(){ return RAW + path; });
      });
    },
    importSeed: function(){
      if (!GH_MODE){ ls(KEY_DEMO, null); return Promise.resolve(seedDb()); }
      var seed = seedDb();
      return apply(function(db){ db.categories = seed.categories; db.products = seed.products; return true; }, 'Catalogue de démonstration');
    },
    demandes: function(){
      return Promise.resolve(null);
    },
    resetDemo: function(){ ls(KEY_DEMO, null); }
  };

  window.ZG = {
    live: GH_MODE, repo: REPO, endpoint: ENDPOINT,
    load: load, loadStatic: loadStatic, cached: cached, logRequest: logRequest,
    minQty: minQty, qtyStep: qtyStep, fmtUSD: fmtUSD, fmtXOF: fmtXOF, toXof: toXof,
    sized: sized, local: local, assetUrl: assetUrl, normProduct: normProduct, seedDb: seedDb, store: ls,
    admin: admin
  };
})();
