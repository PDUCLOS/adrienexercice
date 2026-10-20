# Mettre le site en ligne sur Cloudflare Pages (gratuit)

Le dossier `site/` contient tout le site. Pas besoin de programmer : on l'envoie tel quel.

## 1. Créer le site

1. Créez un compte gratuit sur https://dash.cloudflare.com/sign-up
2. Dans le menu de gauche : **Compute (Workers & Pages)** → **Create** → onglet **Pages** → **Upload assets** (« Envoyer des fichiers »).
3. Nom du projet : par exemple `ecole-maison` → **Create project**.
4. Faites glisser le dossier **`site`** entier dans la zone d'envoi → **Deploy site**.
5. Le site est en ligne à l'adresse `https://ecole-maison.pages.dev`.


### Variante recommandée : relier GitHub (mise à jour automatique)

Le code est sur votre dépôt GitHub.

1. **Compute (Workers & Pages)** → **Create** → onglet **Pages** → **Connect to Git** → choisissez votre dépôt.
2. Réglages de build :
   - **Framework preset** : None
   - **Build command** : (laisser vide)
   - **Build output directory** : `site`
3. **Save and Deploy**. Ensuite, chaque envoi sur GitHub (`git push`) met le site à jour tout seul.

## 2. Protéger le site (seule la famille peut entrer)

1. Dans le projet Pages : **Settings** → **General** → **Access policy** → **Enable**.
2. Cloudflare vous emmène dans **Zero Trust** (gratuit jusqu'à 50 personnes ; il peut demander de choisir le plan **Free**, parfois avec une carte bancaire sans débit).
3. Ouvrez l'application créée → **Edit** :
   - Dans **Application domain**, vérifiez qu'il y a `ecole-maison.pages.dev` **et** `*.ecole-maison.pages.dev` (ajoutez la ligne manquante).
   - Dans **Policies**, règle **Allow** → **Include** → **Emails** : mettez vos adresses e-mail (la vôtre, celle de l'autre parent…).
4. Enregistrez. Ouvrez le site dans une fenêtre privée : il doit demander un e-mail puis envoyer un code.

## 3. Mettre à jour le site plus tard

Projet Pages → **Create deployment** (« Nouveau déploiement ») → glissez à nouveau le dossier `site`.

## 4. (Optionnel) Nom de domaine

Cloudflare → **Domain Registration** → **Register Domains** (environ 10 € par an pour un `.fr` ou `.com`).
Puis projet Pages → **Custom domains** → **Set up a custom domain**. Ajoutez aussi ce domaine dans l'application Access (étape 2.3).

## Ajouter un exercice

1. Placez le fichier dans `site/exercices/<classe>/<matière>/`, par exemple `site/exercices/cp/maths/compter.html`.
2. Dans `site/index.html`, ajoutez une ligne dans `CATALOGUE` (classe et matière) :
   `{ titre:"Compter jusqu'à 20", detail:"…", icone:"🔢", lien:"exercices/cp/maths/compter.html" }`
3. Redéployez (étape 3).

## À savoir

Pour l'instant, les résultats sont gardés **dans le navigateur de chaque appareil** (tablette, ordinateur…), pas en ligne.
Pensez de temps en temps à **Progrès → Copier une sauvegarde** et à la coller dans une note.

**Sur iPad (Safari), important :** ajoutez le site à l'écran d'accueil (bouton Partager → « Sur l'écran d'accueil ») et ouvrez-le toujours depuis cette icône.
Sinon Safari peut effacer les résultats si le site n'est pas ouvert pendant 7 jours.
N'utilisez pas la navigation privée : rien n'y est gardé.
La base de données en ligne (Cloudflare D1, gratuite) viendra dans un deuxième temps.
