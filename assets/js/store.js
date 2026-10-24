/* ============================================================================
   ZENVORA GLOBAL — ACCÈS AUX DONNÉES (partagé par le site et la gestion)
   - Google Sheets branché (CATALOGUE_ENDPOINT rempli) : lecture/écriture
     via Google Apps Script.
   - Sinon « mode démo » : catalogue de démonstration, et les modifications
     faites dans la gestion sont gardées sur cet appareil (localStorage).
   ============================================================================ */
(function(){
  'use strict';

  var ENDPOINT = (typeof CATALOGUE_ENDPOINT === 'string' ? CATALOGUE_ENDPOINT : '').trim();
  var LIVE = /^https:\/\/script\.google(usercontent)?\.com\//.test(ENDPOINT);
  var KEY_CACHE = 'zg-cache-v1';
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

  /* Racine du site (pour les photos copiées dans assets/photos/) */
  var ROOT = (function(){
    var sc = document.currentScript && document.currentScript.src;
    return sc ? sc.replace(/assets\/js\/store\.js.*$/, '') : '';
  })();
  var LOCAL = typeof LOCAL_PHOTOS === 'undefined' ? false : !!LOCAL_PHOTOS;
  function unsplashId(src){ var m = /images\.unsplash\.com\/(photo-[A-Za-z0-9-]+)/.exec(src || ''); return m ? m[1] : ''; }
  /* Adresse locale de la photo si elle a été copiée sur le site */
  function local(src){ var id = LOCAL && unsplashId(src); return id ? ROOT + 'assets/photos/' + id + '.jpg' : ''; }

  /* Photo redimensionnée selon l'hébergeur */
  function sized(src, w){
    if (!src) return '';
    if (/images\.unsplash\.com/.test(src)){
      var base = src.split('?')[0];
      return base + '?auto=format&fit=crop&w=' + w + '&q=72';
    }
    if (/lh3\.googleusercontent\.com\/d\//.test(src)) return src.split('=')[0] + '=w' + w;
    return src;
  }

  /* ---------------- Réseau ---------------- */
  function getJSON(url){
    return fetch(url, {method:'GET', redirect:'follow', cache:'no-store'}).then(function(r){
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }
  function post(payload){
    return fetch(ENDPOINT, {
      method:'POST', redirect:'follow',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body: JSON.stringify(payload)
    }).then(function(r){ return r.json(); }).then(function(res){
      if (!res || res.ok !== true) throw new Error((res && res.error) || 'Erreur du serveur');
      return res.data;
    });
  }

  /* ---------------- Chargement du catalogue ---------------- */
  function cached(){
    if (!LIVE){
      var demo = ls(KEY_DEMO);
      return demo ? normDb(demo) : seedDb();
    }
    var c = ls(KEY_CACHE);
    return c && c.db ? normDb(c.db) : null;
  }
  function load(){
    if (!LIVE) return Promise.resolve(cached());
    return getJSON(ENDPOINT + (ENDPOINT.indexOf('?') > -1 ? '&' : '?') + 'action=catalogue&t=' + Date.now())
      .then(function(res){
        if (!res || res.ok !== true) throw new Error((res && res.error) || 'Catalogue indisponible');
        var db = normDb(res.data);
        /* Feuille encore vide : on montre la démo plutôt qu'un site vide */
        if (!db.products.length){ var seed = seedDb(); seed.settings = db.settings; return seed; }
        ls(KEY_CACHE, {t: Date.now(), db: db});
        return db;
      });
  }

  /* Trace de la demande (onglet « Demandes ») — n'empêche jamais WhatsApp */
  function logRequest(order){
    if (!LIVE) return;
    try {
      var body = JSON.stringify({action:'demande', order:order});
      var blob = new Blob([body], {type:'text/plain;charset=utf-8'});
      if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, blob)) return;
      fetch(ENDPOINT, {method:'POST', mode:'no-cors', keepalive:true, headers:{'Content-Type':'text/plain;charset=utf-8'}, body:body});
    } catch(e){}
  }

  /* ---------------- Gestion (administration) ---------------- */
  var KEY_PASS = 'zg-admin-pass';
  var DEMO_PASS = 'demo';
  function pass(){ try { return sessionStorage.getItem(KEY_PASS) || ''; } catch(e){ return ''; } }
  function setPass(p){ try { if (p) sessionStorage.setItem(KEY_PASS, p); else sessionStorage.removeItem(KEY_PASS); } catch(e){} }

  function demoDb(){ return ls(KEY_DEMO) ? normDb(ls(KEY_DEMO)) : seedDb(); }
  function demoSave(db){
    if (ls(KEY_DEMO, db) !== true) throw new Error('Mémoire de l’appareil pleine : supprimez des photos importées.');
  }
  function nextNum(products){
    var max = 0;
    products.forEach(function(p){ var m = /(\d+)\s*$/.exec(p.num); if (m) max = Math.max(max, +m[1]); });
    return (SHOP_CONFIG.orderPrefix || 'ZG') + '-' + ('000' + (max + 1)).slice(-4);
  }
  function newId(name){
    var s = String(name).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
    return (s || 'produit') + '-' + Date.now().toString(36);
  }

  /* Réduit une photo du téléphone avant l'envoi (≈ 1200 px, JPEG) */
  function shrink(file, max, quality){
    max = max || 1200; quality = quality || 0.82;
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
    live: LIVE,
    login: function(p){
      if (!LIVE){
        if (p !== DEMO_PASS) return Promise.reject(new Error('Mot de passe incorrect (mode démo : « demo »).'));
        setPass(p); return Promise.resolve(true);
      }
      return post({action:'login', password:p}).then(function(){ setPass(p); return true; });
    },
    logout: function(){ setPass(''); },
    isLogged: function(){ return !!pass(); },
    load: function(){
      if (!LIVE) return Promise.resolve(demoDb());
      return post({action:'adminCatalogue', password:pass()}).then(normDb);
    },
    saveProduct: function(p){
      p = normProduct(p);
      if (!LIVE){
        var db = demoDb();
        if (!p.id){ p.id = newId(p.name); p.num = nextNum(db.products); db.products.unshift(p); }
        else {
          var i = db.products.findIndex(function(x){ return x.id === p.id; });
          if (i < 0) db.products.unshift(p); else db.products[i] = p;
        }
        demoSave(db); return Promise.resolve(p);
      }
      return post({action:'saveProduct', password:pass(), product:p}).then(normProduct);
    },
    deleteProduct: function(id){
      if (!LIVE){
        var db = demoDb();
        db.products = db.products.filter(function(x){ return x.id !== id; });
        demoSave(db); return Promise.resolve(true);
      }
      return post({action:'deleteProduct', password:pass(), id:id});
    },
    saveCategories: function(list){
      if (!LIVE){ var db = demoDb(); db.categories = list; demoSave(db); return Promise.resolve(list); }
      return post({action:'saveCategories', password:pass(), categories:list});
    },
    saveSettings: function(s){
      if (!LIVE){ var db = demoDb(); db.settings = s; demoSave(db); return Promise.resolve(s); }
      return post({action:'saveSettings', password:pass(), settings:s});
    },
    /* Envoie une photo : retourne son adresse publique */
    upload: function(file){
      return shrink(file, LIVE ? 1400 : 900, LIVE ? 0.84 : 0.74).then(function(dataUrl){
        if (!LIVE) return dataUrl;
        return post({action:'upload', password:pass(), name:(file.name || 'photo').replace(/\.[^.]+$/, '') + '.jpg',
          mime:'image/jpeg', data:dataUrl.split(',')[1]}).then(function(d){ return d.url; });
      });
    },
    importSeed: function(force){
      var seed = seedDb();
      if (!LIVE){ ls(KEY_DEMO, null); return Promise.resolve(seed); }
      return post({action:'importSeed', password:pass(), force:!!force, categories:seed.categories, products:seed.products});
    },
    demandes: function(){
      if (!LIVE) return Promise.resolve([]);
      return post({action:'demandes', password:pass()});
    },
    resetDemo: function(){ ls(KEY_DEMO, null); }
  };

  window.ZG = {
    live: LIVE, endpoint: ENDPOINT,
    load: load, cached: cached, logRequest: logRequest,
    minQty: minQty, qtyStep: qtyStep, fmtUSD: fmtUSD, fmtXOF: fmtXOF, toXof: toXof,
    sized: sized, local: local, normProduct: normProduct, seedDb: seedDb, store: ls,
    admin: admin
  };
})();
