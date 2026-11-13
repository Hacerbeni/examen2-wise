const express = require("express");
const db = require("./db");
const app = express();

app.use(express.json());
app.use(express.static("front"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/front/utilisateur.html");
});

app.get("/api/artisans", (req, res) => {
  const { q, metier } = req.query;
  let sql = `SELECT *,
    CASE WHEN normaliser_metier(metier) = 'menuiserie'
      THEN 'Menuiserie'
      ELSE metier
    END AS groupe_metier
    FROM artisans`;
  const params = [];
  const conditions = [];

  if (q) {
    conditions.push(
      "(normaliser_texte(nom) LIKE normaliser_texte(?) OR normaliser_texte(metier) LIKE normaliser_texte(?) OR normaliser_texte(ville) LIKE normaliser_texte(?))",
    );
    const s = `%${q}%`;
    params.push(s, s, s);
  }
  if (metier) {
    conditions.push("normaliser_metier(metier) = normaliser_metier(?)");
    params.push(metier);
  }

  if (conditions.length > 0) sql += " WHERE " + conditions.join(" AND ");
  res.json(db.prepare(sql).all(...params));
});

app.get("/api/artisans/:id/avis", (req, res) => {
  res.json(
    db.prepare("SELECT * FROM avis WHERE artisan_id = ?").all(req.params.id),
  );
});

app.post("/api/avis", (req, res) => {
  const { artisan_id, auteur, note, commentaire } = req.body;
  if (!artisan_id || !auteur || !note) {
    return res
      .status(400)
      .json({ erreur: "Artisan, auteur et note sont obligatoires." });
  }
  db.prepare(
    "INSERT INTO avis (artisan_id, auteur, note, commentaire) VALUES (?, ?, ?, ?)",
  ).run(artisan_id, auteur, note, commentaire || null);
  res.status(201).json({ message: "Avis ajouté avec succès" });
});

app.post("/api/artisans", (req, res) => {
  const { nom, metier, ville, experience, telephone, description } = req.body;
  if (!nom || !metier || !ville) {
    return res
      .status(400)
      .json({ erreur: "Nom, métier et ville sont obligatoires." });
  }
  const info = db
    .prepare(
      "INSERT INTO artisans (nom, metier, ville, experience, telephone, description) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .run(
      nom,
      metier,
      ville,
      experience || 0,
      telephone || null,
      description || null,
    );
  res
    .status(201)
    .json(
      db
        .prepare("SELECT * FROM artisans WHERE id = ?")
        .get(info.lastInsertRowid),
    );
});

app.put("/api/artisans/:id", (req, res) => {
  const { nom, metier, ville, experience, telephone, description } = req.body;
  const info = db
    .prepare(
      "UPDATE artisans SET nom = ?, metier = ?, ville = ?, experience = ?, telephone = ?, description = ? WHERE id = ?",
    )
    .run(
      nom,
      metier,
      ville,
      experience || 0,
      telephone,
      description,
      req.params.id,
    );
  if (info.changes === 0)
    return res.status(404).json({ erreur: "Artisan introuvable" });
  res.json({ message: "Artisan modifié" });
});

app.delete("/api/artisans/:id", (req, res) => {
  const info = db
    .prepare("DELETE FROM artisans WHERE id = ?")
    .run(req.params.id);
  if (info.changes === 0)
    return res.status(404).json({ erreur: "Artisan introuvable" });
  res.status(204).end();
});

app.delete("/api/avis/:id", (req, res) => {
  db.prepare("DELETE FROM avis WHERE id = ?").run(req.params.id);
  res.status(204).end();
});

app.listen(9000, () =>
  console.log("Serveur démarré sur http://localhost:9000"),
);
