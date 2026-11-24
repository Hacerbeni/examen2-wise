const mongoose = require("mongoose");

const avisSchema = new mongoose.Schema(
  {
    artisan_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Artisan",
      required: true,
      index: true,
    },
    auteur: { type: String, required: true, trim: true },
    note: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: Number.isInteger,
    },
    commentaire: { type: String, default: null },
    migrationSource: { type: String, select: false },
  },
  { versionKey: false },
);

module.exports = mongoose.model("Avis", avisSchema);
