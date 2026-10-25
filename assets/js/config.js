/* ============================================================================
   ZENVORA GLOBAL — CONFIGURATION
   ----------------------------------------------------------------------------
   Le SEUL fichier à modifier pour brancher le site.
   Les réglages du jour (minimum de commande, taux, WhatsApp) se changent
   ensuite depuis l'espace de gestion, sans toucher au code.
   ============================================================================ */

/* ---------------------------------------------------------------------------
   1. GOOGLE SHEETS (facultatif) — garde une trace des demandes WhatsApp
   dans l'onglet « Demandes ». S'il est injoignable, rien n'est bloqué.
   --------------------------------------------------------------------------- */
const CATALOGUE_ENDPOINT = "https://script.google.com/macros/s/AKfycbyk9fiOxByaUrHNS3uz9eSqwHEKnyDsX3n0diFr5uc_M7Mz-Cy2ZaXC936DJ6VpS4gF/exec";

/* ---------------------------------------------------------------------------
   DÉPÔT GITHUB QUI CONTIENT LE CATALOGUE (catalogue.json + photos)
   Le site le lit directement : il s'ouvre partout, sans serveur.
   L'espace de gestion y enregistre les modifications (clé d'accès GitHub).
   --------------------------------------------------------------------------- */
const GITHUB_REPO = "managercomptepro-stack/zenvora-global";
const GITHUB_BRANCH = "main";

/* Photos du catalogue de démonstration copiées dans assets/photos/
   (true = le site les sert lui-même, sans dépendre d'Unsplash) */
const LOCAL_PHOTOS = true;

/* ---------------------------------------------------------------------------
   2. RÉGLAGES PAR DÉFAUT
   (remplacés par ceux de l'onglet « Réglages » de l'espace de gestion)
   --------------------------------------------------------------------------- */
const SHOP_CONFIG = {
  name: "Zenvora Global",
  tagline: "Grossiste Chine → Afrique",
  /* Numéro WhatsApp qui reçoit les commandes, format international */
  whatsappNumber: "+4915510520344",
  /* Montant minimum d'une commande, en dollars.
     La quantité minimum de chaque produit en découle automatiquement :
     produit à 1 $  → 500 pièces minimum ; produit à 100 $ → 5 pièces ;
     produit à 101 $ → 5 pièces (505 $) ; produit à 600 $ → 1 pièce. */
  minOrderUSD: 500,
  /* Taux de conversion : 1 dollar = 600 FCFA */
  usdToXof: 600,
  orderPrefix: "ZG",
  /* Pays proposés au client (Afrique francophone) */
  countries: [
    "Cameroun", "Gabon", "Congo-Brazzaville", "RD Congo", "Côte d'Ivoire",
    "Sénégal", "Mali", "Burkina Faso", "Niger", "Bénin", "Togo", "Guinée",
    "Tchad", "Centrafrique", "Guinée équatoriale", "Madagascar", "Burundi",
    "Rwanda", "Djibouti", "Comores", "Mauritanie", "Maroc", "Algérie", "Tunisie"
  ],
  /* Modes d'expédition proposés */
  shipping: ["Maritime", "Aérien"]
};
