/* ============================================================================
   ZENVORA GLOBAL — CATALOGUE DE DÉMONSTRATION
   ----------------------------------------------------------------------------
   Sert tant que Google Sheets n'est pas branché, et s'importe en un clic dans
   Google Sheets depuis l'espace de gestion. Ensuite, la gestion fait foi.

   ⚠ PRIX INDICATIFS (démonstration) : remplacez-les par vos prix fournisseurs.
   Photos : Unsplash (licence libre, usage commercial autorisé), copiées dans
   assets/photos/. Remplacez-les par les photos de vos fournisseurs.

   CHAMPS : id, num, name, category, price ($), moq (facultatif), tagline,
   description, images, featured (carrousel), top (ordre en tête), active
   ============================================================================ */

const CATEGORIES = [
  { key: "motos",          label: "Motos & tricycles" },
  { key: "voitures",       label: "Voitures & utilitaires" },
  { key: "pieces-auto",    label: "Pièces auto & pneus" },
  { key: "telephones",     label: "Téléphones" },
  { key: "acc-tel",        label: "Accessoires téléphone" },
  { key: "electronique",   label: "TV, audio & sécurité" },
  { key: "informatique",   label: "Informatique & bureau" },
  { key: "electromenager", label: "Électroménager" },
  { key: "solaire",        label: "Énergie & solaire" },
  { key: "femmes",         label: "Mode femme" },
  { key: "hommes",         label: "Mode homme" },
  { key: "enfants",        label: "Enfant & bébé" },
  { key: "chaussures",     label: "Chaussures" },
  { key: "sacs",           label: "Sacs & maroquinerie" },
  { key: "bijoux",         label: "Bijoux, montres & lunettes" },
  { key: "textile",        label: "Tissus & pagnes" },
  { key: "beaute",         label: "Beauté & cheveux" },
  { key: "maison",         label: "Cuisine & maison" },
  { key: "meubles",        label: "Meubles" },
  { key: "construction",   label: "Construction & sanitaire" },
  { key: "electricite",    label: "Électricité & éclairage" },
  { key: "outils",         label: "Outils & quincaillerie" },
  { key: "machines",       label: "Machines & industrie" },
  { key: "agriculture",    label: "Agriculture" },
  { key: "jouets",         label: "Jouets & jeux" },
  { key: "sport",          label: "Sport & vélos" },
  { key: "emballage",      label: "Emballage & stockage" },
  { key: "papeterie",      label: "Papeterie & scolaire" }
];

/* Rayons mis en vitrine sur l'accueil (une rangée chacun) */
const SHELVES = ["motos", "voitures", "telephones", "electromenager", "solaire", "femmes", "construction"];

/* Photos d'ambiance */
const AMBIANCE = {
  maritime: "https://images.unsplash.com/photo-1578575437130-527eed3abbec",
  aerien:   "https://images.unsplash.com/photo-1774698078446-59299e016718",
  port:     "https://images.unsplash.com/photo-1759272840538-ae4b07214c71",
  entrepot: "https://images.unsplash.com/photo-1627309366653-2dedc084cdf1"
};

const PRODUCTS = (function(){
  var U = function(id){ return "https://images.unsplash.com/" + id; };
  var list = [];
  function slug(s){
    return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }
  /* P(rayon, nom, prix $, [photos], accroche, description, {f:carrousel, t:ordre en tête, moq}) */
  function P(cat, name, price, imgs, tagline, description, o){
    o = o || {};
    var n = list.length + 1;
    list.push({
      id: slug(name) + "-" + n, num: "ZG-" + ("000" + n).slice(-4),
      name: name, category: cat, price: price, moq: o.moq || 0,
      tagline: tagline, description: description, images: imgs.map(U),
      featured: !!o.f, top: o.t || 0, active: true
    });
  }

  /* ================= MOTOS & TRICYCLES ================= */
  P("motos", "Moto routière 150 cc", 620, ["photo-1591637333184-19aa84b3e01f"], "Moto-taxi, usage quotidien",
    "Moto robuste et économique, la plus utilisée en moto-taxi. Livrée en caisse, montage sur place.", {f:1, t:1});
  P("motos", "Tricycle cargo motorisé", 1350, ["photo-1791137612019-db68a897c837"], "Benne arrière, 200 cc",
    "Tricycle de transport de marchandises, très demandé par les commerçants et livreurs.", {f:1, t:4});
  P("motos", "Tricycle électrique à paniers", 780, ["photo-1758256554954-c19e82f54faa"], "Batterie lithium, silencieux",
    "Tricycle électrique pour livraisons urbaines et petits commerces.");
  P("motos", "Moto sportive 250 cc", 1450, ["photo-1568772585407-9361f9bf3a87"], "Carénage intégral",
    "Moto sportive au look racé, pour une clientèle passionnée.");
  P("motos", "Moto custom 200 cc", 980, ["photo-1596687760372-4c0d266059a7"], "Style cruiser, selle basse",
    "Moto custom confortable pour les longs trajets.");
  P("motos", "Moto tout-terrain 200 cc", 890, ["photo-1606907568152-58fcb0a0a4e5"], "Pistes et brousse",
    "Moto trail adaptée aux routes non goudronnées.", {f:1});
  P("motos", "Moto naked 150 cc", 760, ["photo-1609630875171-b1321377ee65", "photo-1588627541420-fce3f661b779"], "Orange et noir",
    "Moto au style naked, moteur 150 cc économique.");
  P("motos", "Scooter 125 cc", 540, ["photo-1554223789-df81106a45ed"], "Automatique, coffre sous selle",
    "Scooter automatique 125 cc, idéal en ville.");
  P("motos", "Scooter rétro 50 cc", 480, ["photo-1519750292352-c9fc17322ed7"], "Design vintage",
    "Scooter au style rétro, très apprécié en ville.");
  P("motos", "Scooter jaune 125 cc", 560, ["photo-1584737131144-5b76ba8c4147"], "Coloris vifs au choix",
    "Scooter 125 cc disponible en plusieurs couleurs.");
  P("motos", "Scooter électrique", 690, ["photo-1547838277-a5db4d13e8c0"], "Recharge sur prise",
    "Scooter électrique silencieux, coût d'usage très faible.");
  P("motos", "Casque intégral moto", 12.5, ["photo-1627530980937-b8721b91506a", "photo-1590506995460-d0d9892b54da"], "Visière, tailles M à XL",
    "Casque intégral avec visière, à vendre avec chaque moto.");

  /* ================= VOITURES & UTILITAIRES ================= */
  P("voitures", "Berline compacte essence", 8900, ["photo-1560009320-c01920eef9f8", "photo-1606400142640-69e81d222bcb"], "Boîte manuelle ou automatique",
    "Berline familiale économique. Modèle, année et options à confirmer selon le stock du fournisseur.", {f:1, t:2});
  P("voitures", "SUV 7 places", 15800, ["photo-1693532331766-bfcec4163ce4"], "Grand coffre, climatisation",
    "SUV familial spacieux, très demandé pour les flottes et les particuliers.", {f:1});
  P("voitures", "Citadine rouge", 6900, ["photo-1550355291-bbee04a92027"], "Petite consommation",
    "Petite voiture idéale en ville et pour les VTC.");
  P("voitures", "Berline blanche", 9800, ["photo-1722088386522-7cafb8a7e234", "photo-1668692753102-a9603d87a1a7"], "Taxi et VTC",
    "Berline robuste, la couleur blanche est la plus demandée pour les taxis.");
  P("voitures", "Pick-up double cabine 4x4", 17500, ["photo-1686715018049-f73970aa97d3"], "Diesel, plateau arrière",
    "Pick-up tout-terrain pour chantiers, plantations et transport.", {f:1});
  P("voitures", "Pick-up cabine simple", 12900, ["photo-1605504835488-e8c6d37beb43"], "Utilitaire de travail",
    "Pick-up de travail à grand plateau.");
  P("voitures", "Camion de transport", 28000, ["photo-1620844621455-fe8698f241d6", "photo-1616340786004-7c444e530ce3"], "Charge utile importante",
    "Camion pour transport de marchandises. Tonnage et carrosserie à préciser.");
  P("voitures", "Camion porteur coloré", 26500, ["photo-1681004478577-cb7f8421f78c"], "Routes difficiles",
    "Camion porteur robuste pour longues distances.");
  P("voitures", "Petit camion utilitaire", 9500, ["photo-1721976090805-7bb3f8b00a7d"], "Livraisons en ville",
    "Mini-camion pour livraisons urbaines, faible consommation.");
  P("voitures", "Berline noire haut de gamme", 21000, ["photo-1541447270888-83e8494f9c06"], "Finitions premium",
    "Berline confortable pour clientèle d'affaires et location.");

  /* ================= PIÈCES AUTO & PNEUS ================= */
  P("pieces-auto", "Pneus tourisme (lot)", 32, ["photo-1571335746824-742511d49bce", "photo-1760836395767-d469a16b7f21"], "Toutes dimensions",
    "Pneus neufs pour voitures, dimensions selon vos besoins.", {t:9});
  P("pieces-auto", "Pneus pour camions", 145, ["photo-1578844251758-2f71da64c96f"], "Poids lourds",
    "Pneus renforcés pour camions et bus.");
  P("pieces-auto", "Jantes alliage", 48, ["photo-1601411101851-ea0e07766235", "photo-1616788902258-138db56fe7e5"], "15 à 18 pouces",
    "Jantes en alliage, plusieurs designs.");
  P("pieces-auto", "Disques et étriers de frein", 22, ["photo-1760317890314-e964ffd7e6a6", "photo-1760317890322-364a810cd4da"], "Freinage complet",
    "Disques, plaquettes et étriers pour les modèles les plus courants.");
  P("pieces-auto", "Batterie auto 12 V", 38, ["photo-1676337167629-d896b3ed5724"], "60 à 100 Ah",
    "Batteries de démarrage pour voitures et utilitaires.");
  P("pieces-auto", "Pièces moteur", 18, ["photo-1666148647370-8730124d1376", "photo-1632733711679-529326f6db12"], "Sur référence",
    "Pièces moteur à commander sur référence : filtres, courroies, pompes, joints.");
  P("pieces-auto", "Pneus et jante montés", 65, ["photo-1444947295498-07f60c19a4ff"], "Prêt à poser",
    "Roues complètes montées et équilibrées.");
  P("pieces-auto", "Stock de pneus d'occasion", 9, ["photo-1477823986828-5aff156284aa"], "Vrac, tailles mélangées",
    "Lot de pneus pour revente, prix au pneu.");

  /* ================= TÉLÉPHONES ================= */
  P("telephones", "Smartphone Android 6,5 pouces", 68, ["photo-1592890288564-76628a30a657"], "Double SIM, 64 Go",
    "Smartphone grand écran double SIM. Configuration à confirmer avec le fournisseur.", {f:1, t:3});
  P("telephones", "Smartphone dos dégradé", 85, ["photo-1787734081268-01a06df25f4a"], "128 Go, triple caméra",
    "Smartphone au dos en verre dégradé, très apprécié pour son design.");
  P("telephones", "Smartphone écran incurvé", 120, ["photo-1772831902679-3f41c106d7a2"], "Haut de gamme",
    "Écran incurvé bord à bord, grande autonomie.", {f:1});
  P("telephones", "Smartphone écran AMOLED", 95, ["photo-1598327105666-5b89351aff97"], "Couleurs éclatantes",
    "Smartphone à écran AMOLED, 128 Go de stockage.");
  P("telephones", "Smartphone entrée de gamme", 42, ["photo-1596207891316-23851be3cc20"], "Prix serré, double SIM",
    "Le téléphone le plus vendu en volume : simple, robuste, économique.");
  P("telephones", "Smartphone blanc", 74, ["photo-1634403665481-74948d815f03"], "Design épuré", "Smartphone blanc, 64 ou 128 Go.");
  P("telephones", "Smartphone 128 Go", 99, ["photo-1511707171634-5f897ff02aa9"], "Grande mémoire", "Smartphone 128 Go, batterie longue durée.");
  P("telephones", "Smartphone grand écran", 135, ["photo-1600577231598-31ea4cb50da3"], "6,8 pouces", "Très grand écran, idéal vidéo et réseaux sociaux.");
  P("telephones", "Tablette Android 10 pouces", 78, ["photo-1623126908029-58cb08a2b272", "photo-1604399852419-f67ee7d5f2ef"], "Wi-Fi + SIM",
    "Tablette pour études, bureau et divertissement.");

  /* ================= ACCESSOIRES TÉLÉPHONE ================= */
  P("acc-tel", "Écouteurs sans fil Bluetooth", 3.8, ["photo-1606220588913-b3aacb4d2f46", "photo-1606220945770-b5b6c2c55bf1"], "Boîtier de charge",
    "Écouteurs sans fil avec boîtier de recharge. Emballage personnalisable.", {f:1, t:6});
  P("acc-tel", "Écouteurs sans fil noirs", 3.2, ["photo-1578319439584-104c94d37305"], "Compacts", "Écouteurs Bluetooth compacts, son clair.");
  P("acc-tel", "Batterie externe 10 000 mAh", 4.6, ["photo-1566554738544-d962991c3fee"], "Double sortie USB",
    "Batterie de secours, indispensable face aux coupures d'électricité.");
  P("acc-tel", "Batterie externe 20 000 mAh", 7.2, ["photo-1706275399494-fb26bbc5da63"], "Grande capacité", "Plusieurs recharges complètes.");
  P("acc-tel", "Câbles USB-C et Lightning", 0.45, ["photo-1585995603413-eb35b5f4a50b"], "1 m, gaine renforcée", "Câbles de charge et de données.");
  P("acc-tel", "Chargeur secteur rapide", 1.9, ["photo-1635861321688-b63d28749a82"], "Charge rapide", "Chargeur mural USB.");
  P("acc-tel", "Coques de protection", 0.9, ["photo-1594843665794-446ce915d840"], "Tous modèles", "Coques assorties selon les téléphones les plus vendus.");
  P("acc-tel", "Kit écouteurs, coque et chargeur", 5.5, ["photo-1639521234037-8160317e81d9"], "Pack revente", "Lot d'accessoires pour boutiques de téléphonie.");
  P("acc-tel", "Casque audio", 6.8, ["photo-1590658268037-6bf12165a8df"], "Arceau réglable", "Casque filaire ou Bluetooth.");

  /* ================= TV, AUDIO & SÉCURITÉ ================= */
  P("electronique", "Téléviseur LED 43 pouces", 128, ["photo-1593784991251-92ded75ea290"], "Full HD", "Téléviseur LED 43 pouces, HDMI et USB.", {f:1, t:7});
  P("electronique", "Smart TV 55 pouces", 210, ["photo-1595935736128-db1f0a261263"], "4K, applications", "Téléviseur connecté 55 pouces.");
  P("electronique", "Téléviseur 32 pouces", 85, ["photo-1597406462637-eb560874d1f8"], "Format compact", "Idéal chambres et petits salons.");
  P("electronique", "Enceinte Bluetooth portable", 9.5, ["photo-1589003077984-894e133dabab"], "Autonomie longue", "Enceinte sans fil, son puissant.");
  P("electronique", "Enceinte nomade blanche", 7.8, ["photo-1582978571763-2d039e56f0c3"], "Format de poche", "Petite enceinte Bluetooth.");
  P("electronique", "Caméras de surveillance", 14, ["photo-1557597774-9d273605dfa9", "photo-1563920443079-783e5c786b83"], "Vision nocturne",
    "Caméras de vidéosurveillance pour boutiques, maisons et entrepôts.");
  P("electronique", "Caméra extérieure sur mât", 19, ["photo-1589935447067-5531094415d1"], "Étanche", "Caméra extérieure résistante aux intempéries.");
  P("electronique", "Radio rechargeable", 6.5, ["photo-1650785652040-5a2fc88ce902"], "FM, USB, Bluetooth", "Radio portable rechargeable.");
  P("electronique", "Montre connectée", 6.9, ["photo-1579586337278-3befd40fd17a", "photo-1624096104992-9b4fa3a279dd"], "Notifications, sport",
    "Notifications, podomètre, fréquence cardiaque.", {f:1});
  P("electronique", "Manette de jeu sans fil", 5.2, ["photo-1655560378428-7605bda51749"], "PC et mobile", "Manette sans fil pour jeux vidéo.");

  /* ================= INFORMATIQUE & BUREAU ================= */
  P("informatique", "Ordinateur portable 15 pouces", 185, ["photo-1531297484001-80022131f5a1"], "Bureautique", "Pour études et bureau.");
  P("informatique", "Ordinateur portable fin 14 pouces", 240, ["photo-1778157781167-07e0a5d5c82f"], "Léger, métal", "Portable fin et léger.");
  P("informatique", "Écran PC 24 pouces", 72, ["photo-1547658718-1cdaa0852790", "photo-1619597455322-4fbbd820250a"], "Full HD", "Écran bureautique et cybercafés.");
  P("informatique", "Poste de travail complet", 260, ["photo-1517518295033-d5ab8ca078cc"], "Écran, clavier, souris", "Ensemble bureautique prêt à l'emploi.");
  P("informatique", "Imprimante multifonction", 68, ["photo-1612815154858-60aa4c59eaa6", "photo-1650094980833-7373de26feb6"], "Imprime, copie, scanne",
    "Imprimante pour bureaux, écoles et boutiques de services.");
  P("informatique", "Imprimante grand format", 2400, ["photo-1693031630369-bd429a57f115"], "Bâches et banderoles", "Pour imprimeries et agences de communication.");
  P("informatique", "Chaise de bureau", 28, ["photo-1688578735352-9a6f2ac3b70a", "photo-1612372606404-0ab33e7187ee"], "Ergonomique, roulettes",
    "Chaise de bureau réglable.");
  P("informatique", "Mobilier de bureau", 95, ["photo-1594235048794-fae8583a5af5"], "Tables et chaises", "Ensemble pour open-space et salles de réunion.");

  /* ================= ÉLECTROMÉNAGER ================= */
  P("electromenager", "Climatiseur split 12 000 BTU", 215, ["photo-1762341123870-d706f257a12e", "photo-1726614846573-c1ac2e6161d1"], "Inverter, économique",
    "Climatiseur mural avec télécommande.", {f:1, t:5});
  P("electromenager", "Réfrigérateur américain", 420, ["photo-1588854337115-1c67d9247e4d"], "Grande capacité", "Réfrigérateur double porte.");
  P("electromenager", "Réfrigérateur 3 portes", 380, ["photo-1484154218962-a197022b5858"], "Inox", "Réfrigérateur-congélateur trois portes.", {f:1});
  P("electromenager", "Lave-linge hublot 7 kg", 165, ["photo-1626806787461-102c1bfaaea1", "photo-1604335399105-a0c585fd81a1"], "Programmes multiples", "Lave-linge frontal 7 kg.");
  P("electromenager", "Lave-linge 8 kg", 185, ["photo-1622473590925-e3616c0a41bf"], "Grande famille", "Lave-linge frontal 8 kg.");
  P("electromenager", "Cuisinière à gaz 4 feux", 88, ["photo-1623114112815-74a4b9fe505d", "photo-1629234358103-5b5ee53ece9c"], "Avec four", "Cuisinière gaz avec four.");
  P("electromenager", "Micro-ondes 20 litres", 38, ["photo-1596552183299-000ef779e88d"], "Compact", "Micro-ondes 20 L.");
  P("electromenager", "Blender 1,5 litre", 9.8, ["photo-1570222094114-d054a817e56b", "photo-1622818426197-d54f85b88690"], "Lames inox", "Mixeur pour jus et sauces.", {t:11});
  P("electromenager", "Bouilloire inox", 4.2, ["photo-1594213114663-d94db9b17125"], "1,8 litre", "Bouilloire électrique.");
  P("electromenager", "Ventilateur de table", 8.5, ["photo-1565151443833-29bf2ba5dd8d", "photo-1568392816241-44d223d4d490"], "3 vitesses", "Ventilateur oscillant.", {f:1});
  P("electromenager", "Ventilateur mural", 9.2, ["photo-1607835498554-2c5519af1730"], "Gain de place", "Ventilateur à fixer au mur.");
  P("electromenager", "Lave-vaisselle", 210, ["photo-1556185781-a47769abb7ee"], "12 couverts", "Lave-vaisselle pose libre.");

  /* ================= ÉNERGIE & SOLAIRE ================= */
  P("solaire", "Panneau solaire 450 W", 72, ["photo-1508514177221-188b1cf16e9d", "photo-1558449028-b53a39d100fc"], "Monocristallin",
    "Panneau haut rendement pour toitures et installations autonomes.", {f:1, t:8});
  P("solaire", "Panneau solaire 550 W", 88, ["photo-1613665813446-82a78c468a1d"], "Haute puissance", "Panneau grand format.");
  P("solaire", "Kit solaire toiture complet", 1450, ["photo-1658298775754-5839ffd434cc"], "Panneaux, onduleur, batteries", "Kit complet pour une maison.");
  P("solaire", "Groupe électrogène et onduleurs", 980, ["photo-1780445392484-38a4852a1fd8"], "Secours électrique", "Groupe et onduleurs pour coupures de courant.");
  P("solaire", "Groupe électrogène compact", 260, ["photo-1700318092011-6e4666e94ab5", "photo-1700318131252-ab19c871ab60"], "Essence, cadre robuste",
    "Groupe portable pour boutiques et maisons.");
  P("solaire", "Batteries de stockage", 115, ["photo-1742899273038-67ff67477663"], "Installation solaire", "Batteries pour stocker l'énergie.");
  P("solaire", "Batterie lithium et chargeur", 145, ["photo-1676337167498-ceac1d6dafba"], "Longue durée", "Batterie lithium avec chargeur.");
  P("solaire", "Station d'énergie portable", 160, ["photo-1697665896503-8b1fd6a8ff0f"], "Prises et USB", "Générateur silencieux rechargeable.");
  P("solaire", "Panneau solaire 300 W", 48, ["photo-1724041875334-0a6397111c7e"], "Polycristallin", "Panneau économique.");

  /* ================= MODE FEMME ================= */
  P("femmes", "Robe imprimé wax ample", 7.5, ["photo-1784160053635-424cf07f567c", "photo-1784160053632-6eddd51bda26"], "Imprimés africains",
    "Robe mi-longue aux motifs vifs, idéale pour la revente.", {f:1});
  P("femmes", "Robe portefeuille terracotta", 6.8, ["photo-1789110853872-f416085557fa"], "Ceinture à nouer", "Robe chemise, tailles S à XXL.", {t:10});
  P("femmes", "Robe de soirée longue dorée", 18, ["photo-1756483510840-b0dda5f0dd0f", "photo-1765229276796-c93c73cc3f3b"], "Cérémonies, mariages", "Robe longue habillée.", {f:1});
  P("femmes", "Top col V beige", 3.2, ["photo-1567966456076-905a50a06d8c"], "Basique", "Top léger à col V.");
  P("femmes", "Robe fleurie mi-longue", 6.2, ["photo-1628144029346-8a98676311b6"], "Imprimé floral", "Robe d'été évasée.");
  P("femmes", "Robe sans manches bleue", 5.9, ["photo-1601653233006-5c9fd30eab12"], "Quotidien", "Robe confortable, tissu respirant.");
  P("femmes", "Ensemble pagne et chapeau", 9.5, ["photo-1696962678565-bee84e6b9cb6", "photo-1696962701419-6f510910e838"], "Tenue assortie", "Robe et chapeau coordonnés.");
  P("femmes", "Robe colorée décontractée", 5.4, ["photo-1709809081557-78f803ce93a0"], "Coupe ample", "Robe aux couleurs franches.");
  P("femmes", "Robes de cérémonie satin", 14.5, ["photo-1785686563045-9825f2f8ebc8"], "Rouge et rose", "Robes en satin par tailles et couleurs.");
  P("femmes", "Manteau léger et robe imprimée", 12, ["photo-1787779351084-5cf715888d06"], "Look urbain", "Tenue complète prête à vendre.");
  P("femmes", "Assortiment prêt-à-porter femme", 3.5, ["photo-1525507119028-ed4c629a60a3"], "Ballot varié", "Hauts, robes et jupes de saison.");

  /* ================= MODE HOMME ================= */
  P("hommes", "T-shirt coton col rond", 1.8, ["photo-1523381294911-8d3cead13475", "photo-1576871337622-98d48d1cf531"], "Impression possible",
    "T-shirt basique en coton pour revente, campagnes et impression.", {f:1, t:12});
  P("hommes", "Chemise oxford bleue", 4.2, ["photo-1602810316693-3667c854239a", "photo-1740711152088-88a009e877bb"], "Coupe ajustée", "Chemise manches longues, M à 3XL.");
  P("hommes", "Chemise blanche col classique", 3.9, ["photo-1603252109303-2751441dd157"], "Bureau, uniforme", "Chemise blanche unie.");
  P("hommes", "Polo piqué", 3.6, ["photo-1623658580851-3b25bf83b4ea"], "Logo brodé possible", "Polo pour entreprises et équipes.");
  P("hommes", "Costume deux pièces bleu", 32, ["photo-1617137984095-74e4e5e3613f", "photo-1593030103066-0093718efeb9"], "Coupe slim", "Veste et pantalon, 46 à 58.", {f:1});
  P("hommes", "Costume noir slim", 29, ["photo-1617113930975-f9c7243ae527", "photo-1618886614638-80e3c103d31a"], "Cérémonie", "Costume noir ajusté.");
  P("hommes", "Vestes de costume colorées", 19, ["photo-1549037173-e3b717902c57"], "Assortiment", "Vestes seules en plusieurs couleurs.");
  P("hommes", "Jean denim homme", 6.5, ["photo-1542272604-787c3835535d", "photo-1602293589930-45aad59ba3ab"], "Coupe droite", "Jean résistant, 28 à 40.");
  P("hommes", "Lot de jeans", 4.8, ["photo-1565084888279-aca607ecce0c", "photo-1637069585336-827b298fe84a"], "Tailles mélangées", "Jeans au lot, meilleur prix.");
  P("hommes", "Chemise à carreaux", 4, ["photo-1642764873649-5c228ce3fe74"], "Flanelle légère", "Chemise décontractée.");

  /* ================= ENFANT & BÉBÉ ================= */
  P("enfants", "Vêtements bébé assortis", 2.4, ["photo-1766918780914-5df4a5a98c44", "photo-1766918780914-e19d9de76d85"], "Layette variée", "Pyjamas, bodies et ensembles, 0 à 2 ans.");
  P("enfants", "Body bébé coton", 1.2, ["photo-1622290319146-7b63df48a635"], "0 à 24 mois", "Body en coton doux.");
  P("enfants", "Panier naissance layette", 2.1, ["photo-1768693602418-260d828b878d"], "Coffret cadeau", "Kit de layette prêt à offrir.");
  P("enfants", "Ensemble garçon gilet et cravate", 8.5, ["photo-1725147874938-7904e3362841", "photo-1725147874578-fc76e0d865e1"], "Cérémonies", "Chemise, gilet, pantalon, cravate.", {f:1});
  P("enfants", "Robes fillette colorées", 3.8, ["photo-1758798460539-781b0bb466e6"], "2 à 10 ans", "Robes aux couleurs vives.");
  P("enfants", "Robe fillette grise", 3.5, ["photo-1556133168-a6cb2412e0c7"], "Coupe évasée", "Robe simple et élégante.");
  P("enfants", "Ensemble t-shirt et short fille", 2.9, ["photo-1604482858862-1db908a653e4"], "Tenue d'été", "Ensemble en coton.");
  P("enfants", "Chemise à carreaux garçon", 3.1, ["photo-1604303768345-038b79a8c47a"], "3 à 14 ans", "Pour l'école et les sorties.");

  /* ================= CHAUSSURES ================= */
  P("chaussures", "Baskets running blanc et orange", 9.5, ["photo-1560769629-975ec94e6a86"], "Pointures 36 à 45", "Baskets respirantes, cartons assortis.", {f:1});
  P("chaussures", "Baskets pastel", 8.2, ["photo-1595950653106-6c9ebd614d3a"], "Tendance", "Baskets mode coloris pastel.");
  P("chaussures", "Baskets cuir blanches", 10.5, ["photo-1608231387042-66d1773070a5", "photo-1600269452121-4f2416e55c28"], "Perforées", "Baskets blanches, 38 à 46.");
  P("chaussures", "Chaussures habillées cuir", 12, ["photo-1603191659812-ee978eeeef76"], "Derby à lacets", "Chaussures de ville en cuir.");
  P("chaussures", "Chaussures en toile", 4.5, ["photo-1525966222134-fcfa99b8ae77"], "Légères", "Basiques pour la revente en volume.");
  P("chaussures", "Sandales à talons cuir", 7.8, ["photo-1630386474440-8f2e6d752a98", "photo-1553545985-1e0d8781d5db"], "Talon moyen", "Sandales femme, 36 à 41.");
  P("chaussures", "Sandales plates fleuries", 3.4, ["photo-1619510331283-a46c425e48bb"], "Confort d'été", "Semelle souple.");
  P("chaussures", "Sandales cuir homme", 5.2, ["photo-1613662632164-7f2b081a5b46"], "Robustes", "Semelle antidérapante.");
  P("chaussures", "Escarpins assortis", 6.9, ["photo-1519415943484-9fa1873496d4"], "Lot de coloris", "Escarpins et ballerines assortis.");
  P("chaussures", "Baskets streetwear", 9.8, ["photo-1595341888016-a392ef81b7de"], "Montantes", "Style urbain très recherché.");

  /* ================= SACS & MAROQUINERIE ================= */
  P("sacs", "Sac à main cuir marron", 11, ["photo-1598532163257-ae3c6b2524b6", "photo-1590874103328-eac38a683ce7"], "Grand format", "Simili-cuir de qualité.", {f:1});
  P("sacs", "Sac à main rouge", 10.5, ["photo-1584917865442-de89df76afd3"], "Fermoir élégant", "Bandoulière amovible.");
  P("sacs", "Sac noir à anse", 12.5, ["photo-1614179689702-355944cd0918"], "Finitions argentées", "Sac noir intemporel.");
  P("sacs", "Sacoche bandoulière", 7.2, ["photo-1600857062241-98e5dba7f214"], "Compacte, mixte", "Pour téléphone et papiers.");
  P("sacs", "Cartable gris à boucles", 13, ["photo-1605733513597-a8f8341084e6"], "Structuré", "Sac élégant à boucles dorées.");
  P("sacs", "Sac à dos noir", 6.4, ["photo-1553062407-98eeb64c6a62"], "Poche ordinateur", "Personnalisable avec logo.");
  P("sacs", "Sac à dos cuir marron", 9.8, ["photo-1622560480605-d83c853bc5c3", "photo-1622560480654-d96214fdc887"], "Style urbain", "Plusieurs coloris.");
  P("sacs", "Sac à dos randonnée", 8.6, ["photo-1509762774605-f07235a08f1f"], "Grande contenance", "Multi-poches.");
  P("sacs", "Sacs shopping colorés", 0.35, ["photo-1760565030346-4b947220fe3a", "photo-1760565030243-c92ed557e8da"], "Votre logo imprimé", "Sacs cabas pour boutiques.");

  /* ================= BIJOUX, MONTRES & LUNETTES ================= */
  P("bijoux", "Parure collier et boucles", 3.8, ["photo-1742627032795-1dfb552448ce", "photo-1727947074642-0bd47ef70b58"], "Plaqué or", "Parures pour boutiques et cérémonies.", {f:1});
  P("bijoux", "Collier perles dorées", 2.4, ["photo-1600862754152-80a263dd564f"], "Fait main", "Collier de perles, couleurs au choix.");
  P("bijoux", "Collier perles or et argent", 2.2, ["photo-1601121141499-17ae80afc03a"], "Assortiment", "Colliers fantaisie.");
  P("bijoux", "Bijoux fantaisie assortis", 1.6, ["photo-1641290748359-1d944fc8359a"], "Lot vitrine", "Bagues, bracelets et pendentifs.");
  P("bijoux", "Montre analogique classique", 5.5, ["photo-1588866681220-a46150c5eb23", "photo-1651321225522-230f69f6561f"], "Cuir ou métal", "Montre à quartz, marquage possible.");
  P("bijoux", "Lunettes de soleil", 1.4, ["photo-1625480860390-16e060eac591"], "Protection UV", "Modèles assortis avec étui.");

  /* ================= TISSUS & PAGNES ================= */
  P("textile", "Pagnes wax imprimés", 4.5, ["photo-1784123476742-de48239d2fb0", "photo-1768212565424-efa3a3852b81"], "Pièce de 6 yards",
    "Tissu wax aux motifs vifs, vendu à la pièce.", {f:1});
  P("textile", "Tissus africains assortis", 3.9, ["photo-1768212565426-58b089b6386d", "photo-1768212566108-4ce4f329e4d2"], "Lot de motifs", "Assortiment de tissus imprimés.");
  P("textile", "Coupons de tissu colorés", 2.6, ["photo-1705248383815-c6bc07898592", "photo-1640767760729-7bfb6ce43ad4"], "Couture et confection", "Tissus unis en coupons.");
  P("textile", "Tissu rayé", 2.8, ["photo-1624516268152-1e48624026ed"], "Rouleaux", "Tissu rayé au mètre.");
  P("textile", "Bobines de fil à coudre", 0.25, ["photo-1517146783983-418c681b56c5", "photo-1542044801-30d3e45ae49a"], "Toutes couleurs", "Fil pour ateliers de couture.");
  P("textile", "Draps pliés en lot", 3.2, ["photo-1705248382836-3618e25706d0"], "Coton", "Draps et étoffes pliés.");

  /* ================= BEAUTÉ & CHEVEUX ================= */
  P("beaute", "Perruques couleurs", 14, ["photo-1787220674717-5f44f30d1ae1", "photo-1754327748419-715068469357"], "Fibre, plusieurs longueurs", "Perruques colorées.", {f:1});
  P("beaute", "Perruque longue noire lisse", 18, ["photo-1745975980824-bc88bd400c78"], "Effet naturel", "Lace frontale selon modèle.");
  P("beaute", "Extensions de cheveux", 8.5, ["photo-1782364743035-5666762e249a"], "Toutes textures", "Extensions et mèches.");
  P("beaute", "Mèches naturelles", 11, ["photo-1618566909269-a09202832ac6"], "Brun et noir", "Mèches vendues par paquets.");
  P("beaute", "Coffret soins visage", 4.8, ["photo-1598440947619-2c35fc9aa908"], "Idée cadeau", "Sérums et rouleau de massage.");
  P("beaute", "Assortiment maquillage", 3.6, ["photo-1631730486572-226d1f595b68"], "Pour instituts", "Rouges à lèvres et palettes.");
  P("beaute", "Pots cosmétiques vides", 0.6, ["photo-1567721913486-6585f069b332"], "Pour vos crèmes", "Pour fabricants locaux.");
  P("beaute", "Parfum flacon doré", 3.9, ["photo-1600634999623-864991678406"], "Senteurs au choix", "Parfums en flacon décoratif.");

  /* ================= CUISINE & MAISON ================= */
  P("maison", "Batterie de cuisine inox", 18.5, ["photo-1584990347193-6bebebfeaeee", "photo-1604414499020-f9ac575bc5ec"], "Avec couvercles", "Compatible tous feux.");
  P("maison", "Marmites inox", 14, ["photo-1588279102658-4230e1c4fb1e"], "Plusieurs tailles", "Pour familles et restaurants.");
  P("maison", "Poêles antiadhésives (lot de 3)", 7.6, ["photo-1547822050-fbb922ea9438"], "20, 24 et 28 cm", "Manches ergonomiques.");
  P("maison", "Batterie de cuisine émaillée", 22, ["photo-1556911164-1297abe8527c"], "Coloris orange", "Casseroles émaillées.");
  P("maison", "Cocotte en fonte", 9.4, ["photo-1588279102819-f4520e40b1c6"], "Mijotés", "Garde la chaleur longtemps.");
  P("maison", "Boîtes alimentaires", 0.8, ["photo-1595440431225-1c25fd023f71"], "Hermétiques", "Plusieurs tailles.");
  P("maison", "Pichet en verre", 1.3, ["photo-1585237672814-8f85a8118bf6"], "1,5 litre", "Pour jus et boissons.");
  P("maison", "Parure de lit", 9.5, ["photo-1505692952047-1a78307da8f2"], "Housse et taies", "Linge de lit en plusieurs tailles.");

  /* ================= MEUBLES ================= */
  P("meubles", "Canapé tissu vert 3 places", 165, ["photo-1555041469-a586c61ea9bc"], "Assise confortable", "Canapé moderne, plusieurs coloris.", {f:1});
  P("meubles", "Canapé gris 4 coussins", 180, ["photo-1698936061086-2bf99c7b9fc5"], "Grand format", "Canapé pour salons et hôtels.");
  P("meubles", "Canapé cuir 2 places", 210, ["photo-1512212621149-107ffe572d2f"], "Simili-cuir", "Canapé compact facile d'entretien.");
  P("meubles", "Fauteuil gris", 75, ["photo-1623353283172-2518d7e6f5ab"], "Salon et chambre", "Fauteuil rembourré.");
  P("meubles", "Lit double avec tête de lit", 145, ["photo-1560185128-e173042f79dd", "photo-1635594202056-9ea3b497e5c0"], "160 x 200", "Lit livré en kit.");
  P("meubles", "Ensemble table et 6 chaises", 230, ["photo-1758977403341-0104135995af", "photo-1547062200-f195b1c77e30"], "Salle à manger", "Table et chaises rembourrées.");
  P("meubles", "Table bois et chaises", 160, ["photo-1581970696275-253e75ecf269"], "Bois massif", "Ensemble pour maisons et restaurants.");
  P("meubles", "Chambre complète", 520, ["photo-1680503146476-abb8c752e1f4"], "Lit, armoire, chevets", "Mobilier de chambre assorti.");

  /* ================= CONSTRUCTION & SANITAIRE ================= */
  P("construction", "Carrelage sol et mur", 4.2, ["photo-1580398562556-d33329a0f29b", "photo-1600328604921-300918f36018"], "Prix au m²",
    "Carrelage céramique, nombreux formats et finitions.", {f:1});
  P("construction", "Carreaux décoratifs", 6.5, ["photo-1784552281617-17124a80c9d1", "photo-1771843471340-7387d7d903ce"], "Prix au m²", "Carreaux à motifs pour cuisines et salles de bain.");
  P("construction", "Mosaïque bleue", 7.8, ["photo-1782765251734-d9996623016e"], "Piscines, salles d'eau", "Mosaïque en plaques.");
  P("construction", "Robinet mitigeur inox", 6.5, ["photo-1542855368-ca6ea825bca2", "photo-1613849925387-6e7f31f0cf40"], "Cuisine et salle de bain", "Mitigeur en inox.");
  P("construction", "Lavabo avec meuble", 58, ["photo-1635286771551-9d7241ce7811", "photo-1646592491934-70310e515618"], "Miroir inclus", "Ensemble salle de bain.");
  P("construction", "Robinetterie dorée", 14, ["photo-1638815401319-702d3b5dfd2a"], "Finition or", "Robinetterie haut de gamme.");
  P("construction", "Peinture en pots", 12, ["photo-1643822308521-1da534425d82", "photo-1652829069807-95a2f6d1a601"], "Intérieur et extérieur", "Peintures en pots de 20 L.");
  P("construction", "Rouleaux de peinture", 0.9, ["photo-1525909002-1b05e0c869d8"], "Lot multicolore", "Rouleaux pour peintres et quincailleries.");

  /* ================= ÉLECTRICITÉ & ÉCLAIRAGE ================= */
  P("electricite", "Câble électrique en rouleau", 18, ["photo-1518181835702-6eef8b4b2113"], "100 m", "Câble cuivre, plusieurs sections.");
  P("electricite", "Fils électriques couleurs", 9, ["photo-1761507320645-b11a00bfcc34", "photo-1761507321319-2d59343016f6"], "Rouleaux assortis", "Fils pour installations domestiques.");
  P("electricite", "Ampoules LED", 0.38, ["photo-1532007271951-c487760934ae", "photo-1674659719067-8735479ba10c"], "Économie d'énergie", "Ampoules culot standard.", {f:1});
  P("electricite", "Suspension luminaire", 6.5, ["photo-1552529232-9e6cb081de19"], "Décoration", "Lampe suspendue moderne.");
  P("electricite", "Tableau électrique et disjoncteurs", 24, ["photo-1544724569-5f546fd6f2b5"], "Coffret complet", "Protection d'installation électrique.");
  P("electricite", "Câbles gainés noirs", 14, ["photo-1687038520579-8d8f24721267"], "Extérieur", "Câbles renforcés.");

  /* ================= OUTILS & QUINCAILLERIE ================= */
  P("outils", "Perceuse visseuse sans fil", 18, ["photo-1590635023142-73c3d34f2805"], "Batterie et chargeur", "Livrée en coffret.", {f:1});
  P("outils", "Kit bricolage perceuse et marteau", 22, ["photo-1606676539940-12768ce0e762"], "Coffret complet", "Pour particuliers et artisans.");
  P("outils", "Outils à main assortis", 6.5, ["photo-1540103711724-ebf833bde8d1"], "Pinces, clés, tournevis", "Pour quincailleries.");
  P("outils", "Panneau d'outils atelier", 28, ["photo-1761544775659-aaa6fa2e5b3d"], "Menuiserie", "Outils avec rangement mural.");
  P("outils", "Quincaillerie assortie", 4, ["photo-1783309239756-168e747dde35"], "Vis, charnières", "Lot varié pour boutiques.");
  P("outils", "Établi et outils", 95, ["photo-1760310936486-4dd450aab2a8"], "Atelier complet", "Établi avec outillage.");

  /* ================= MACHINES & INDUSTRIE ================= */
  P("machines", "Machine à coudre", 65, ["photo-1626274890657-e28d5b65b04b", "photo-1466027397211-20d0f2449a3f"], "Domestique et atelier", "Pour couturiers et ateliers.", {f:1});
  P("machines", "Machine à coudre industrielle", 210, ["photo-1630930678172-63343537a00a"], "Point droit rapide", "Pour ateliers de confection.");
  P("machines", "Poste à souder", 85, ["photo-1563229708-55d0a600b01d", "photo-1531053326607-9d349096d887"], "Inverter", "Pour soudeurs et ateliers métalliques.");
  P("machines", "Ligne de production", 4800, ["photo-1730584475256-9055b74420a2"], "Sur devis", "Machines pour petites unités de production.");
  P("machines", "Imprimante 3D", 260, ["photo-1611117775350-ac3950990985"], "Prototypage", "Pour ateliers et écoles.");
  P("machines", "Machine d'impression", 1900, ["photo-1503694978374-8a2fa686963a"], "Imprimerie", "Pour imprimeurs et sérigraphes.");

  /* ================= AGRICULTURE ================= */
  P("agriculture", "Tracteur agricole", 9800, ["photo-1571509107684-7e3034a90012", "photo-1685335686020-e0b487f7f426"], "50 à 90 ch", "Tracteur pour exploitations et coopératives.", {f:1});
  P("agriculture", "Tracteur avec charrue", 12500, ["photo-1718470684824-3c53a74523bc"], "Labour", "Tracteur et charrue.");
  P("agriculture", "Tracteur compact", 6900, ["photo-1683552515328-5a8d58755e9c"], "Petites parcelles", "Tracteur maniable.");
  P("agriculture", "Pompe à eau manuelle", 45, ["photo-1551604283-246c763f2cda"], "Puits et forages", "Pompe robuste pour villages.");
  P("agriculture", "Kit d'irrigation", 120, ["photo-1704162485983-7b5cf81894e1"], "Arroseurs", "Irrigation pour maraîchage.");
  P("agriculture", "Pulvérisateur sur roues", 38, ["photo-1541024626294-9eb360170dd9"], "Traitement des cultures", "Pulvérisateur jardin et champs.");

  /* ================= JOUETS & JEUX ================= */
  P("jouets", "Jouets éducatifs", 2.2, ["photo-1545558014-8692077e9b5c", "photo-1558060370-d644479cb6f7"], "Éveil", "Jouets colorés pour écoles et boutiques.", {f:1});
  P("jouets", "Train en bois", 4.5, ["photo-1596461404969-9ae70f2830c1"], "Bois naturel", "Jouet en bois classique.");
  P("jouets", "Peluches assorties", 1.6, ["photo-1596068587619-e4b11c7a3488", "photo-1559454403-b8fb88521f11"], "Plusieurs tailles", "Peluches pour cadeaux.");
  P("jouets", "Petites voitures", 0.7, ["photo-1725297952113-36be1c7cefb4"], "Lot", "Voitures miniatures.");
  P("jouets", "Camion jouet", 3.2, ["photo-1658490265968-79ed61de109d"], "Plastique résistant", "Jouet camion.");
  P("jouets", "Jeu d'échecs en bois", 5.5, ["photo-1616429777191-cc11a3c8bb2a"], "Plateau inclus", "Jeu de société.");

  /* ================= SPORT & VÉLOS ================= */
  P("sport", "Ballons de football", 3.5, ["photo-1579952363873-27f3bade9f55", "photo-1575361204480-aadea25e6e68"], "Taille 5", "Ballons pour clubs et écoles.", {f:1});
  P("sport", "Haltères", 2.8, ["photo-1576678927484-cc907957088c", "photo-1562771242-a02d9090c90c"], "Prix au kg", "Haltères pour salles de sport.");
  P("sport", "Équipement de salle de sport", 650, ["photo-1534438327276-14e5300c3a48"], "Sur devis", "Équipement complet de salle.");
  P("sport", "VTT adulte", 68, ["photo-1618762044398-ec1e7e048bbd"], "21 vitesses", "Vélo tout-terrain robuste.");
  P("sport", "Vélo de ville", 55, ["photo-1485965120184-e220f721d03e", "photo-1507035895480-2b3156c31fc8"], "Léger", "Vélo urbain.");
  P("sport", "Vélo de route", 120, ["photo-1532298229144-0ec0c57515c7"], "Cadre aluminium", "Vélo de course.");

  /* ================= EMBALLAGE & STOCKAGE ================= */
  P("emballage", "Cartons d'expédition", 0.4, ["photo-1700165644892-3dd6b67b25bc", "photo-1573376671096-e1fce2d1f19d"], "Toutes tailles", "Cartons pour e-commerce et entrepôts.");
  P("emballage", "Caisses plastique empilables", 2.2, ["photo-1593824854968-7833add41c16"], "Marchés et entrepôts", "Caisses robustes.");
  P("emballage", "Bacs de rangement", 1.8, ["photo-1586528116311-ad8dd3c8310d"], "Jaune et blanc", "Bacs pour stockage.");
  P("emballage", "Étagères d'entrepôt", 85, ["photo-1627309366653-2dedc084cdf1", "photo-1587293852726-70cdb56c2866"], "Métal, charge lourde", "Rayonnages pour magasins et dépôts.");
  P("emballage", "Boîtes cadeaux blanches", 0.3, ["photo-1771848194072-3a7d2b37360c"], "Personnalisables", "Boîtes pour boutiques.");

  /* ================= PAPETERIE & SCOLAIRE ================= */
  P("papeterie", "Cahiers assortis", 0.35, ["photo-1566869112473-77c4fb94359c"], "Rentrée scolaire", "Cahiers de toutes tailles.", {f:1});
  P("papeterie", "Crayons de couleur", 0.5, ["photo-1629652487043-fb2825838f8c", "photo-1497864149936-d3163f0c0f4b"], "Boîtes de 12", "Pour écoles et librairies.");
  P("papeterie", "Kit fournitures de bureau", 3.2, ["photo-1654931800100-2ecf6eee7c64"], "Agrafeuse, ciseaux", "Kit de bureau complet.");
  P("papeterie", "Stylos et papeterie", 0.15, ["photo-1456735190827-d1262f71b8a3"], "Prix à l'unité", "Stylos et articles de bureau.");
  P("papeterie", "Rame de papier A4", 2.6, ["photo-1631173716529-fd1696a807b0"], "500 feuilles", "Papier pour imprimantes.");

  return list;
})();
