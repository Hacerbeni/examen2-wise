const Database = require("better-sqlite3");
const db = new Database("annuaire.db");
db.pragma("foreign_keys = ON");

function normaliserTexte(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normaliserMetier(value) {
  const metier = normaliserTexte(value);
  return metier === "menuisier" || metier === "menuisiere"
    ? "menuiserie"
    : metier;
}

db.function("normaliser_texte", normaliserTexte);
db.function("normaliser_metier", normaliserMetier);
module.exports = db;
