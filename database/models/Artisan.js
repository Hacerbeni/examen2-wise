const mongoose = require("mongoose");

const artisanSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true, trim: true, maxlength: 100 },
    metier: { type: String, required: true, trim: true, maxlength: 80 },
    ville: { type: String, required: true, trim: true, maxlength: 100 },
    experience: { type: Number, required: true, min: 0, default: 0 },
    telephone: { type: String, trim: true, maxlength: 30, default: null },
    description: { type: String, trim: true, maxlength: 1000, default: null },
    migrationSource: { type: String, select: false },
  },
  { versionKey: false },
);

module.exports = mongoose.model("Artisan", artisanSchema);
