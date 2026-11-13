const express = require("express");
const { timingSafeEqual } = require("node:crypto");
const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const db = require("./db");
const app = express();

app.use(express.json());
app.use(express.static("front"));

function verifierAdmin(req, res, next) {
  const nomAdmin = process.env.ADMIN_USERNAME;
  const motDePasseAdmin = process.env.ADMIN_PASSWORD;
  if (!nomAdmin || !motDePasseAdmin) {
    return res.status(503).json({
      erreur: "L'authentification administrateur n'est pas configurée.",
    });
  }

  const autorisation = req.get("authorization") || "";
  const correspondance = autorisation.match(/^Basic ([A-Za-z0-9+/=]+)$/);
  if (!correspondance) {
    return res.status(401).json({ erreur: "Authentification requise." });
  }

  const identifiants = Buffer.from(correspondance[1], "base64").toString(
    "utf8",
  );
  const separateur = identifiants.indexOf(":");
  const nomFourni = separateur < 0 ? "" : identifiants.slice(0, separateur);
  const motDePasseFourni =
    separateur < 0 ? "" : identifiants.slice(separateur + 1);
  const comparer = (fourni, attendu) => {
    const valeurFournie = Buffer.from(fourni);
    const valeurAttendue = Buffer.from(attendu);
    return (
      valeurFournie.length === valeurAttendue.length &&
      timingSafeEqual(valeurFournie, valeurAttendue)
    );
  };

  const nomValide = comparer(nomFourni, nomAdmin);
  const motDePasseValide = comparer(motDePasseFourni, motDePasseAdmin);
  if (!nomValide || !motDePasseValide) {
    return res.status(401).json({ erreur: "Identifiants invalides." });
  }
  next();
}

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/front/utilisateur.html");
});

app.get("/api/artisans", (req, res) => {
  const { q, metier } = req.query;
  let sql = `SELECT *,
    CASE normaliser_metier(metier)
      WHEN 'menuiserie' THEN 'Menuiserie'
      WHEN 'plomberie' THEN 'Plomberie'
      WHEN 'electricite' THEN 'Électricité'
      WHEN 'couture' THEN 'Couture'
      WHEN 'coiffure' THEN 'Coiffure'
      ELSE (
        SELECT MIN(autre.metier)
        FROM artisans AS autre
        WHERE normaliser_metier(autre.metier) = normaliser_metier(artisans.metier)
      )
    END AS groupe_metier
    FROM artisans`;
  const params = [];
  const conditions = [];

  if (q) {
    conditions.push(
      "(normaliser_texte(nom) LIKE normaliser_texte(?) OR normaliser_texte(metier) LIKE normaliser_texte(?) OR normaliser_texte(ville) LIKE normaliser_texte(?) OR normaliser_texte(telephone) LIKE normaliser_texte(?) OR normaliser_texte(description) LIKE normaliser_texte(?) OR normaliser_texte(CAST(experience AS TEXT)) LIKE normaliser_texte(?) OR normaliser_metier(metier) = normaliser_metier(?))",
    );
    const s = `%${q}%`;
    params.push(s, s, s, s, s, s, q);
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

app.get("/api/admin/session", verifierAdmin, (req, res) => {
  res.json({ authentifie: true });
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

app.post("/api/artisans", verifierAdmin, (req, res) => {
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

app.put("/api/artisans/:id", verifierAdmin, (req, res) => {
  const { nom, metier, ville, experience, telephone, description } = req.body;
  if (!nom || !metier || !ville) {
    return res
      .status(400)
      .json({ erreur: "Nom, métier et ville sont obligatoires." });
  }

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

app.delete("/api/artisans/:id", verifierAdmin, (req, res) => {
  const info = db
    .prepare("DELETE FROM artisans WHERE id = ?")
    .run(req.params.id);
  if (info.changes === 0)
    return res.status(404).json({ erreur: "Artisan introuvable" });
  res.status(204).end();
});

app.delete("/api/avis/:id", verifierAdmin, (req, res) => {
  db.prepare("DELETE FROM avis WHERE id = ?").run(req.params.id);
  res.status(204).end();
});

app.listen(9000, () =>
  console.log("Serveur démarré sur http://localhost:9000"),
);
