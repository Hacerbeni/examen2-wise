const express = require("express");
const { timingSafeEqual } = require("node:crypto");
const mongoose = require("mongoose");
const Artisan = require("../../database/models/Artisan");
const Avis = require("../../database/models/Avis");

const router = express.Router();

const variantesMetier = new Map([
  ["menuisier", "menuiserie"],
  ["menuisiere", "menuiserie"],
  ["menuiserie", "menuiserie"],
  ["plombier", "plomberie"],
  ["plombiere", "plomberie"],
  ["plomberie", "plomberie"],
  ["electricien", "electricite"],
  ["electricienne", "electricite"],
  ["electricite", "electricite"],
  ["couturier", "couture"],
  ["couturiere", "couture"],
  ["couture", "couture"],
  ["coiffeur", "coiffure"],
  ["coiffeuse", "coiffure"],
  ["coiffure", "coiffure"],
]);

function normaliserTexte(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[-\u2010-\u2015]/g, " ")
    .replace(/\s+/g, " ");
}

function normaliserMetier(value) {
  const metier = normaliserTexte(value);
  return variantesMetier.get(metier) || metier;
}

function serialiserArtisan(artisan, groupeMetier) {
  return {
    id: artisan._id.toString(),
    nom: artisan.nom,
    metier: artisan.metier,
    ville: artisan.ville,
    experience: artisan.experience,
    telephone: artisan.telephone,
    description: artisan.description,
    groupe_metier: groupeMetier,
  };
}

function comparer(fourni, attendu) {
  const valeurFournie = Buffer.from(fourni);
  const valeurAttendue = Buffer.from(attendu);
  return (
    valeurFournie.length === valeurAttendue.length &&
    timingSafeEqual(valeurFournie, valeurAttendue)
  );
}

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

  const identifiants = Buffer.from(correspondance[1], "base64").toString("utf8");
  const separateur = identifiants.indexOf(":");
  const nomFourni = separateur < 0 ? "" : identifiants.slice(0, separateur);
  const motDePasseFourni =
    separateur < 0 ? "" : identifiants.slice(separateur + 1);
  const nomValide = comparer(nomFourni, nomAdmin);
  const motDePasseValide = comparer(motDePasseFourni, motDePasseAdmin);
  if (!nomValide || !motDePasseValide) {
    return res.status(401).json({ erreur: "Identifiants invalides." });
  }
  next();
}

function estIdValide(id) {
  return mongoose.isValidObjectId(id);
}

router.get("/artisans", async (req, res) => {
  const artisans = await Artisan.find().lean();
  const toutesLesClesMetier = new Map();
  for (const artisan of artisans) {
    const cle = normaliserMetier(artisan.metier);
    if (!toutesLesClesMetier.has(cle)) toutesLesClesMetier.set(cle, []);
    toutesLesClesMetier.get(cle).push(artisan.metier);
  }

  const { q, metier } = req.query;
  const recherche = normaliserTexte(q);
  const metierRecherche = normaliserMetier(metier);
  const resultats = artisans.filter((artisan) => {
    const cle = normaliserMetier(artisan.metier);
    const correspondMetier = !metier || cle === metierRecherche;
    const texte = normaliserTexte(
      [
        artisan.nom,
        artisan.metier,
        artisan.ville,
        artisan.telephone,
        artisan.description,
        artisan.experience,
      ].join(" "),
    );
    const correspondRecherche =
      !recherche || texte.includes(recherche) || cle === normaliserMetier(recherche);
    return correspondMetier && correspondRecherche;
  });

  const groupesPredetermines = {
    menuiserie: "Menuiserie",
    plomberie: "Plomberie",
    electricite: "Électricité",
    couture: "Couture",
    coiffure: "Coiffure",
  };
  res.json(
    resultats.map((artisan) => {
      const cle = normaliserMetier(artisan.metier);
      const libelles = toutesLesClesMetier.get(cle).sort();
      return serialiserArtisan(
        artisan,
        groupesPredetermines[cle] || libelles[0],
      );
    }),
  );
});

router.get("/artisans/:id/avis", async (req, res) => {
  if (!estIdValide(req.params.id)) return res.json([]);
  const avis = await Avis.find({ artisan_id: req.params.id }).lean();
  res.json(
    avis.map((element) => ({
      id: element._id.toString(),
      artisan_id: element.artisan_id.toString(),
      auteur: element.auteur,
      note: element.note,
      commentaire: element.commentaire,
    })),
  );
});

router.get("/admin/session", verifierAdmin, (req, res) => {
  res.json({ authentifie: true });
});

router.post("/avis", async (req, res) => {
  const { artisan_id, auteur, note, commentaire } = req.body;
  if (!artisan_id || !auteur || note === undefined || note === null) {
    return res
      .status(400)
      .json({ erreur: "Artisan, auteur et note sont obligatoires." });
  }
  if (!estIdValide(artisan_id)) {
    return res.status(400).json({ erreur: "Identifiant d'artisan invalide." });
  }
  if (!(await Artisan.exists({ _id: artisan_id }))) {
    return res.status(404).json({ erreur: "Artisan introuvable." });
  }
  await Avis.create({
    artisan_id,
    auteur,
    note,
    commentaire: commentaire || null,
  });
  res.status(201).json({ message: "Avis ajouté avec succès" });
});

router.post("/artisans", verifierAdmin, async (req, res) => {
  const { nom, metier, ville, experience, telephone, description } = req.body;
  if (!nom || !metier || !ville) {
    return res
      .status(400)
      .json({ erreur: "Nom, métier et ville sont obligatoires." });
  }

  const artisan = await Artisan.create({
    nom,
    metier,
    ville,
    experience: experience || 0,
    telephone: telephone || null,
    description: description || null,
  });
  res.status(201).json(serialiserArtisan(artisan, normaliserMetier(metier)));
});

router.put("/artisans/:id", verifierAdmin, async (req, res) => {
  const { nom, metier, ville, experience, telephone, description } = req.body;
  if (!nom || !metier || !ville) {
    return res
      .status(400)
      .json({ erreur: "Nom, métier et ville sont obligatoires." });
  }
  if (!estIdValide(req.params.id)) {
    return res.status(404).json({ erreur: "Artisan introuvable" });
  }

  const artisan = await Artisan.findByIdAndUpdate(
    req.params.id,
    {
      nom,
      metier,
      ville,
      experience: experience || 0,
      telephone: telephone || null,
      description: description || null,
    },
    { new: true, runValidators: true },
  );
  if (!artisan) return res.status(404).json({ erreur: "Artisan introuvable" });
  res.json({ message: "Artisan modifié" });
});

router.delete("/artisans/:id", verifierAdmin, async (req, res) => {
  if (!estIdValide(req.params.id)) {
    return res.status(404).json({ erreur: "Artisan introuvable" });
  }
  const artisan = await Artisan.findById(req.params.id);
  if (!artisan) return res.status(404).json({ erreur: "Artisan introuvable" });
  await Avis.deleteMany({ artisan_id: artisan._id });
  await artisan.deleteOne();
  res.status(204).end();
});

router.delete("/avis/:id", verifierAdmin, async (req, res) => {
  if (estIdValide(req.params.id)) {
    await Avis.deleteOne({ _id: req.params.id });
  }
  res.status(204).end();
});

router.use((error, req, res, next) => {
  if (
    error instanceof mongoose.Error.ValidationError ||
    error instanceof mongoose.Error.CastError
  ) {
    return res.status(400).json({ erreur: error.message });
  }
  next(error);
});

module.exports = router;
