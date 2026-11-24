const mongoose = require("mongoose");

const artisanSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true, trim: true },
    metier: { type: String, required: true, trim: true },
    ville: { type: String, required: true, trim: true },
    experience: { type: Number, required: true, min: 0, default: 0 },
    telephone: { type: String, default: null },
    description: { type: String, default: null },
    migrationSource: { type: String, select: false },
  },
  { versionKey: false },
);

module.exports = mongoose.model("Artisan", artisanSchema);
