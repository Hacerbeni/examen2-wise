const Database = require("better-sqlite3");
const db = new Database("annuaire.db");
db.pragma("foreign_keys = ON");

function normaliserTexte(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[-\u2010-\u2015]/g, " ")
    .replace(/\s+/g, " ");
}

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

function normaliserMetier(value) {
  const metier = normaliserTexte(value);
  return variantesMetier.get(metier) || metier;
}

db.function("normaliser_texte", normaliserTexte);
db.function("normaliser_metier", normaliserMetier);
module.exports = db;
