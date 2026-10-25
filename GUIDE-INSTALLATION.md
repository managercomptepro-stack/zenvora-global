# Zenvora Global — fonctionnement

**Site :** https://taupe-kitten-00ee29.netlify.app
**Gestion :** https://taupe-kitten-00ee29.netlify.app/gestion/

## Comment ça marche
- Le catalogue est le fichier `catalogue.json` de ce dépôt GitHub. Le site le lit directement
  (raw.githubusercontent.com, puis jsDelivr en secours) : aucun serveur, aucune dépendance à Google.
- Les photos de démonstration sont dans `assets/photos/` (servies par jsDelivr).
  Les photos ajoutées depuis la gestion vont dans `assets/uploads/`.
- La gestion enregistre chaque modification dans le dépôt : visible sur le site public sous ~5 minutes,
  immédiatement sur l'appareil de l'administrateur. Rien à redéployer.
- Les commandes partent sur WhatsApp (numéro modifiable dans Gestion › Réglages).
- Google Sheets ne sert plus qu'en option à noter les demandes (onglet Demandes) quand Google est joignable.

## Première connexion à la gestion (une seule fois par appareil)
1. Ouvrez https://github.com/settings/tokens/new?scopes=public_repo&description=Zenvora%20gestion
   (connecté au compte managercomptepro-stack).
2. Expiration : « No expiration » (ou 1 an), case **public_repo** cochée, puis **Generate token**.
3. Copiez la clé (ghp_…) et collez-la dans la gestion. Cochez « Se souvenir sur cet appareil ».
   Ne la partagez avec personne : elle permet de modifier le site.

## Modifier le code du site
Le code est déployé sur Netlify (taupe-kitten-00ee29) par glisser-déposer de `deploy/netlify.zip`
dans Netlify › Deploys. Ce n'est nécessaire que si le code change, pas pour les produits.
