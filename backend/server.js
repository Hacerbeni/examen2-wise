const express = require("express");
const path = require("node:path");
const dotenv = require("dotenv");
const connectDatabase = require("../database/connect");
const apiRoutes = require("./routes/api");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const app = express();
app.use(express.json({ limit: "10kb" }));
app.use("/api", apiRoutes);
app.use(express.static(path.join(__dirname, "..", "frontend")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "utilisateur.html"));
});

const port = Number(process.env.PORT) || 9000;

connectDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Serveur démarré sur http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Impossible de démarrer sans connexion à MongoDB.", error);
    process.exitCode = 1;
  });
