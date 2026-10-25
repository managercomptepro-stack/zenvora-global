/* ============================================================================
   ZENVORA GLOBAL — espace de gestion
   Produits (ajout, modification, photos, carrousel, mise en tête, masquage),
   rayons, réglages (minimum, taux, WhatsApp) et demandes reçues.
   ============================================================================ */
(function(){
  'use strict';
  var A = ZG.admin;
  var DB = null;
  var view = {tab:'produits', q:'', cat:'all', f:'all'};

  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function norm(s){ return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function grp(n){ return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function num(v){ var n = parseFloat(String(v).replace(/\s/g, '').replace(',', '.')); return isFinite(n) ? n : 0; }
  function catLabel(k){ var c = DB.categories.filter(function(x){ return x.key === k; })[0]; return c ? c.label : k; }
  function thumb(src){ return src ? (ZG.local(src) || ZG.sized(src, 160)) : ''; }

  var toastT;
  function toast(msg, bad){
    var t = $('toast');
    t.textContent = msg; t.className = 'toast' + (bad ? ' bad' : ''); t.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(function(){ t.hidden = true; }, bad ? 4200 : 2200);
  }
  function busy(btn, on, label){
    if (!btn) return;
    if (on){ btn.dataset.l = btn.textContent; btn.textContent = label || 'Patientez…'; btn.disabled = true; }
    else { btn.textContent = btn.dataset.l || btn.textContent; btn.disabled = false; }
  }

  /* ---------------- Connexion ---------------- */
  $('modeTag').textContent = A.live ? 'En ligne' : 'Mode démo';
  $('modeTag').classList.toggle('demo', !A.live);
  if (A.live){
    $('loginLbl').textContent = 'Clé d’accès';
    $('loginPass').placeholder = 'github_pat_… ou ghp_…';
    $('loginPass').autocomplete = 'off';
    $('keepWrap').hidden = false;
  }
  $('loginHint').innerHTML = A.live ? 'Collez votre clé d’accès GitHub. Elle n’est demandée qu’une fois sur cet appareil. '
      + '<a href="https://github.com/settings/tokens/new?scopes=public_repo&description=Zenvora%20gestion" target="_blank" rel="noopener">Créer une clé</a>'
    : '<b>Mode démo</b> (Google Sheets pas encore branché) : mot de passe <b>demo</b>. Les modifications restent sur cet appareil.';
  function showLogin(){ $('login').hidden = false; $('app').hidden = true; setTimeout(function(){ $('loginPass').focus(); }, 50); }
  function showApp(){ $('login').hidden = true; $('app').hidden = false; }

  $('loginForm').addEventListener('submit', function(e){
    e.preventDefault();
    var btn = $('loginBtn');
    $('loginErr').textContent = '';
    busy(btn, true, 'Vérification…');
    A.login($('loginPass').value, $('loginKeep').checked).then(function(){ $('loginPass').value = ''; boot(); })
      ['catch'](function(err){ $('loginErr').textContent = err.message || 'Mot de passe incorrect.'; })
      .then(function(){ busy(btn, false); });
  });
  $('logout').addEventListener('click', function(){ A.logout(); DB = null; showLogin(); });

  function boot(){
    showApp();
    $('syncNote').hidden = !A.live;
    $('pList').innerHTML = '<p class="help">Chargement du catalogue…</p>';
    A.load().then(function(db){ DB = db; renderAll(); })['catch'](function(err){
      if (/mot de passe|password|autoris|clé|droit/i.test(err.message)){ A.logout(); showLogin(); $('loginErr').textContent = err.message; return; }
      $('pList').innerHTML = '<p class="err">Impossible de charger : ' + esc(err.message) + '</p>';
    });
  }

  /* ---------------- Onglets ---------------- */
  $('tabs').addEventListener('click', function(e){
    var b = e.target.closest('[data-tab]');
    if (!b) return;
    view.tab = b.getAttribute('data-tab');
    Array.prototype.forEach.call($('tabs').children, function(x){ x.toggleAttribute('aria-current', x === b); if (x === b) x.setAttribute('aria-current', 'page'); });
    ['produits', 'rayons', 'reglages', 'demandes'].forEach(function(t){ $('tab-' + t).hidden = t !== view.tab; });
    if (view.tab === 'demandes') loadDemandes();
    window.scrollTo(0, 0);
  });

  function renderAll(){ renderCatSelects(); renderProducts(); renderCats(); renderSettings(); }

  /* ============================================================
     PRODUITS
     ============================================================ */
  function renderCatSelects(){
    var opts = DB.categories.map(function(c){ return '<option value="' + esc(c.key) + '">' + esc(c.label) + '</option>'; }).join('');
    $('pCat').innerHTML = '<option value="all">Tous les rayons</option>' + opts;
    $('pCat').value = view.cat;
    $('eCat').innerHTML = opts;
  }
  function listFor(){
    var q = norm(view.q.trim());
    var list = DB.products.filter(function(p){
      if (view.cat !== 'all' && p.category !== view.cat) return false;
      if (view.f === 'featured' && !p.featured) return false;
      if (view.f === 'top' && !(p.top > 0)) return false;
      if (view.f === 'hidden' && p.active) return false;
      if (q && norm(p.name + ' ' + p.num + ' ' + p.tagline).indexOf(q) < 0) return false;
      return true;
    });
    if (view.f === 'top') list.sort(function(a, b){ return a.top - b.top; });
    return list;
  }
  function renderProducts(){
    var all = DB.products;
    $('nAll').textContent = all.length;
    $('nFeat').textContent = all.filter(function(p){ return p.featured; }).length;
    $('nTop').textContent = all.filter(function(p){ return p.top > 0; }).length;
    $('nHid').textContent = all.filter(function(p){ return !p.active; }).length;
    var help = {
      all:'Touchez un produit pour le modifier. ★ = carrousel · ↑ = en tête · œil = visible.',
      featured:'Ces produits défilent dans le ruban en haut du site.',
      top:'Ces produits s’affichent en premier dans la boutique, dans cet ordre. Utilisez les flèches pour changer l’ordre.',
      hidden:'Produits masqués du site (non supprimés).'
    };
    $('pHelp').textContent = help[view.f];
    var list = listFor();
    if (!list.length){ $('pList').innerHTML = '<p class="empty">Aucun produit ici.</p>'; return; }
    $('pList').innerHTML = list.map(function(p, i){
      var m = ZG.minQty(p, DB.settings);
      return '<div class="prow' + (p.active ? '' : ' off') + '" data-id="' + esc(p.id) + '">'
        + '<button type="button" class="prow-main" data-edit="' + esc(p.id) + '">'
        +   '<span class="pimg">' + (p.images[0] ? '<img src="' + esc(thumb(p.images[0])) + '" alt="" loading="lazy">' : '') + '</span>'
        +   '<span class="ptxt"><b>' + esc(p.name) + '</b><small>' + esc(p.num) + ' · ' + esc(catLabel(p.category)) + '</small>'
        +   '<span class="pprice">' + ZG.fmtUSD(p.price) + ' <em>min. ' + grp(m) + ' pcs</em></span></span>'
        + '</button>'
        + '<div class="pact">'
        +   (view.f === 'top'
              ? '<button type="button" class="ic" data-up="' + i + '" aria-label="Monter"' + (i === 0 ? ' disabled' : '') + '>↑</button>'
              + '<button type="button" class="ic" data-down="' + i + '" aria-label="Descendre"' + (i === list.length - 1 ? ' disabled' : '') + '>↓</button>'
              : '<button type="button" class="ic star" data-tg="featured" aria-pressed="' + p.featured + '" aria-label="Carrousel">★</button>'
              + '<button type="button" class="ic" data-tg="top" aria-pressed="' + (p.top > 0) + '" aria-label="En tête">' + (p.top > 0 ? p.top : '↑') + '</button>')
        +   '<button type="button" class="ic eye" data-tg="active" aria-pressed="' + p.active + '" aria-label="Visible">'
        +     (p.active ? '<svg viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>'
                        : '<svg viewBox="0 0 24 24"><path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4M6.1 6.1C3.5 7.9 2 12 2 12s3.5 7 10 7c1.7 0 3.2-.5 4.5-1.2"/></svg>')
        +   '</button>'
        + '</div></div>';
    }).join('');
  }
  function byId(id){ return DB.products.filter(function(p){ return p.id === id; })[0]; }
  function nextTop(){ return DB.products.reduce(function(m, p){ return Math.max(m, p.top || 0); }, 0) + 1; }
  function persist(p, msg){
    return A.saveProduct(p).then(function(saved){
      var i = DB.products.findIndex(function(x){ return x.id === saved.id; });
      if (i < 0) DB.products.unshift(saved); else DB.products[i] = saved;
      renderProducts();
      if (msg) toast(msg);
      return saved;
    })['catch'](function(err){ toast('Échec : ' + err.message, true); renderProducts(); throw err; });
  }
  $('pList').addEventListener('click', function(e){
    var b;
    if ((b = e.target.closest('[data-edit]'))){ openEditor(byId(b.getAttribute('data-edit'))); return; }
    var row = e.target.closest('.prow');
    if (!row) return;
    var p = byId(row.getAttribute('data-id'));
    if ((b = e.target.closest('[data-tg]'))){
      var k = b.getAttribute('data-tg'), c = Object.assign({}, p);
      if (k === 'featured') c.featured = !p.featured;
      if (k === 'active') c.active = !p.active;
      if (k === 'top') c.top = p.top > 0 ? 0 : nextTop();
      persist(c, k === 'featured' ? (c.featured ? 'Ajouté au carrousel' : 'Retiré du carrousel')
        : k === 'top' ? (c.top ? 'Mis en tête (n° ' + c.top + ')' : 'Retiré de la tête')
        : (c.active ? 'Visible sur le site' : 'Masqué du site'))['catch'](function(){});
      return;
    }
    if ((b = e.target.closest('[data-up],[data-down]'))){
      var list = listFor(), i = +(b.getAttribute('data-up') || b.getAttribute('data-down'));
      var j = b.hasAttribute('data-up') ? i - 1 : i + 1;
      if (!list[j]) return;
      /* on renumérote toute la tête 1, 2, 3… puis on échange les deux */
      var order = list.slice(); var tmp = order[i]; order[i] = order[j]; order[j] = tmp;
      var changes = [];
      order.forEach(function(x, n){ if (x.top !== n + 1){ var c2 = Object.assign({}, x, {top:n + 1}); changes.push(c2); } });
      changes.reduce(function(pr, c3){ return pr.then(function(){ return persist(c3); }); }, Promise.resolve())
        .then(function(){ toast('Ordre enregistré'); })['catch'](function(){});
    }
  });
  $('pSearch').addEventListener('input', function(e){ view.q = e.target.value; renderProducts(); });
  $('pCat').addEventListener('change', function(e){ view.cat = e.target.value; renderProducts(); });
  $('pFilter').addEventListener('click', function(e){
    var b = e.target.closest('[data-f]');
    if (!b) return;
    view.f = b.getAttribute('data-f');
    Array.prototype.forEach.call($('pFilter').children, function(x){ x.setAttribute('aria-pressed', String(x === b)); });
    renderProducts();
  });
  $('pNew').addEventListener('click', function(){ openEditor(null); });

  /* ---------------- Fiche d'édition ---------------- */
  var ed = null; /* produit en cours */
  function openEditor(p){
    ed = p ? JSON.parse(JSON.stringify(p)) : {id:'', num:'', name:'', category:(view.cat !== 'all' ? view.cat : (DB.categories[0] || {}).key),
      price:0, moq:0, tagline:'', description:'', images:[], featured:false, top:0, active:true};
    $('eTitle').textContent = p ? p.num + ' — modifier' : 'Nouveau produit';
    $('eName').value = ed.name;
    $('eCat').value = ed.category;
    $('ePrice').value = ed.price ? String(ed.price).replace('.', ',') : '';
    $('eMoq').value = ed.moq || '';
    $('eTag').value = ed.tagline;
    $('eDesc').value = ed.description;
    $('eFeat').checked = ed.featured;
    $('eTop').checked = ed.top > 0;
    $('eActive').checked = ed.active;
    $('eDel').hidden = !p;
    $('eErr').textContent = '';
    $('eUrl').value = '';
    renderPhotos(); renderCalc();
    $('sheet').hidden = false;
    document.documentElement.classList.add('locked');
    $('eForm').querySelector('.sheet-body').scrollTop = 0;
    if (!p) setTimeout(function(){ $('eName').focus(); }, 80);
  }
  function closeEditor(){ $('sheet').hidden = true; document.documentElement.classList.remove('locked'); ed = null; }
  $('sheet').addEventListener('click', function(e){ if (e.target.closest('[data-close]')) closeEditor(); });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && !$('sheet').hidden) closeEditor(); });

  function renderCalc(){
    var price = num($('ePrice').value), moq = parseInt($('eMoq').value, 10) || 0;
    var s = DB.settings;
    if (!(price > 0)){ $('eCalc').textContent = ''; $('eMoqHelp').textContent = 'Laissez vide : calcul automatique à partir de ' + ZG.fmtUSD(s.minOrderUSD) + '.'; return; }
    var auto = ZG.minQty({price:price, moq:0}, s), m = moq > 0 ? moq : auto;
    $('eCalc').innerHTML = '≈ <b>' + ZG.fmtXOF(ZG.toXof(price, s)) + '</b> / pièce · commande minimum <b>' + grp(m) + ' pcs</b> = ' + ZG.fmtUSD(m * price);
    $('eMoqHelp').textContent = 'Laissez vide : minimum automatique = ' + grp(auto) + ' pièces (' + ZG.fmtUSD(s.minOrderUSD) + ').';
  }
  ['ePrice', 'eMoq'].forEach(function(id){ $(id).addEventListener('input', renderCalc); });

  function renderPhotos(){
    $('ePhotos').innerHTML = ed.images.length ? ed.images.map(function(src, i){
      return '<div class="ph">'
        + '<img src="' + esc(src.indexOf('data:') === 0 ? src : thumb(src)) + '" alt="">'
        + (i === 0 ? '<span class="ph-main">Principale</span>' : '<button type="button" class="ph-first" data-first="' + i + '">En premier</button>')
        + '<button type="button" class="ph-rm" data-rm="' + i + '" aria-label="Retirer la photo">×</button>'
        + '</div>';
    }).join('') : '<p class="help">Aucune photo pour l’instant.</p>';
  }
  $('ePhotos').addEventListener('click', function(e){
    var b;
    if ((b = e.target.closest('[data-rm]'))){ ed.images.splice(+b.getAttribute('data-rm'), 1); renderPhotos(); }
    else if ((b = e.target.closest('[data-first]'))){ var i = +b.getAttribute('data-first'); ed.images.unshift(ed.images.splice(i, 1)[0]); renderPhotos(); }
  });
  $('eFiles').addEventListener('change', function(e){
    var files = Array.prototype.slice.call(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    var up = $('eUp'), done = 0;
    up.hidden = false; up.textContent = 'Envoi des photos… 0 / ' + files.length;
    $('eSave').disabled = true;
    files.reduce(function(pr, f){
      return pr.then(function(){
        return A.upload(f).then(function(url){ ed.images.push(url); done++; up.textContent = 'Envoi des photos… ' + done + ' / ' + files.length; renderPhotos(); });
      });
    }, Promise.resolve()).then(function(){ up.textContent = files.length > 1 ? 'Photos ajoutées.' : 'Photo ajoutée.'; setTimeout(function(){ up.hidden = true; }, 1600); })
      ['catch'](function(err){ up.textContent = 'Échec de l’envoi : ' + err.message; })
      .then(function(){ $('eSave').disabled = false; });
  });
  $('eUrlAdd').addEventListener('click', function(){
    var v = $('eUrl').value.trim();
    if (!/^https:\/\//.test(v)){ toast('Collez une adresse qui commence par https://', true); return; }
    ed.images.push(v); $('eUrl').value = ''; renderPhotos();
  });

  $('eForm').addEventListener('submit', function(e){
    e.preventDefault();
    var err = $('eErr');
    ed.name = $('eName').value.trim();
    ed.category = $('eCat').value;
    ed.price = Math.round(num($('ePrice').value) * 100) / 100;
    ed.moq = Math.max(0, parseInt($('eMoq').value, 10) || 0);
    ed.tagline = $('eTag').value.trim();
    ed.description = $('eDesc').value.trim();
    ed.featured = $('eFeat').checked;
    ed.active = $('eActive').checked;
    if ($('eTop').checked){ if (!(ed.top > 0)) ed.top = nextTop(); } else ed.top = 0;
    if (ed.name.length < 2){ err.textContent = 'Indiquez le nom du produit.'; $('eName').focus(); return; }
    if (!(ed.price > 0)){ err.textContent = 'Indiquez le prix unitaire en dollars.'; $('ePrice').focus(); return; }
    if (!ed.images.length){ err.textContent = 'Ajoutez au moins une photo.'; return; }
    err.textContent = '';
    var btn = $('eSave'), isNew = !ed.id;
    busy(btn, true, '…');
    persist(ed).then(function(){ closeEditor(); toast(isNew ? 'Produit ajouté' : 'Produit enregistré'); })
      ['catch'](function(x){ err.textContent = x.message; })
      .then(function(){ busy(btn, false); });
  });
  $('eDel').addEventListener('click', function(){
    if (!ed || !ed.id) return;
    if (!window.confirm('Supprimer définitivement « ' + ed.name + ' » ?')) return;
    var id = ed.id;
    A.deleteProduct(id).then(function(){
      DB.products = DB.products.filter(function(p){ return p.id !== id; });
      closeEditor(); renderProducts(); renderCats(); toast('Produit supprimé');
    })['catch'](function(x){ $('eErr').textContent = x.message; });
  });

  /* ============================================================
     RAYONS
     ============================================================ */
  var cats = [];
  function renderCats(){
    cats = DB.categories.map(function(c){ return Object.assign({}, c); });
    drawCats();
  }
  function drawCats(){
    $('cList').innerHTML = cats.map(function(c, i){
      var n = DB.products.filter(function(p){ return p.category === c.key; }).length;
      return '<div class="crow">'
        + '<div class="cmove"><button type="button" class="ic" data-cu="' + i + '"' + (i === 0 ? ' disabled' : '') + ' aria-label="Monter">↑</button>'
        + '<button type="button" class="ic" data-cd="' + i + '"' + (i === cats.length - 1 ? ' disabled' : '') + ' aria-label="Descendre">↓</button></div>'
        + '<input type="text" value="' + esc(c.label) + '" data-cl="' + i + '" maxlength="40" aria-label="Nom du rayon">'
        + '<span class="cn">' + n + '</span>'
        + '<button type="button" class="ic" data-cx="' + i + '"' + (n ? ' disabled title="Contient des produits"' : '') + ' aria-label="Supprimer">×</button>'
        + '</div>';
    }).join('');
  }
  $('cList').addEventListener('input', function(e){ var i = e.target.getAttribute('data-cl'); if (i !== null) cats[+i].label = e.target.value; });
  $('cList').addEventListener('click', function(e){
    var b, i, t;
    if ((b = e.target.closest('[data-cu]'))){ i = +b.getAttribute('data-cu'); t = cats[i]; cats[i] = cats[i - 1]; cats[i - 1] = t; drawCats(); }
    else if ((b = e.target.closest('[data-cd]'))){ i = +b.getAttribute('data-cd'); t = cats[i]; cats[i] = cats[i + 1]; cats[i + 1] = t; drawCats(); }
    else if ((b = e.target.closest('[data-cx]'))){ cats.splice(+b.getAttribute('data-cx'), 1); drawCats(); }
  });
  $('cAdd').addEventListener('click', function(){
    var label = $('cNew').value.trim();
    if (label.length < 2) return;
    var key = norm(label).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'rayon';
    while (cats.some(function(c){ return c.key === key; })) key += '-2';
    cats.push({key:key, label:label, image:''});
    $('cNew').value = '';
    drawCats();
  });
  $('cSave').addEventListener('click', function(){
    var list = cats.filter(function(c){ return c.label.trim(); }).map(function(c){ return {key:c.key, label:c.label.trim(), image:c.image || ''}; });
    var btn = $('cSave');
    busy(btn, true, 'Enregistrement…');
    A.saveCategories(list).then(function(){ DB.categories = list; renderCatSelects(); renderCats(); renderProducts(); toast('Rayons enregistrés'); })
      ['catch'](function(x){ toast('Échec : ' + x.message, true); })
      .then(function(){ busy(btn, false); });
  });

  /* ============================================================
     RÉGLAGES
     ============================================================ */
  function renderSettings(){
    var s = DB.settings;
    $('sMin').value = s.minOrderUSD;
    $('sRate').value = s.usdToXof;
    $('sWa').value = s.whatsappNumber;
    if (A.live){
      $('seedHelp').textContent = 'Attention : remplace tout le catalogue en ligne par les ' + ZG.seedDb().products.length + ' produits de démonstration (les réglages sont gardés).';
      $('seedBtn').textContent = 'Remettre le catalogue de démonstration';
    } else {
      $('seedHelp').textContent = 'Mode démo : vos modifications sont gardées sur cet appareil. Ce bouton remet le catalogue de départ.';
      $('seedBtn').textContent = 'Réinitialiser la démo';
    }
  }
  $('sForm').addEventListener('submit', function(e){
    e.preventDefault();
    var s = {minOrderUSD:Math.max(1, Math.round(num($('sMin').value))), usdToXof:Math.max(1, num($('sRate').value)),
      whatsappNumber:$('sWa').value.trim()};
    if (String(s.whatsappNumber).replace(/\D/g, '').length < 8){ toast('Numéro WhatsApp incomplet', true); return; }
    var btn = e.target.querySelector('button[type="submit"]');
    busy(btn, true, 'Enregistrement…');
    A.saveSettings(s).then(function(){ DB.settings = s; renderProducts(); toast('Réglages enregistrés'); })
      ['catch'](function(x){ toast('Échec : ' + x.message, true); })
      .then(function(){ busy(btn, false); });
  });
  $('seedBtn').addEventListener('click', function(){
    var msg = A.live ? 'Remplacer TOUT le catalogue en ligne par le catalogue de démonstration ?' : 'Effacer vos modifications de démo et revenir au catalogue de départ ?';
    if (!window.confirm(msg)) return;
    var btn = $('seedBtn');
    busy(btn, true, 'Import…');
    A.importSeed(false).then(function(){ return A.load(); }).then(function(db){ DB = db; renderAll(); toast('Catalogue importé'); })
      ['catch'](function(x){ toast(x.message, true); })
      .then(function(){ busy(btn, false); renderSettings(); });
  });

  /* ============================================================
     DEMANDES
     ============================================================ */
  function loadDemandes(){
    $('dList').innerHTML = ''; return;
    $('dList').innerHTML = '<p class="help">Chargement…</p>';
    A.demandes().then(function(rows){
      if (!rows || !rows.length){ $('dList').innerHTML = '<p class="empty">Aucune demande pour l’instant.</p>'; return; }
      $('dList').innerHTML = rows.map(function(r){
        var d = new Date(r.date);
        return '<div class="drow"><div class="dtop"><b>' + esc(r.numero) + '</b><small>' + (isNaN(d) ? esc(r.date) : d.toLocaleString('fr-FR', {dateStyle:'short', timeStyle:'short'})) + '</small></div>'
          + '<p>' + esc(r.produits) + '</p>'
          + '<div class="dbot"><span>' + esc(r.pays) + ' · ' + esc(r.ville) + ' · ' + esc(r.expedition) + '</span><b>' + ZG.fmtUSD(r.total_usd) + '</b></div></div>';
      }).join('');
    })['catch'](function(x){ $('dList').innerHTML = '<p class="err">' + esc(x.message) + '</p>'; });
  }

  /* ---------------- Démarrage ---------------- */
  if (A.isLogged()) boot(); else showLogin();
})();
