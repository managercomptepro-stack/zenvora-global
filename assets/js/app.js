/* ============================================================================
   ZENVORA GLOBAL — logique du site
   Carrousel des produits en avant, rayons, catalogue, fiche produit,
   liste de commande et envoi de la commande sur WhatsApp.
   Réglages : assets/js/config.js · Données : assets/js/store.js
   ============================================================================ */
(function(){
  'use strict';

  var doc = document.documentElement;
  doc.classList.add('js-on');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var CFG = SHOP_CONFIG;
  var STORE_CART = 'zg-liste';
  var STORE_CLIENT = 'zg-client';

  /* ---------------- État ---------------- */
  var DB = {categories:[], products:[], settings:{}};
  var S = {};                 /* réglages actifs (minimum, taux, WhatsApp) */
  var LIVE_P = [];            /* produits visibles */
  var BY_ID = {}, CAT_LABEL = {};

  /* ---------------- Utilitaires ---------------- */
  function $(id){ return document.getElementById(id); }
  function esc(s){
    return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  function plural(n, w){ return n + ' ' + w + (n > 1 ? 's' : ''); }
  function norm(s){ return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' '); }
  function icon(n){ return '<svg aria-hidden="true"><use href="#i-' + n + '"/></svg>'; }
  function usd(n){ return ZG.fmtUSD(n); }
  function xof(n){ return ZG.fmtXOF(ZG.toXof(n, S)); }
  function minQ(p){ return ZG.minQty(p, S); }
  function plain(s){ return String(s).replace(/[  ]/g, ' '); }
  function grp(n){ return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }

  /* Image responsive (Unsplash / Google Drive / adresse libre) */
  function pic(src, o){
    o = o || {};
    if (!src) return '';
    var cls = o.cls ? ' class="' + o.cls + '"' : '';
    var load = o.eager ? ' fetchpriority="high"' : ' loading="lazy"';
    var loc = ZG.local(src);
    if (loc) return '<img' + cls + ' src="' + esc(loc) + '" data-fb="' + esc(ZG.sized(src, 800)) + '" alt="' + esc(o.alt || '') + '"' + load + ' decoding="async">';
    var resizable = /images\.unsplash\.com|lh3\.googleusercontent\.com\/d\//.test(src);
    if (!resizable) return '<img' + cls + ' src="' + esc(src) + '" alt="' + esc(o.alt || '') + '"' + load + ' decoding="async">';
    var ws = o.widths || [360, 600, 900];
    return '<img' + cls + ' src="' + esc(ZG.sized(src, ws[1] || ws[0])) + '"'
      + ' srcset="' + ws.map(function(w){ return esc(ZG.sized(src, w)) + ' ' + w + 'w'; }).join(', ') + '"'
      + ' sizes="' + esc(o.sizes || '(max-width:760px) 50vw, 20vw') + '" alt="' + esc(o.alt || '') + '"' + load + ' decoding="async">';
  }
  /* Une photo qui ne charge pas disparaît : le fond de marque reste */
  document.addEventListener('error', function(e){
    var t = e.target;
    if (!t || t.tagName !== 'IMG') return;
    var fb = t.getAttribute('data-fb');
    if (fb && t.getAttribute('src') !== fb){ t.removeAttribute('srcset'); t.src = fb; return; }
    t.classList.add('is-broken');
  }, true);

  function waBase(){ return 'https://wa.me/' + String(S.whatsappNumber || CFG.whatsappNumber).replace(/[^0-9]/g, ''); }
  function waLink(text){ return waBase() + (text ? '?text=' + encodeURIComponent(plain(text)) : ''); }
  function store(k, v){ return ZG.store(k, v); }

  /* ============================================================
     DONNÉES → AFFICHAGE
     ============================================================ */
  function apply(db){
    DB = db;
    S = db.settings;
    LIVE_P = db.products.filter(function(p){ return p.active && p.price > 0; });
    BY_ID = {}; LIVE_P.forEach(function(p){ BY_ID[p.id] = p; });
    CAT_LABEL = {}; db.categories.forEach(function(c){ CAT_LABEL[c.key] = c.label; });
    renderStatic();
    renderCarousel();
    renderHeroCats();
    renderRayons();
    renderMenu();
    renderShelves();
    renderCats();
    renderGrid();
    cart = sanitizeCart(cart);
    renderCart();
    openFromHash();
  }

  /* ---------------- Textes, compteurs, liens ---------------- */
  var countriesFilled = false;
  function renderStatic(){
    var minTxt = usd(S.minOrderUSD);
    ['tbMin', 'shopMin'].forEach(function(k){ var el = $(k); if (el) el.textContent = minTxt; });
    $('heroCount').textContent = LIVE_P.length;
    $('heroCountries').textContent = CFG.countries.length;
    $('heroCatsN').textContent = DB.categories.filter(function(c){ return catItems(c.key).length; }).length;
    $('year').textContent = new Date().getFullYear();
    var hello = 'Bonjour Zenvora Global, je souhaite avoir des informations.';
    $('hdrWa').href = waLink(hello);
    $('ftrWa').href = waLink(hello);
    $('heroWa').href = waLink('Bonjour Zenvora Global, je cherche un produit précis à importer de Chine : ');
    var fab = $('waFab');
    fab.href = waLink(hello); fab.hidden = false;
    $('ftrCats').innerHTML = DB.categories.map(function(c){
      return '<li><a href="#boutique" data-cat="' + esc(c.key) + '">' + esc(c.label) + '</a></li>';
    }).join('');
    $('ftrCountries').textContent = 'Livraison : ' + CFG.countries.join(' · ');
    Array.prototype.forEach.call(document.querySelectorAll('[data-bg]'), function(el){
      var src = AMBIANCE[el.getAttribute('data-bg')];
      if (src && !el.firstChild) el.innerHTML = pic(src, {widths:[600, 900, 1300], sizes:'(max-width:900px) 100vw, 40vw'});
    });
    if (!countriesFilled){
      countriesFilled = true;
      /* Bandeau du haut : contenu doublé pour le défilement continu sur mobile */
      var tb = document.querySelector('.tb-track');
      if (tb) tb.insertAdjacentHTML('beforeend', tb.innerHTML.replace(/<span>/g, '<span class="dup" aria-hidden="true">'));
      var opts = CFG.countries.concat(['Autre pays']).map(function(c){ return '<option>' + esc(c) + '</option>'; }).join('');
      $('pmCountry').innerHTML = opts;
      $('cCountry').innerHTML = opts;
      var segs = CFG.shipping.map(function(m, i){
        return '<label><input type="radio" name="__N__" value="' + esc(m) + '"' + (i === 0 ? ' checked' : '') + '><span>'
          + icon(/a[ée]rien/i.test(m) ? 'plane' : 'ship') + esc(m) + '</span></label>';
      }).join('');
      $('pmShip').innerHTML = segs.replace(/__N__/g, 'pmShip');
      $('cShip').innerHTML = segs.replace(/__N__/g, 'cShip');
      fillClient();
    }
  }

  /* ============================================================
     HERO — ruban des produits en avant (défile, se fige au toucher)
     ============================================================ */
  var track = $('carTrack'), carBox = $('carousel');
  var slides = [];
  var SPEED = window.innerWidth < 760 ? 46 : 58;    /* px par seconde */
  var RESUME = 3000;
  var pos = 0, last = 0, held = false, seen = true, smoothing = false, holdTimer = null, ticking = false;

  function featuredList(){
    var f = LIVE_P.filter(function(p){ return p.featured; });
    if (f.length < 4) f = f.concat(LIVE_P.filter(function(p){ return !p.featured && p.top; }).slice(0, 8 - f.length));
    if (f.length < 4) f = LIVE_P.slice(0, 8);
    return f;
  }
  function slideHtml(p, i, clone){
    return '<button type="button" class="car-slide"' + (clone ? ' tabindex="-1" aria-hidden="true"' : '')
      + ' data-open-product="' + esc(p.id) + '">'
      + '<span class="car-img">' + pic(p.images[0], {alt: clone ? '' : p.name, eager: !clone && i < 3,
          widths:[400, 640, 900], sizes:'(max-width:760px) 62vw, 280px'}) + '</span>'
      + '<span class="tag tag-moq">Min. ' + grp(minQ(p)) + ' pcs</span>'
      + '<span class="car-glass"><b>' + esc(p.name) + '</b>'
      + '<span class="car-price"><strong>' + usd(p.price) + '</strong><small>' + xof(p.price) + '</small></span></span>'
      + '</button>';
  }
  function renderCarousel(){
    slides = featuredList();
    track.innerHTML = slides.map(function(p, i){ return slideHtml(p, i, false); }).join('')
                    + slides.map(function(p, i){ return slideHtml(p, i, true); }).join('');
    pos = 0; track.scrollLeft = 0;
    if (slides.length && !ticking){ ticking = true; requestAnimationFrame(tick); }
  }
  function loopW(){
    var a = track.children[0], b = track.children[slides.length];
    return (a && b) ? (b.offsetLeft - a.offsetLeft) : (track.scrollWidth / 2 || 1);
  }
  function cardW(){
    var a = track.children[0], b = track.children[1];
    return (a && b) ? (b.offsetLeft - a.offsetLeft) : 280;
  }
  function wrapX(x){ var w = loopW(); return ((x % w) + w) % w; }
  function tick(now){
    requestAnimationFrame(tick);
    var dt = last ? Math.min(now - last, 64) : 16; last = now;
    if (reduce || held || smoothing || document.hidden || !seen || !slides.length) return;
    pos = wrapX(pos + SPEED * dt / 1000);
    track.scrollLeft = pos;
  }
  function hold(){ held = true; clearTimeout(holdTimer); }
  function release(){
    clearTimeout(holdTimer);
    holdTimer = setTimeout(function(){ held = false; smoothing = false; last = 0; pos = wrapX(track.scrollLeft); }, RESUME);
  }
  function room(){ if (track.scrollLeft < cardW()){ track.scrollLeft += loopW(); pos = track.scrollLeft; } }
  ['touchstart', 'wheel'].forEach(function(ev){ track.addEventListener(ev, hold, {passive:true}); });
  ['touchend', 'touchcancel'].forEach(function(ev){ track.addEventListener(ev, release, {passive:true}); });
  track.addEventListener('scroll', function(){
    if (smoothing) return;
    var w = loopW();
    if (track.scrollLeft >= w){ track.scrollLeft -= w; pos = track.scrollLeft; }
  }, {passive:true});
  var drag = null;
  track.addEventListener('pointerdown', function(e){
    hold();
    if (e.pointerType !== 'mouse' || e.button) return;
    room();
    drag = {x:e.clientX, from:track.scrollLeft, moved:0};
    track.classList.add('is-drag');
  });
  track.addEventListener('pointermove', function(e){
    if (!drag) return;
    var dx = e.clientX - drag.x;
    drag.moved = Math.max(drag.moved, Math.abs(dx));
    track.scrollLeft = drag.from - dx;
  });
  function endDrag(){
    if (drag && drag.moved > 6){
      track.addEventListener('click', function(ev){ ev.preventDefault(); ev.stopPropagation(); }, {capture:true, once:true});
    }
    drag = null; track.classList.remove('is-drag'); release();
  }
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function(ev){ track.addEventListener(ev, function(){ if (drag) endDrag(); }); });
  track.addEventListener('mouseenter', hold);
  track.addEventListener('mouseleave', function(){ if (!drag) release(); });
  function step(dir){
    hold();
    if (dir < 0) room();
    smoothing = true;
    track.scrollTo({left: track.scrollLeft + dir * cardW(), behavior: reduce ? 'auto' : 'smooth'});
    setTimeout(function(){ smoothing = false; pos = wrapX(track.scrollLeft); }, 600);
    release();
  }
  $('carNext').addEventListener('click', function(){ step(1); });
  $('carPrev').addEventListener('click', function(){ step(-1); });
  track.addEventListener('keydown', function(e){
    if (e.key === 'ArrowRight'){ e.preventDefault(); step(1); }
    if (e.key === 'ArrowLeft'){ e.preventDefault(); step(-1); }
  });
  track.addEventListener('focusin', hold);
  track.addEventListener('focusout', release);
  if ('IntersectionObserver' in window){
    new IntersectionObserver(function(en){ seen = en[0].isIntersecting; }, {threshold:.05}).observe(carBox);
  }

  /* ============================================================
     RAYONS — mosaïque des catégories
     ============================================================ */
  function catItems(key){ return LIVE_P.filter(function(p){ return p.category === key; }); }
  function liveCats(){ return DB.categories.filter(function(c){ return catItems(c.key).length; }); }
  function catImg(c){
    if (c.image) return c.image;
    var items = catItems(c.key);
    var f = items.filter(function(p){ return p.featured && p.images[0]; })[0] || items.filter(function(p){ return p.images[0]; })[0];
    return f ? f.images[0] : '';
  }
  function fromPrice(key){
    var items = catItems(key);
    return items.length ? Math.min.apply(null, items.map(function(p){ return p.price; })) : 0;
  }
  /* Colonne des catégories du hero (ordinateur) */
  function renderHeroCats(){
    $('heroCats').innerHTML = liveCats().map(function(c){
      return '<li><button type="button" data-cat="' + esc(c.key) + '">'
        + '<span class="hc-img">' + pic(catImg(c), {widths:[120], sizes:'28px'}) + '</span>'
        + '<span class="hc-l">' + esc(c.label) + '</span><small>' + catItems(c.key).length + '</small></button></li>';
    }).join('');
  }
  /* Mosaïque de toutes les catégories */
  var rayOpen = false;
  function renderRayons(){
    var cats = liveCats();
    var mobile = window.innerWidth < 760, limit = mobile && !rayOpen ? 12 : cats.length;
    $('rayNote').textContent = cats.length + ' rayons · ' + LIVE_P.length + ' produits';
    $('rayGrid').innerHTML = cats.slice(0, limit).map(function(c){
      var from = fromPrice(c.key);
      return '<button type="button" class="ray" data-cat="' + esc(c.key) + '">'
        + '<span class="ray-img">' + pic(catImg(c), {widths:[300, 500], sizes:'(max-width:760px) 30vw, 14vw'}) + '</span>'
        + '<span class="ray-txt"><b>' + esc(c.label) + '</b><small>' + plural(catItems(c.key).length, 'produit')
        + (from ? ' · dès ' + usd(from) : '') + '</small></span>'
        + '</button>';
    }).join('');
    var more = $('rayMore');
    more.hidden = !(mobile && cats.length > 12);
    more.innerHTML = rayOpen ? '<span>Réduire</span>' : '<span>Voir les ' + cats.length + ' catégories</span>' + icon('arrow');
  }
  $('rayMore').addEventListener('click', function(){ rayOpen = !rayOpen; renderRayons(); if (!rayOpen) $('rayons').scrollIntoView({behavior: reduce ? 'auto' : 'smooth'}); });

  /* Menu « Catégories » (en-tête) */
  function renderMenu(){
    var cats = liveCats();
    $('menuSub').textContent = cats.length + ' rayons · ' + LIVE_P.length + ' produits en gros';
    $('menuGrid').innerHTML = cats.map(function(c){
      return '<button type="button" class="mcat" data-cat="' + esc(c.key) + '">'
        + '<span class="mcat-img">' + pic(catImg(c), {widths:[160], sizes:'56px'}) + '</span>'
        + '<span class="mcat-t"><b>' + esc(c.label) + '</b><small>' + plural(catItems(c.key).length, 'produit') + ' · dès ' + usd(fromPrice(c.key)) + '</small></span>'
        + icon('arrow') + '</button>';
    }).join('');
  }
  $('catBtn').addEventListener('click', function(){ openLayer('menu', $('catBtn')); });

  /* Vitrines : une rangée défilante par grand rayon */
  function renderShelves(){
    var keys = (typeof SHELVES !== 'undefined' ? SHELVES : []).filter(function(k){ return catItems(k).length >= 3; });
    $('shelves').innerHTML = keys.map(function(k){
      var items = selectionOrder(catItems(k)).slice(0, 12);
      return '<section class="shelf" aria-label="' + esc(CAT_LABEL[k]) + '"><div class="wrap">'
        + '<div class="shelf-head"><h2>' + esc(CAT_LABEL[k]) + '</h2>'
        + '<button type="button" class="sec-link" data-cat="' + esc(k) + '">Voir les ' + catItems(k).length + ' ' + icon('arrow') + '</button></div>'
        + '<div class="shelf-track">' + items.map(function(p, i){ return cardHTML(p, i, true); }).join('') + '</div>'
        + '</div></section>';
    }).join('');
  }

  /* ============================================================
     BOUTIQUE — filtres & grille
     ============================================================ */
  var filter = {cat:'all', q:'', sort:'default'};
  function pageSize(){ var w = window.innerWidth; return w < 760 ? 10 : (w < 1200 ? 16 : 20); }
  var PAGE = pageSize(), shown = PAGE, appendFrom = 0;
  var grid = $('grid'), catsEl = $('cats');

  function renderCats(){
    catsEl.innerHTML = [{key:'all', label:'Tout'}].concat(DB.categories).map(function(c){
      var n = c.key === 'all' ? LIVE_P.length : catItems(c.key).length;
      if (c.key !== 'all' && !n) return '';
      return '<button type="button" class="chip" data-cat="' + esc(c.key) + '" aria-pressed="' + (c.key === filter.cat) + '">'
        + esc(c.label) + '<small>' + n + '</small></button>';
    }).join('');
  }

  /* Ordre « Sélection » : produits mis en tête (1, 2, 3…), puis en avant,
     puis le reste en alternant les rayons pour une vitrine variée. */
  function selectionOrder(list){
    var top = list.filter(function(p){ return p.top > 0; }).sort(function(a, b){ return a.top - b.top; });
    var rest = list.filter(function(p){ return !(p.top > 0); });
    var feat = rest.filter(function(p){ return p.featured; });
    var other = rest.filter(function(p){ return !p.featured; });
    if (filter.cat !== 'all') return top.concat(feat, other);
    var buckets = {}, order = [];
    other.forEach(function(p){
      if (!buckets[p.category]){ buckets[p.category] = []; order.push(p.category); }
      buckets[p.category].push(p);
    });
    var mixed = [], more = true;
    while (more){
      more = false;
      order.forEach(function(k){ var x = buckets[k].shift(); if (x){ mixed.push(x); more = true; } });
    }
    return top.concat(feat, mixed);
  }
  function filtered(){
    var q = norm(filter.q.trim());
    var list = LIVE_P.filter(function(p){
      if (filter.cat !== 'all' && p.category !== filter.cat) return false;
      if (q){
        var hay = norm([p.name, p.num, p.num.replace(/\D/g, ''), p.tagline, p.description, CAT_LABEL[p.category]].join(' '));
        return q.split(/\s+/).every(function(w){ return hay.indexOf(w) > -1; });
      }
      return true;
    });
    if (filter.sort === 'asc') list.sort(function(a, b){ return a.price - b.price; });
    else if (filter.sort === 'desc') list.sort(function(a, b){ return b.price - a.price; });
    else if (filter.sort === 'moq') list.sort(function(a, b){ return minQ(a) - minQ(b) || a.price - b.price; });
    else if (filter.sort === 'name') list.sort(function(a, b){ return a.name.localeCompare(b.name, 'fr'); });
    else list = selectionOrder(list);
    return list;
  }

  function cardHTML(p, i, shelf){
    var m = minQ(p);
    return '<article class="card' + (shelf ? ' in' : '') + '" style="--d:' + ((i % PAGE) % 5) * 60 + 'ms">'
      + '<button type="button" class="card-hit" data-open-product="' + esc(p.id) + '" aria-label="' + esc(p.name + ', ' + plain(usd(p.price))) + '">'
      +   '<span class="card-media">'
      +     pic(p.images[0], {alt:p.name, eager:i < 4, sizes:'(max-width:760px) 50vw, (max-width:1200px) 25vw, 20vw'})
      +     (p.images[1] ? pic(p.images[1], {cls:'alt', alt:'', sizes:'(max-width:760px) 50vw, 20vw'}) : '')
      +   '</span>'
      +   '<span class="tag tag-moq">Min. ' + grp(m) + ' pcs</span>'
      +   (p.featured ? '<span class="tag tag-hot">Tendance</span>' : '')
      +   '<span class="card-glass">'
      +     '<b class="card-title">' + esc(p.name) + '</b>'
      +     '<span class="card-tag">' + esc(p.tagline || CAT_LABEL[p.category] || '') + '</span>'
      +     '<span class="card-price"><strong>' + usd(p.price) + '</strong><small>' + xof(p.price) + '</small></span>'
      +   '</span>'
      + '</button>'
      + '<button type="button" class="card-add" data-quick-add="' + esc(p.id) + '" aria-label="Ajouter à ma liste : ' + esc(p.name) + '">' + icon('plus') + '</button>'
      + '</article>';
  }

  function renderGrid(){
    var list = filtered();
    Array.prototype.forEach.call(catsEl.querySelectorAll('.chip'), function(ch){
      ch.setAttribute('aria-pressed', String(ch.getAttribute('data-cat') === filter.cat));
    });
    $('shopLabel').textContent = filter.q.trim() ? 'Résultats pour « ' + filter.q.trim() + ' »'
      : (filter.cat === 'all' ? 'Tous les produits' : CAT_LABEL[filter.cat] || 'Produits');
    $('resultCount').textContent = plural(list.length, 'produit');
    if (!list.length){
      grid.innerHTML = '<div class="empty"><h3>Aucun produit trouvé</h3><p>Essayez un autre mot, ou demandez-nous directement : nous trouvons le produit en Chine.</p>'
        + '<div class="empty-cta"><button type="button" class="btn btn-ghost-d" id="resetFilters"><span>Tout afficher</span></button>'
        + '<a class="btn btn-wa" target="_blank" rel="noopener noreferrer" href="' + esc(waLink('Bonjour Zenvora Global, je cherche ce produit : ' + filter.q)) + '">' + icon('wa') + '<span>Demander sur WhatsApp</span></a></div></div>';
      $('moreWrap').hidden = true;
      return;
    }
    var from = appendFrom; appendFrom = 0;
    if (from > 0 && grid.querySelector('.card')){
      grid.insertAdjacentHTML('beforeend', list.slice(from, shown).map(function(p, k){ return cardHTML(p, from + k); }).join(''));
    } else {
      grid.innerHTML = list.slice(0, shown).map(cardHTML).join('');
    }
    watchCards();
    var rest = list.length - Math.min(shown, list.length);
    $('moreWrap').hidden = rest <= 0;
    if (rest > 0){
      var next = list.slice(shown, shown + 4);
      $('moreBtn').innerHTML = '<span class="more-thumbs" aria-hidden="true">' + next.map(function(p){
          return '<span>' + pic(p.images[0], {widths:[120], sizes:'40px'}) + '</span>';
        }).join('') + '</span>'
        + '<span class="more-txt"><b>Voir ' + plural(Math.min(rest, PAGE), 'produit') + ' de plus</b>'
        + '<small>' + Math.min(shown, list.length) + ' sur ' + list.length + '</small></span>' + icon('arrow');
      $('moreProg').style.width = (Math.min(shown, list.length) / list.length * 100).toFixed(1) + '%';
    }
  }

  var cardIO = ('IntersectionObserver' in window && !reduce) ? new IntersectionObserver(function(en){
    en.forEach(function(x){ if (x.isIntersecting){ x.target.classList.add('in'); cardIO.unobserve(x.target); } });
  }, {threshold:.05, rootMargin:'0px 0px -3% 0px'}) : null;
  function watchCards(){
    Array.prototype.forEach.call(grid.querySelectorAll('.card:not(.in)'), function(c){
      if (cardIO) cardIO.observe(c); else c.classList.add('in');
    });
  }

  var hdr = $('hdr');
  function scrollToShop(){
    var el = $('boutique');
    window.scrollTo({top: el.getBoundingClientRect().top + window.scrollY - hdr.offsetHeight + 1, behavior: reduce ? 'auto' : 'smooth'});
  }

  catsEl.addEventListener('click', function(e){
    var ch = e.target.closest('.chip');
    if (!ch) return;
    filter.cat = ch.getAttribute('data-cat');
    shown = PAGE;
    renderGrid();
    ch.scrollIntoView({block:'nearest', inline:'center', behavior: reduce ? 'auto' : 'smooth'});
    if ($('boutique').getBoundingClientRect().top < 0) scrollToShop();
  });
  var searchTimer, searchEl = $('search');
  searchEl.addEventListener('input', function(){
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function(){
      filter.q = searchEl.value; shown = PAGE; renderGrid();
      var r = $('boutique').getBoundingClientRect();
      if (filter.q.trim() && (r.top > window.innerHeight * .6 || r.bottom < 0)) scrollToShop();
    }, 220);
  });
  searchEl.addEventListener('keydown', function(e){ if (e.key === 'Enter'){ e.preventDefault(); searchEl.blur(); scrollToShop(); } });
  $('sort').addEventListener('change', function(e){ filter.sort = e.target.value; shown = PAGE; renderGrid(); });

  document.addEventListener('click', function(e){
    var t;
    if ((t = e.target.closest('[data-open-product]'))){
      openProduct(t.getAttribute('data-open-product'), t);
    } else if ((t = e.target.closest('[data-quick-add]'))){
      var p = BY_ID[t.getAttribute('data-quick-add')];
      if (p) addToCart(p.id, minQ(p));
    } else if (e.target.closest('#moreBtn')){
      appendFrom = shown;
      shown += PAGE;
      renderGrid();
    } else if ((t = e.target.closest('[data-cat]')) && !t.classList.contains('chip')){
      e.preventDefault();
      filter.cat = t.getAttribute('data-cat');
      filter.q = ''; searchEl.value = '';
      shown = PAGE;
      renderGrid();
      scrollToShop();
      var chip = catsEl.querySelector('[data-cat="' + filter.cat + '"]');
      if (chip) setTimeout(function(){ chip.scrollIntoView({block:'nearest', inline:'center'}); }, 400);
    } else if (e.target.closest('#resetFilters')){
      filter = {cat:'all', q:'', sort:filter.sort};
      searchEl.value = '';
      shown = PAGE;
      renderGrid();
    } else if (e.target.closest('[data-open-cart]')){
      openLayer('cart');
    }
  });

  /* ---------------- Header & barre de filtres collante ---------------- */
  function syncHeader(){ doc.style.setProperty('--hdr-h', hdr.offsetHeight + 'px'); }
  syncHeader();
  window.addEventListener('resize', function(){
    syncHeader();
    var p = pageSize();
    if (p !== PAGE){ PAGE = p; }
  }, {passive:true});
  var stuck = false;
  window.addEventListener('scroll', function(){
    var s = window.scrollY > 8;
    if (s !== stuck){ stuck = s; hdr.classList.toggle('is-stuck', s); }
    $('waFab').classList.toggle('is-shown', window.scrollY > 400);
  }, {passive:true});

  /* ============================================================
     CALQUES (fiche produit, liste)
     ============================================================ */
  var stack = [], returnFocus = {};
  function openLayer(id, opener){
    var el = $(id);
    if (!el.hidden) return;
    returnFocus[id] = opener || document.activeElement;
    el.hidden = false;
    stack.push(id);
    doc.classList.add('is-locked');
    var f = el.querySelector('.x-btn');
    if (f) setTimeout(function(){ f.focus({preventScroll:true}); }, 30);
  }
  function closeLayer(id){
    var el = $(id);
    if (!el || el.hidden) return;
    el.hidden = true;
    stack = stack.filter(function(s){ return s !== id; });
    if (id === 'pm') clearHash();
    if (!stack.length) doc.classList.remove('is-locked');
    var r = returnFocus[id];
    if (r && r.focus && document.contains(r)) r.focus({preventScroll:true});
  }
  document.addEventListener('click', function(e){
    var c = e.target.closest('[data-close]');
    if (!c) return;
    var layer = c.closest('.layer, .drawer');
    if (layer) closeLayer(layer.id);
  });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && stack.length){ closeLayer(stack[stack.length - 1]); return; }
    if (e.key !== 'Tab' || !stack.length) return;
    var box = $(stack[stack.length - 1]);
    var items = Array.prototype.filter.call(box.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea'
    ), function(el){ return el.offsetParent !== null; });
    if (!items.length) return;
    var first = items[0], lastEl = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first){ e.preventDefault(); lastEl.focus(); }
    else if (!e.shiftKey && document.activeElement === lastEl){ e.preventDefault(); first.focus(); }
  });

  /* ============================================================
     FICHE PRODUIT
     ============================================================ */
  var pm = {p:null, qty:1, min:1, img:0};
  var qtyEl = $('pmQty');

  function openProduct(id, opener){
    var p = BY_ID[id];
    if (!p) return;
    pm = {p:p, min:minQ(p), qty:minQ(p), img:0};
    $('pmCat').textContent = CAT_LABEL[p.category] || '';
    $('pmNum').textContent = p.num;
    $('pmTitle').textContent = p.name;
    $('pmDesc').innerHTML = (p.tagline ? '<b>' + esc(p.tagline) + '.</b> ' : '') + esc(p.description);
    $('pmPrice').textContent = usd(p.price);
    $('pmXof').textContent = xof(p.price) + ' / pièce';
    var auto = !(p.moq > 0);
    $('pmMoq').innerHTML = 'Commande minimum : <b>' + grp(pm.min) + ' pièce' + (pm.min > 1 ? 's' : '') + '</b>'
      + (auto ? ' <span>(' + usd(S.minOrderUSD) + ' minimum par commande)</span>' : '');
    var thumbs = $('pmThumbs');
    thumbs.hidden = p.images.length < 2;
    thumbs.innerHTML = p.images.length < 2 ? '' : p.images.map(function(src, i){
      return '<button type="button" data-thumb="' + i + '" aria-label="Photo ' + (i + 1) + '" aria-current="' + (i === 0) + '">'
        + pic(src, {widths:[120], sizes:'48px'}) + '</button>';
    }).join('');
    showImage(0);
    $('pmAsk').href = waLink('Bonjour Zenvora Global, j’ai une question sur le produit ' + p.num + ' — ' + p.name + ' : ');
    $('pmErr').textContent = '';
    setQty(pm.min);
    openLayer('pm', opener);
    try { history.replaceState(null, '', '#produit-' + p.id); } catch(e){}
  }
  function showImage(i){
    var p = pm.p;
    pm.img = i;
    $('pmMain').innerHTML = pic(p.images[i], {alt:p.name, eager:true, widths:[600, 900, 1300], sizes:'(max-width:760px) 100vw, 55vw'});
    Array.prototype.forEach.call($('pmThumbs').querySelectorAll('[data-thumb]'), function(b){
      b.setAttribute('aria-current', String(+b.getAttribute('data-thumb') === i));
    });
  }
  $('pmThumbs').addEventListener('click', function(e){
    var b = e.target.closest('[data-thumb]');
    if (b) showImage(+b.getAttribute('data-thumb'));
  });
  /* Balayage de la photo sur mobile */
  (function(){
    var x0 = null, box = $('pmMain');
    box.addEventListener('touchstart', function(e){ x0 = e.touches[0].clientX; }, {passive:true});
    box.addEventListener('touchend', function(e){
      if (x0 === null || !pm.p || pm.p.images.length < 2) return;
      var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) < 40) return;
      var n = pm.p.images.length;
      showImage((pm.img + (dx < 0 ? 1 : -1) + n) % n);
    }, {passive:true});
  })();

  function readQty(){ var n = parseInt(String(qtyEl.value).replace(/\D/g, ''), 10); return isFinite(n) ? n : 0; }
  function setQty(n){
    pm.qty = Math.max(pm.min, Math.min(999999, n));
    qtyEl.value = grp(pm.qty);
    renderPmTotal();
  }
  function renderPmTotal(){
    var q = readQty(), p = pm.p;
    var under = q < pm.min;
    var t = Math.max(q, pm.min) * p.price;
    $('pmTotal').textContent = usd(t);
    $('pmTotalXof').textContent = xof(t);
    qtyEl.classList.toggle('is-invalid', under);
    $('pmMinus').disabled = q <= pm.min;
  }
  var stepOf = function(){ return ZG.qtyStep(pm.min); };
  $('pmMinus').addEventListener('click', function(){
    var s = stepOf(), q = readQty();
    setQty(q - (q % s === 0 ? s : q % s));
  });
  $('pmPlus').addEventListener('click', function(){
    var s = stepOf(), q = readQty();
    setQty(q + (s - (q % s || 0)) );
  });
  qtyEl.addEventListener('input', function(){
    var raw = qtyEl.value.replace(/\D/g, '').slice(0, 6);
    qtyEl.value = raw;
    renderPmTotal();
    $('pmErr').textContent = '';
  });
  qtyEl.addEventListener('blur', function(){
    var q = readQty();
    if (q < pm.min){ $('pmErr').textContent = 'Minimum pour ce produit : ' + grp(pm.min) + ' pièces. Quantité ajustée.'; }
    setQty(q);
  });
  qtyEl.addEventListener('focus', function(){ qtyEl.value = String(readQty() || ''); qtyEl.select(); });

  function shipChoice(name){ var r = document.querySelector('input[name="' + name + '"]:checked'); return r ? r.value : CFG.shipping[0]; }
  function setShip(name, v){
    Array.prototype.forEach.call(document.querySelectorAll('input[name="' + name + '"]'), function(r){ r.checked = r.value === v; });
  }

  /* Client mémorisé sur l'appareil (pays, ville, mode d'expédition) */
  function fillClient(){
    var c = store(STORE_CLIENT) || {};
    var country = c.pays || CFG.countries[0];
    $('pmCountry').value = country; $('cCountry').value = country;
    if (c.ville){ $('pmCity').value = c.ville; $('cCity').value = c.ville; }
    if (c.exp){ setShip('pmShip', c.exp); setShip('cShip', c.exp); }
  }
  function saveClient(pays, ville, exp){
    store(STORE_CLIENT, {pays:pays, ville:ville, exp:exp});
    $('pmCountry').value = pays; $('cCountry').value = pays;
    $('pmCity').value = ville; $('cCity').value = ville;
    setShip('pmShip', exp); setShip('cShip', exp);
  }

  function requestNumber(){
    var d = new Date(), p2 = function(n){ return ('0' + n).slice(-2); };
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', r = '';
    for (var i = 0; i < 4; i++) r += chars.charAt(Math.floor(Math.random() * chars.length));
    return (CFG.orderPrefix || 'ZG') + '-' + String(d.getFullYear()).slice(2) + p2(d.getMonth() + 1) + p2(d.getDate()) + '-' + r;
  }
  function productUrl(p){ return location.origin + location.pathname + '#produit-' + p.id; }

  /* Ouvre WhatsApp (nouvel onglet sur ordinateur, appli sur mobile) */
  function goWhatsApp(text){
    var a = document.createElement('a');
    a.href = waLink(text); a.target = '_blank'; a.rel = 'noopener noreferrer';
    document.body.appendChild(a); a.click(); a.remove();
  }

  $('pmForm').addEventListener('submit', function(e){
    e.preventDefault();
    var p = pm.p;
    if (!p) return;
    var q = readQty();
    if (q < pm.min){ setQty(pm.min); $('pmErr').textContent = 'Quantité ajustée au minimum : ' + grp(pm.min) + ' pièces.'; return; }
    var city = $('pmCity').value.trim(), country = $('pmCountry').value;
    if (city.length < 2){ $('pmErr').textContent = 'Indiquez votre ville de livraison.'; $('pmCity').focus(); return; }
    var exp = shipChoice('pmShip');
    saveClient(country, city, exp);
    var total = q * p.price, ref = requestNumber();
    var msg = [
      'Bonjour Zenvora Global, je souhaite commander :',
      '',
      'Produit : ' + p.name,
      'Référence : ' + p.num,
      'Quantité : ' + grp(q) + ' pièce' + (q > 1 ? 's' : ''),
      'Prix unitaire : ' + usd(p.price) + ' (' + xof(p.price) + ')',
      'Total : ' + usd(total) + ' (' + xof(total) + ')',
      'Expédition : ' + exp,
      'Pays : ' + country,
      'Ville : ' + city,
      '',
      'Demande n° ' + ref,
      'Lien : ' + productUrl(p),
      '',
      'Merci de me confirmer la disponibilité et les frais d’expédition.'
    ].join('\n');
    ZG.logRequest({numero:ref, date:new Date().toISOString(), produits:p.num + ' ' + p.name + ' × ' + q,
      total_usd:Math.round(total * 100) / 100, total_fcfa:ZG.toXof(total, S), expedition:exp, pays:country, ville:city});
    goWhatsApp(msg);
  });
  $('pmCity').addEventListener('input', function(){ $('pmErr').textContent = ''; });
  $('pmAdd').addEventListener('click', function(){
    if (!pm.p) return;
    var q = Math.max(readQty(), pm.min);
    var id = pm.p.id;
    closeLayer('pm');
    addToCart(id, q);
  });

  function clearHash(){
    if (/^#produit-/.test(location.hash)){
      try { history.replaceState(null, '', location.pathname + location.search); } catch(e){}
    }
  }
  function openFromHash(){
    var m = /^#produit-(.+)$/.exec(location.hash);
    if (m && BY_ID[decodeURIComponent(m[1])] && $('pm').hidden) openProduct(decodeURIComponent(m[1]));
  }
  window.addEventListener('hashchange', openFromHash);

  /* ============================================================
     MA LISTE — plusieurs produits dans un seul message
     ============================================================ */
  var cart = store(STORE_CART) || [];
  function sanitizeCart(raw){
    if (!Array.isArray(raw)) return [];
    if (!LIVE_P.length) return raw;
    return raw.filter(function(l){
      var p = l && BY_ID[l.id];
      if (!p) return false;
      l.qty = Math.max(minQ(p), parseInt(l.qty, 10) || 0);
      return true;
    });
  }
  function saveCart(){ store(STORE_CART, cart); renderCart(); }
  function cartTotal(){ return cart.reduce(function(s, l){ return s + BY_ID[l.id].price * l.qty; }, 0); }

  function addToCart(id, qty){
    var p = BY_ID[id];
    var line = cart.filter(function(l){ return l.id === id; })[0];
    if (line) line.qty = Math.max(minQ(p), qty);
    else cart.push({id:id, qty:Math.max(minQ(p), qty)});
    saveCart();
    var badge = $('cartCount');
    badge.classList.remove('is-bump'); void badge.offsetWidth; badge.classList.add('is-bump');
    toast(p, '<b>' + esc(p.name) + '</b> ajouté · ' + grp(line ? line.qty : Math.max(minQ(p), qty)) + ' pcs', 'Voir', function(){ openLayer('cart'); });
  }
  function renderCart(){
    var n = cart.length, total = n ? cartTotal() : 0;
    var badge = $('cartCount');
    badge.hidden = n === 0;
    badge.textContent = n;
    document.body.classList.toggle('has-cartbar', n > 0);
    $('cartbarQty').textContent = plural(n, 'produit') + ' dans ma liste';
    $('cartbarTotal').textContent = usd(total);
    if (!n){
      $('cartBody').innerHTML = '<div class="cart-empty">' + icon('list')
        + '<h3>Votre liste est vide</h3><p>Ajoutez plusieurs produits avec le bouton <b>+</b>, puis envoyez toute la commande en un seul message WhatsApp.</p>'
        + '<button type="button" class="btn btn-main" data-close data-go-shop><span>Voir les produits</span></button></div>';
      $('cartFoot').hidden = true;
      return;
    }
    $('cartBody').innerHTML = cart.map(function(l, i){
      var p = BY_ID[l.id], m = minQ(p);
      return '<div class="line">'
        + '<button type="button" class="line-img" data-open-product="' + esc(p.id) + '">' + pic(p.images[0], {widths:[160], sizes:'64px'}) + '</button>'
        + '<div class="line-main">'
        +   '<div class="line-top"><span class="line-num">' + esc(p.num) + '</span><b>' + esc(p.name) + '</b></div>'
        +   '<span class="line-unit">' + usd(p.price) + ' / pce · min. ' + grp(m) + '</span>'
        +   '<div class="line-bot">'
        +     '<div class="qty sm">'
        +       '<button type="button" data-dec="' + i + '" aria-label="Diminuer"' + (l.qty <= m ? ' disabled' : '') + '>' + icon('minus') + '</button>'
        +       '<output>' + grp(l.qty) + '</output>'
        +       '<button type="button" data-inc="' + i + '" aria-label="Augmenter">' + icon('plus') + '</button>'
        +     '</div>'
        +     '<b class="line-price">' + usd(p.price * l.qty) + '</b>'
        +   '</div>'
        + '</div>'
        + '<button type="button" class="line-rm" data-rm="' + i + '" aria-label="Retirer ' + esc(p.name) + '">' + icon('x') + '</button>'
        + '</div>';
    }).join('');
    $('cartTotals').innerHTML = '<div><span>' + plural(n, 'produit') + '</span><b>' + usd(total) + '</b></div>'
      + '<div class="t-x"><span>Soit</span><b>' + xof(total) + '</b></div>'
      + '<p>Hors frais d’expédition et de dédouanement, confirmés sur WhatsApp.</p>';
    $('cartFoot').hidden = false;
  }
  $('cartBody').addEventListener('click', function(e){
    var b, i;
    if ((b = e.target.closest('[data-inc]'))){
      i = +b.getAttribute('data-inc'); var p = BY_ID[cart[i].id], s = ZG.qtyStep(minQ(p));
      cart[i].qty += s - (cart[i].qty % s || 0); saveCart();
    } else if ((b = e.target.closest('[data-dec]'))){
      i = +b.getAttribute('data-dec'); var p2 = BY_ID[cart[i].id], s2 = ZG.qtyStep(minQ(p2)), q = cart[i].qty;
      cart[i].qty = Math.max(minQ(p2), q - (q % s2 === 0 ? s2 : q % s2)); saveCart();
    } else if ((b = e.target.closest('[data-rm]'))){
      cart.splice(+b.getAttribute('data-rm'), 1); saveCart();
    } else if (e.target.closest('[data-go-shop]')){
      setTimeout(scrollToShop, 60);
    } else if ((b = e.target.closest('[data-open-product]'))){
      closeLayer('cart');
    }
  });
  $('cartFoot').addEventListener('submit', function(e){
    e.preventDefault();
    if (!cart.length) return;
    var city = $('cCity').value.trim(), country = $('cCountry').value, exp = shipChoice('cShip');
    if (city.length < 2){ $('cartErr').textContent = 'Indiquez votre ville de livraison.'; $('cCity').focus(); return; }
    $('cartErr').textContent = '';
    saveClient(country, city, exp);
    var total = cartTotal(), ref = requestNumber();
    var lines = cart.map(function(l, i){
      var p = BY_ID[l.id];
      return (i + 1) + '. ' + p.name + ' (' + p.num + ')\n   ' + grp(l.qty) + ' pcs × ' + usd(p.price) + ' = ' + usd(p.price * l.qty);
    });
    var msg = ['Bonjour Zenvora Global, je souhaite commander :', ''].concat(lines, [
      '',
      'Total : ' + usd(total) + ' (' + xof(total) + ')',
      'Expédition : ' + exp,
      'Pays : ' + country,
      'Ville : ' + city,
      '',
      'Demande n° ' + ref,
      '',
      'Merci de me confirmer la disponibilité et les frais d’expédition.'
    ]).join('\n');
    ZG.logRequest({numero:ref, date:new Date().toISOString(),
      produits:cart.map(function(l){ var p = BY_ID[l.id]; return p.num + ' ' + p.name + ' × ' + l.qty; }).join(' | '),
      total_usd:Math.round(total * 100) / 100, total_fcfa:ZG.toXof(total, S), expedition:exp, pays:country, ville:city});
    goWhatsApp(msg);
  });
  $('cCity').addEventListener('input', function(){ $('cartErr').textContent = ''; });

  /* ---------------- Notifications ---------------- */
  function toast(p, html, label, action){
    var box = $('toasts');
    var el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = (p ? '<span class="t-img">' + pic(p.images[0], {widths:[120], sizes:'40px'}) + '</span>' : '')
      + '<span>' + html + '</span>' + (label ? '<button type="button">' + esc(label) + '</button>' : '');
    if (label) el.querySelector('button').addEventListener('click', function(){ action(); remove(); });
    box.appendChild(el);
    while (box.children.length > 2) box.removeChild(box.firstChild);
    var timer = setTimeout(remove, 3200);
    function remove(){
      clearTimeout(timer);
      el.classList.add('out');
      setTimeout(function(){ if (el.parentNode) el.parentNode.removeChild(el); }, 300);
    }
  }

  /* ============================================================
     DÉMARRAGE : affichage immédiat (cache ou démo), puis catalogue frais
     ============================================================ */
  var first = ZG.cached();
  if (first) apply(first); else grid.innerHTML = '<div class="loading"><i></i><i></i><i></i><i></i><i></i></div>';
  if (ZG.live){
    ZG.load().then(function(db){
      var keepScroll = window.scrollY;
      apply(db);
      window.scrollTo(0, keepScroll);
    })['catch'](function(err){
      console.warn('[Zenvora] Catalogue en ligne indisponible :', err);
      if (!first) apply(ZG.seedDb());
    });
  }
})();
