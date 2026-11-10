const db = require('./db');

db.exec(`
    -- Table des artisans
    CREATE TABLE IF NOT EXISTS artisans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT NOT NULL,
        metier TEXT NOT NULL,
        quartier TEXT NOT NULL,
        telephone TEXT
    );

    -- Table des avis (liée aux artisans)
    CREATE TABLE IF NOT EXISTS avis (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        artisan_id INTEGER NOT NULL,
        auteur TEXT NOT NULL,
        note INTEGER NOT NULL CHECK (note BETWEEN 1 AND 5),
        commentaire TEXT,
        FOREIGN KEY (artisan_id) REFERENCES artisans(id) ON DELETE CASCADE
    );
`);

// On ajoute quelques données de test pour commencer
const count = db.prepare('SELECT COUNT(*) AS nb FROM artisans').get().nb;
if (count === 0) {
    db.prepare("INSERT INTO artisans (nom, metier, quartier, telephone) VALUES ('Moussa', 'Plombier', 'Koudougou', '70 00 00 00')").run();
    db.prepare("INSERT INTO artisans (nom, metier, quartier, telephone) VALUES ('Awa', 'Couturière', 'Ouagadougou', '71 11 11 11')").run();
    console.log("Données de test insérées.");
}

console.log("Base de données initialisée.");