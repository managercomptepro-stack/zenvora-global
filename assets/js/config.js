/* ============================================================================
   ZENVORA GLOBAL — CONFIGURATION
   ----------------------------------------------------------------------------
   Le SEUL fichier à modifier pour brancher le site.
   Les réglages du jour (minimum de commande, taux, WhatsApp) se changent
   ensuite depuis l'espace de gestion, sans toucher au code.
   ============================================================================ */

/* ---------------------------------------------------------------------------
   1. GOOGLE SHEETS — base de données du catalogue
   Collez ici l'adresse de déploiement de votre Google Apps Script
   (elle se termine par /exec). Voir GUIDE-INSTALLATION.md, étape 2.
   Tant que ce champ est vide, le site tourne en « mode démo » :
   catalogue de démonstration + espace de gestion enregistré sur l'appareil.
   --------------------------------------------------------------------------- */
const CATALOGUE_ENDPOINT = "";

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
