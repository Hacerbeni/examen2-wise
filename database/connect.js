const mongoose = require("mongoose");

async function connectDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("La variable MONGODB_URI doit être définie dans .env.");
  }
  await mongoose.connect(uri);
  console.log("Connexion à MongoDB établie.");
}

module.exports = connectDatabase;
