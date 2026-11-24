# Annuaire des artisans

Application web permettant de rechercher des artisans par nom, métier, ville ou
autres informations, de consulter leurs avis et de proposer un nouvel avis. Une
interface d'administration permet de gérer les artisans et de modérer les avis.

## Fonctionnalités

### Côté visiteurs

- Affichage des artisans avec leur métier, leur ville, leur expérience, leur
  description et leur numéro de téléphone.
- Recherche textuelle sur le nom, le métier, la ville, le téléphone, la
  description et l'expérience.
- Normalisation de la recherche pour ne pas dépendre des accents, de la casse
  ou de certaines variantes de noms de métiers.
- Filtrage par métier et affichage de statistiques sur le nombre d'artisans,
  de métiers et de villes.
- Consultation du nombre d'avis et de leur note moyenne.
- Dépôt d'un avis comprenant un nom d'auteur, une note de 1 à 5 et un
  commentaire facultatif.

### Côté administration

- Connexion à l'aide d'un identifiant et d'un mot de passe configurés dans
  l'environnement.
- Création, modification et suppression des fiches d'artisans.
- Consultation des avis associés à chaque artisan.
- Suppression d'un avis.
- Suppression d'un artisan et de ses avis associés.

## Technologies

- **Node.js** exécute le serveur JavaScript.
- **Express** sert les fichiers de l'interface et expose l'API HTTP.
- **MongoDB**, via **Mongoose**, conserve les artisans et les avis. MongoDB
  Compass peut servir à consulter la base locale.
- **HTML, CSS et JavaScript** composent l'interface du visiteur et le tableau
  de bord d'administration.
- **dotenv** charge les paramètres d'administration depuis un fichier `.env`.

La page publique peut aussi fonctionner sans serveur : elle utilise les données
exemple de `frontend/data.js` et conserve les avis dans le stockage local du
navigateur. Ces modifications restent propres au navigateur et ne sont pas
synchronisées avec MongoDB. Lorsque l'API Express est disponible, la page
continue d'utiliser les données du serveur. L'administration nécessite toujours
le serveur et son authentification.

## Organisation du projet

```text
.
├── frontend/
│   ├── admin.html          # Page du tableau de bord
│   ├── admin.js            # Connexion et opérations d'administration
│   ├── app.js              # Recherche, affichage et dépôt des avis
│   ├── data.js             # Données exemple pour le mode autonome
│   ├── style.css           # Styles communs
│   └── utilisateur.html    # Page publique de l'annuaire
├── backend/
│   ├── routes/
│   │   └── api.js          # Routes de l'API Express
│   └── server.js           # Serveur HTTP et fichiers frontend
├── database/
│   ├── models/             # Modèles Mongoose Artisan et Avis
│   ├── connect.js          # Connexion MongoDB
│   └── seed.js             # Données de démonstration non destructives
├── postman/                # Ressources de configuration Postman
├── .env.example            # Noms des paramètres attendus
├── package.json            # Dépendances et commandes npm
└── package-lock.json        # Dépendances verrouillées
```

Le dossier `node_modules/` contient les dépendances installées par npm et n'est
pas nécessaire dans l'archive source.

## Prérequis

- Node.js et npm.
- Un terminal ouvert à la racine du projet.

Les dépendances sont déclarées dans `package.json` et verrouillées par
`package-lock.json`.

## Installation et lancement

Depuis la racine du projet :

```powershell
npm install
Copy-Item .env.example .env
```

Après tout changement des dépendances, `npm install` met aussi
`package-lock.json` à jour.

Ouvrir ensuite `.env` et renseigner les identifiants de l'administrateur :

```dotenv
ADMIN_USERNAME=mon_identifiant
ADMIN_PASSWORD=mon_mot_de_passe
MONGODB_URI=mongodb://127.0.0.1:27017/annuaire
```

L'authentification de l'administration n'est pas disponible tant que les deux
premières valeurs ne sont pas renseignées. MongoDB doit être démarré localement
ou l'URI doit désigner une instance accessible. La même URI peut être utilisée
dans MongoDB Compass.

### Initialiser les données de démonstration

La commande ajoute 15 artisans et 6 avis uniquement si les collections sont
vides; elle refuse d'écraser des données existantes :

```powershell
npm run seed
```

### Démarrer le serveur

Mode développement, avec redémarrage automatique :

```powershell
npm run dev
```

Le lancement direct avec Nodemon reste disponible :

```powershell
nodemon server.js
```

Mode normal :

```powershell
npm start
```

L'application est disponible à l'adresse suivante :

- Annuaire public : <http://localhost:9000/>
- Tableau de bord : <http://localhost:9000/admin.html>

Le serveur utilise le port `9000`.

### Ouvrir le frontend sans serveur

Ouvrir `frontend/utilisateur.html` directement dans un navigateur. La recherche,
les filtres et le dépôt d'avis utilisent alors les données de démonstration de
`frontend/data.js`; les avis ajoutés sont conservés dans le stockage local du
navigateur. Le tableau de bord d'administration et les données de la base
MongoDB ne sont pas disponibles dans ce mode.

## Utilisation

Sur la page d'accueil, saisir un terme dans la recherche ou choisir un métier
parmi les filtres. Chaque fiche présente les informations de l'artisan et ses
avis. Le bouton **Donner un avis** ouvre le formulaire de dépôt.

La page **Gestion** ouvre le tableau de bord d'administration. Après connexion
avec `ADMIN_USERNAME` et `ADMIN_PASSWORD`, l'administrateur peut ajouter ou
modifier une fiche, supprimer un artisan, consulter ses avis et supprimer un
avis. La suppression d'un artisan supprime également explicitement ses avis
associés dans MongoDB.

## API HTTP

Toutes les routes de l'API sont préfixées par `/api`. Les routes
d'administration nécessitent l'en-tête HTTP Basic Authentication utilisant les
identifiants définis dans `.env`.

| Méthode | Route | Accès | Description |
| --- | --- | --- | --- |
| `GET` | `/api/artisans` | Public | Liste les artisans. Accepte les paramètres facultatifs `q` (recherche textuelle) et `metier` (filtre par métier). |
| `GET` | `/api/artisans/:id/avis` | Public | Renvoie les avis associés à un artisan. |
| `POST` | `/api/avis` | Public | Ajoute un avis. Le corps JSON attend `artisan_id`, `auteur`, `note` et éventuellement `commentaire`. |
| `GET` | `/api/admin/session` | Administration | Vérifie les identifiants et renvoie l'état d'authentification. |
| `POST` | `/api/artisans` | Administration | Crée un artisan. |
| `PUT` | `/api/artisans/:id` | Administration | Modifie un artisan. |
| `DELETE` | `/api/artisans/:id` | Administration | Supprime un artisan et ses avis associés. |
| `DELETE` | `/api/avis/:id` | Administration | Supprime un avis. |

Exemple de corps JSON pour créer un artisan :

```json
{
  "nom": "Awa Traoré",
  "metier": "Couturière",
  "ville": "Ouagadougou",
  "experience": 5,
  "telephone": "70 00 00 00",
  "description": "Couture sur mesure."
}
```

Exemple de corps JSON pour déposer un avis :

```json
{
  "artisan_id": "identifiant MongoDB de l'artisan",
  "auteur": "Jean",
  "note": 5,
  "commentaire": "Très bon service."
}
```

## Modèle de données

### `artisans`

| Champ | Type | Description |
| --- | --- | --- |
| `_id` | ObjectId | Identifiant MongoDB unique. Renvoyé par l'API sous la clé `id`. |
| `nom` | Texte | Nom de l'artisan, obligatoire. |
| `metier` | Texte | Métier de l'artisan, obligatoire. |
| `ville` | Texte | Ville de l'artisan, obligatoire. |
| `experience` | Entier | Années d'expérience, `0` par défaut. |
| `telephone` | Texte | Numéro de téléphone, facultatif. |
| `description` | Texte | Description, facultative. |

### `avis`

| Champ | Type | Description |
| --- | --- | --- |
| `_id` | ObjectId | Identifiant MongoDB unique. Renvoyé par l'API sous la clé `id`. |
| `artisan_id` | ObjectId | Référence vers l'artisan auquel l'avis se rapporte. |
| `auteur` | Texte | Nom de l'auteur, obligatoire. |
| `note` | Entier | Note comprise entre 1 et 5. |
| `commentaire` | Texte | Commentaire facultatif. |

Un artisan peut avoir plusieurs avis. `avis.artisan_id` référence
`artisans._id`; le serveur supprime les avis associés lors de la suppression
d'un artisan.

## Recherche et normalisation des métiers

La recherche normalise le texte en ignorant notamment les accents et la casse.
Certaines formes de métiers sont associées à une catégorie commune, par exemple
« plombier » et « plomberie ». Les catégories prédéfinies comprennent la
menuiserie, la plomberie, l'électricité, la couture et la coiffure. Les autres
métiers sont également proposés dans les filtres à partir des données présentes.

## Données locales

L'application se connecte à la base MongoDB indiquée par `MONGODB_URI`. Les
changements effectués depuis l'interface sont conservés dans MongoDB et
consultables avec Compass. Les requêtes d'API peuvent être envoyées depuis
Postman en local à `http://localhost:9000`; le port peut être modifié avec
`PORT`.
