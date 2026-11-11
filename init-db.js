const db = require('./db');

db.exec(`
    DROP TABLE IF EXISTS avis;
    DROP TABLE IF EXISTS artisans;

    CREATE TABLE artisans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT NOT NULL,
        metier TEXT NOT NULL,
        ville TEXT NOT NULL,
        experience INTEGER NOT NULL DEFAULT 0,
        telephone TEXT,
        description TEXT
    );

    CREATE TABLE avis (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        artisan_id INTEGER NOT NULL,
        auteur TEXT NOT NULL,
        note INTEGER NOT NULL CHECK (note BETWEEN 1 AND 5),
        commentaire TEXT,
        FOREIGN KEY (artisan_id) REFERENCES artisans(id) ON DELETE CASCADE
    );
`);


const artisans = [
    ['Moussa Ouédraogo', 'Plombier', 'Koudougou', 12, '70 00 00 00', 'Spécialiste des fuites et installations sanitaires.'],
    ['Awa Traoré', 'Couturière', 'Ouagadougou', 5, '71 11 11 11', 'Couture sur mesure, tenues traditionnelles et modernes.'],
    ['Salif Kaboré', 'Électricien', 'Bobo-Dioulasso', 8, '72 22 22 22', 'Dépannage électrique, installation de tableaux.'],
    ['Fatou Sawadogo', 'Menuisière', 'Koudougou', 15, '73 33 33 33', 'Fabrication de meubles en bois massif.'],
    ['Issa Compaoré', 'Plombier', 'Ouagadougou', 3, '74 44 44 44', 'Installation de chauffe-eau et robinetterie.'],
    ['Mariam Bâ', 'Coiffeuse', 'Ouagadougou', 10, '75 55 55 55', 'Tresses, tissages et soins capillaires.'],
    ['Norbert Zongo', 'Électricien', 'Bobo-Dioulasso', 20, '76 66 66 66', 'Expert en installations solaires.'],
    ['Monique Ilboudo', 'Couturière', 'Koudougou', 7, '77 77 77 77', 'Retouches rapides et création de vêtements.'],
    ['Camara Laye', 'Menuisier', 'Ouagadougou', 25, '78 88 88 88', 'Ébéniste, restauration de meubles anciens.'],
    ['Ousmane Sembène', 'Peintre', 'Bobo-Dioulasso', 14, '79 99 99 99', 'Peinture intérieure, extérieure et décorative.'],
    ['Aminata Zongo', 'Coiffeuse', 'Koudougou', 4, '70 12 34 56', 'Spécialiste des coiffures enfant.'],
    ['Ibrahim Kaboré', 'Peintre', 'Ouagadougou', 9, '71 23 45 67', 'Application de peintures écologiques.'],
    ['Sylvie Ouédraogo', 'Couturière', 'Bobo-Dioulasso', 6, '72 34 56 78', 'Couture rapide et retouches.'],
    ['Rasmané Ilboudo', 'Plombier', 'Koudougou', 11, '73 45 67 89', 'Rénovation de salles de bain.'],
    ['Awa Sawadogo', 'Menuisière', 'Ouagadougou', 18, '74 56 78 90', 'Agencement de cuisines et placards.']
];
const insertArtisan = db.prepare('INSERT INTO artisans (nom, metier, ville, experience, telephone, description) VALUES (?, ?, ?, ?, ?, ?)');
artisans.forEach(a => insertArtisan.run(...a));


const insertAvis = db.prepare('INSERT INTO avis (artisan_id, auteur, note, commentaire) VALUES (?, ?, ?, ?)');
insertAvis.run(1, 'Jean', 5, 'Très rapide et efficace !');
insertAvis.run(1, 'Paul', 4, 'Bon travail, un peu cher.');
insertAvis.run(2, 'Marie', 5, 'Superbe robe, merci Awa !');
insertAvis.run(3, 'Luc', 5, 'A résolu mon problème en 10 min.');
insertAvis.run(4, 'Sophie', 4, 'Belle table, livraison un peu lente.');
insertAvis.run(6, 'Alice', 5, 'Coiffure magnifique pour mon mariage.');

console.log("Base de données initialisée avec 15 artisans et 6 avis !");