const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const connectDatabase = require("./connect");
const Artisan = require("./models/Artisan");
const Avis = require("./models/Avis");

const artisans = [
  ["Moussa Ouédraogo", "Plombier", "Koudougou", 12, "70 00 00 00", "Spécialiste des fuites et installations sanitaires."],
  ["Awa Traoré", "Couturière", "Ouagadougou", 5, "71 11 11 11", "Couture sur mesure, tenues traditionnelles et modernes."],
  ["Salif Kaboré", "Électricien", "Bobo-Dioulasso", 8, "72 22 22 22", "Dépannage électrique, installation de tableaux."],
  ["Fatou Sawadogo", "Menuisière", "Koudougou", 15, "73 33 33 33", "Fabrication de meubles en bois massif."],
  ["Issa Compaoré", "Plombier", "Ouagadougou", 3, "74 44 44 44", "Installation de chauffe-eau et robinetterie."],
  ["Mariam Bâ", "Coiffeuse", "Ouagadougou", 10, "75 55 55 55", "Tresses, tissages et soins capillaires."],
  ["Norbert Zongo", "Électricien", "Bobo-Dioulasso", 20, "76 66 66 66", "Expert en installations solaires."],
  ["Monique Ilboudo", "Couturière", "Koudougou", 7, "77 77 77 77", "Retouches rapides et création de vêtements."],
  ["Camara Laye", "Menuisier", "Ouagadougou", 25, "78 88 88 88", "Ébéniste, restauration de meubles anciens."],
  ["Ousmane Sembène", "Peintre", "Bobo-Dioulasso", 14, "79 99 99 99", "Peinture intérieure, extérieure et décorative."],
  ["Aminata Zongo", "Coiffeuse", "Koudougou", 4, "70 12 34 56", "Spécialiste des coiffures enfant."],
  ["Ibrahim Kaboré", "Peintre", "Ouagadougou", 9, "71 23 45 67", "Application de peintures écologiques."],
  ["Sylvie Ouédraogo", "Couturière", "Bobo-Dioulasso", 6, "72 34 56 78", "Couture rapide et retouches."],
  ["Rasmané Ilboudo", "Plombier", "Koudougou", 11, "73 45 67 89", "Rénovation de salles de bain."],
  ["Awa Sawadogo", "Menuisière", "Ouagadougou", 18, "74 56 78 90", "Agencement de cuisines et placards."],
];

const avis = [
  [0, "Jean", 5, "Très rapide et efficace !"],
  [0, "Paul", 4, "Bon travail, un peu cher."],
  [1, "Marie", 5, "Superbe robe, merci Awa !"],
  [2, "Luc", 5, "A résolu mon problème en 10 min."],
  [3, "Sophie", 4, "Belle table, livraison un peu lente."],
  [5, "Alice", 5, "Coiffure magnifique pour mon mariage."],
];

async function seed() {
  await connectDatabase();
  if ((await Artisan.countDocuments()) || (await Avis.countDocuments())) {
    throw new Error(
      "La base contient déjà des données; aucune donnée n'a été remplacée.",
    );
  }

  const documentsArtisans = await Artisan.insertMany(
    artisans.map(([nom, metier, ville, experience, telephone, description]) => ({
      nom,
      metier,
      ville,
      experience,
      telephone,
      description,
    })),
  );
  await Avis.insertMany(
    avis.map(([indexArtisan, auteur, note, commentaire]) => ({
      artisan_id: documentsArtisans[indexArtisan]._id,
      auteur,
      note,
      commentaire,
    })),
  );
  console.log("Base MongoDB initialisée avec 15 artisans et 6 avis.");
}

seed()
  .catch((error) => {
    console.error("Échec de l'initialisation MongoDB.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
