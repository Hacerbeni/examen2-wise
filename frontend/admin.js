const API = "/api";
let jetonAdmin = "";

function entetesAdmin(json = false) {
  const entetes = {
    Authorization: `Bearer ${jetonAdmin}`,
  };
  if (json) entetes["Content-Type"] = "application/json";
  return entetes;
}

function creerElement(tag, classe, texte) {
  const element = document.createElement(tag);
  if (classe) element.className = classe;
  if (texte !== undefined) element.textContent = texte;
  return element;
}

async function reponseAdmin(reponse) {
  const resultat = await reponse.json();
  if (!reponse.ok) {
    throw new Error(resultat.erreur || "La requête a échoué.");
  }
  return resultat;
}

function afficherErreur(message) {
  document.getElementById("message-connexion").textContent = message;
  document.getElementById("message-admin").textContent = message;
}

async function chargerAdmin() {
  const reponse = await fetch(`${API}/artisans`);
  if (!reponse.ok) throw new Error("Impossible de charger les artisans.");
  const artisans = await reponse.json();
  const container = document.getElementById("admin-liste");
  container.replaceChildren();

  for (const artisan of artisans) {
    const rep = await fetch(`${API}/artisans/${artisan.id}/avis`);
    if (!rep.ok) throw new Error("Impossible de charger les avis.");
    const avis = await rep.json();

    const carte = creerElement("div", "admin-carte");
    const entete = creerElement("div", "admin-header");
    const infos = creerElement("div");
    const nom = creerElement("strong", "", artisan.nom);
    infos.append(nom, document.createTextNode(
      ` - ${artisan.metier} (${artisan.ville}, ${artisan.experience} ans)`,
    ));

    const actions = creerElement("div", "admin-actions");
    const boutonModifier = creerElement("button", "btn-modifier", "Modifier");
    boutonModifier.type = "button";
    boutonModifier.addEventListener("click", () => modifierArtisan(artisan.id));
    const boutonSupprimer = creerElement("button", "btn-suppr", "Supprimer");
    boutonSupprimer.type = "button";
    boutonSupprimer.addEventListener("click", () => supprimerArtisan(artisan.id));
    actions.append(boutonModifier, boutonSupprimer);
    entete.append(infos, actions);

    const listeAvis = creerElement("div", "admin-avis-liste");
    if (avis.length === 0) {
      listeAvis.append(creerElement("em", "", "Aucun avis."));
    } else {
      for (const element of avis) {
        const ligneAvis = creerElement("div", "admin-avis");
        const contenuAvis = creerElement(
          "span",
          "",
          `${element.auteur} (${element.note}/5) : ${element.commentaire || ""}`,
        );
        const boutonSupprimerAvis = creerElement(
          "button",
          "btn-suppr",
          "Supprimer",
        );
        boutonSupprimerAvis.type = "button";
        boutonSupprimerAvis.addEventListener("click", () =>
          supprimerAvis(element.id),
        );
        ligneAvis.append(contenuAvis, boutonSupprimerAvis);
        listeAvis.append(ligneAvis);
      }
    }

    carte.append(entete, listeAvis);
    container.append(carte);
  }
}

document.getElementById("form-connexion").onsubmit = async (e) => {
  e.preventDefault();
  const nom = document.getElementById("identifiant-admin").value;
  const motDePasse = document.getElementById("mot-de-passe-admin").value;

  try {
    const connexion = await reponseAdmin(
      await fetch(`${API}/admin/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom, motDePasse }),
      }),
    );
    const session = await reponseAdmin(
      await fetch(`${API}/admin/session`, {
        headers: { Authorization: `Bearer ${connexion.token}` },
      }),
    );
    if (!session.authentifie) throw new Error("Session administrateur invalide.");
    jetonAdmin = connexion.token;
    await chargerAdmin();
    document.getElementById("connexion-admin").classList.add("cache");
    document.getElementById("gestion-admin").classList.remove("cache");
    afficherErreur("");
  } catch (erreur) {
    jetonAdmin = "";
    document.getElementById("connexion-admin").classList.remove("cache");
    document.getElementById("gestion-admin").classList.add("cache");
    afficherErreur(erreur.message);
  } finally {
    document.getElementById("mot-de-passe-admin").value = "";
  }
};

document.getElementById("form-artisan").onsubmit = async (e) => {
  e.preventDefault();
  const id = document.getElementById("artisan-id").value;
  const artisan = {
    nom: document.getElementById("nom").value,
    metier: document.getElementById("metier").value,
    ville: document.getElementById("ville").value,
    experience: document.getElementById("experience").value,
    telephone: document.getElementById("telephone").value,
    description: document.getElementById("description").value,
  };

  try {
    await reponseAdmin(
      await fetch(`${API}/artisans${id ? `/${id}` : ""}`, {
        method: id ? "PUT" : "POST",
        headers: entetesAdmin(true),
        body: JSON.stringify(artisan),
      }),
    );
    e.target.reset();
    annulerModification();
    afficherErreur("");
    await chargerAdmin();
  } catch (erreur) {
    afficherErreur(erreur.message);
  }
};

function modifierArtisan(id) {
  fetch(`${API}/artisans`)
    .then((reponse) => {
      if (!reponse.ok) throw new Error("Impossible de charger les artisans.");
      return reponse.json();
    })
    .then((artisans) => {
      const artisan = artisans.find((element) => String(element.id) === String(id));
      if (!artisan) throw new Error("Artisan introuvable.");
      document.getElementById("artisan-id").value = artisan.id;
      document.getElementById("nom").value = artisan.nom;
      document.getElementById("metier").value = artisan.metier;
      document.getElementById("ville").value = artisan.ville;
      document.getElementById("experience").value = artisan.experience;
      document.getElementById("telephone").value = artisan.telephone || "";
      document.getElementById("description").value = artisan.description || "";
      document.getElementById("titre-formulaire").textContent =
        "Modifier un artisan";
      document.querySelector("#form-artisan button[type='submit']").textContent =
        "Enregistrer les modifications";
      document.getElementById("annuler-modification").classList.remove("cache");
      window.scrollTo({ top: 0, behavior: "smooth" });
    })
    .catch((erreur) => afficherErreur(erreur.message));
}

function annulerModification() {
  document.getElementById("artisan-id").value = "";
  document.getElementById("titre-formulaire").textContent =
    "Ajouter un artisan";
  document.querySelector("#form-artisan button[type='submit']").textContent =
    "Ajouter l'artisan";
  document.getElementById("annuler-modification").classList.add("cache");
}

document.getElementById("annuler-modification").onclick = () => {
  document.getElementById("form-artisan").reset();
  annulerModification();
};

async function supprimerArtisan(id) {
  if (!confirm("Supprimer cet artisan et tous ses avis ?")) return;
  try {
    const reponse = await fetch(`${API}/artisans/${id}`, {
      method: "DELETE",
      headers: entetesAdmin(),
    });
    if (!reponse.ok) await reponseAdmin(reponse);
    await chargerAdmin();
  } catch (erreur) {
    afficherErreur(erreur.message);
  }
}

async function supprimerAvis(id) {
  if (!confirm("Supprimer cet avis ?")) return;
  try {
    const reponse = await fetch(`${API}/avis/${id}`, {
      method: "DELETE",
      headers: entetesAdmin(),
    });
    if (!reponse.ok) await reponseAdmin(reponse);
    await chargerAdmin();
  } catch (erreur) {
    afficherErreur(erreur.message);
  }
}

window.modifierArtisan = modifierArtisan;
window.supprimerArtisan = supprimerArtisan;
window.supprimerAvis = supprimerAvis;
