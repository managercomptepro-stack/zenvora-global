# Zenvora Global : mise en ligne

Tout est gratuit. Il faut environ 20 minutes, une seule fois.

## Ce que contient le dossier

| Fichier | Rôle |
|---|---|
| `index.html` | Le site pour les clients |
| `gestion/` | L'espace de gestion, protégé par mot de passe : **votre-site/gestion/** |
| `assets/js/config.js` | Le **seul** fichier à modifier : l'adresse Google Sheets |
| `assets/js/products.js` | Le catalogue de démonstration (145 produits) |
| `google-apps-script/Code.gs` | Le script à coller dans Google Sheets |

## Étape 1 : mettre le site en ligne (Netlify, gratuit)

1. Allez sur **app.netlify.com/drop** depuis un ordinateur et créez un compte gratuit.
2. Glissez le dossier `zenvora` dans la page. Le site est en ligne en quelques secondes.
3. Dans *Site configuration › Change site name*, choisissez par exemple `zenvora-global`.
   L'adresse devient **zenvora-global.netlify.app**.

Le site fonctionne déjà en **mode démo** : vous avez le catalogue de démonstration, et l'espace de gestion
enregistre vos modifications uniquement sur l'appareil utilisé (mot de passe : `demo`).

## Étape 2 : brancher Google Sheets (la base de données)

1. Sur **sheets.google.com**, créez une feuille vide nommée « Zenvora — catalogue ».
2. Ouvrez **Extensions › Apps Script**. Effacez le contenu, puis collez tout le fichier `google-apps-script/Code.gs`.
3. **Ligne 12** : remplacez `ChangezMoi-2026` par votre mot de passe. Choisissez un mot de passe long, que vous n'utilisez nulle part ailleurs.
4. Enregistrez (icône disquette). Choisissez la fonction **installer** dans la liste, puis cliquez sur **▶ Exécuter**.
   Autorisez l'accès quand Google le demande : *Paramètres avancés › Accéder au projet*.
   Les onglets Produits, Rayons, Reglages et Demandes apparaissent dans la feuille, et un dossier
   « Zenvora Global — photos produits » est créé dans votre Google Drive.
5. Cliquez sur **Déployer › Nouveau déploiement › type : Application Web**, avec ces réglages :
   - Exécuter en tant que : **Moi**
   - Qui a accès : **Tout le monde**
6. Copiez l'**URL de l'application Web**. Elle se termine par `/exec`.
7. Ouvrez `assets/js/config.js` et collez l'adresse ici :
   `const CATALOGUE_ENDPOINT = "https://script.google.com/macros/s/……/exec";`
8. Sur Netlify, glissez à nouveau le dossier (*Deploys › Drag and drop*).

## Étape 3 : premier lancement

1. Sur votre téléphone, ouvrez **votre-site/gestion/** et entrez votre mot de passe.
2. Allez dans **Réglages › Importer le catalogue de démonstration** pour remplir la feuille avec les 145 produits.
3. Toujours dans **Réglages**, vérifiez trois choses :
   - le minimum de commande (500 $) ;
   - le taux (1 $ = 600 FCFA) ;
   - le **numéro WhatsApp**. Mettez ici votre numéro chinois quand vous l'aurez.
4. Pour mettre la gestion sur l'écran d'accueil du téléphone :
   - iPhone : *Partager › Sur l'écran d'accueil* ;
   - Android : menu ⋮ › *Ajouter à l'écran d'accueil*.

## Au quotidien (depuis le téléphone)

- **Ajouter un produit** : bouton orange **+ Ajouter**. Ajoutez des photos (appareil photo ou galerie), le nom, le rayon, le prix en $, puis **Enregistrer**.
  Les photos sont réduites automatiquement et rangées dans votre Google Drive.
- **★** : le produit défile dans le carrousel du haut de page.
- **↑** : le produit s'affiche en tête de la boutique, avant « Voir plus ». L'onglet *En tête* permet de changer l'ordre avec les flèches.
- **Œil** : masque un produit sans le supprimer.
- **Quantité minimum** : laissez le champ vide pour un calcul automatique (minimum 500 $ de commande).
  Exemples : produit à 1 $ → 500 pièces ; produit à 100 $ → 5 pièces ; produit à 101 $ → 5 pièces (505 $) ; produit à 600 $ → 1 pièce.
  Remplissez le champ seulement pour imposer un autre minimum à un produit précis.
- **Demandes** : chaque clic d'un client sur « Commander sur WhatsApp » est noté ici, et dans l'onglet *Demandes* de la feuille.

Après une modification, le site public se met à jour en 5 minutes maximum (cache Google).

## Bon à savoir

- Les **prix du catalogue de démonstration sont indicatifs** : remplacez-les par vos prix fournisseurs.
- Les photos de démonstration viennent d'**Unsplash** (licence libre, usage commercial autorisé).
  Remplacez-les petit à petit par les photos de vos fournisseurs.
- Le mot de passe n'est vérifié que par Google : quelqu'un qui trouve l'adresse `/gestion/` ne peut rien faire sans lui.
- Si vous modifiez `Code.gs` plus tard : **Déployer › Gérer les déploiements › Modifier › Nouvelle version**.
  L'adresse `/exec` ne change pas.
