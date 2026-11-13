const API = "/api";
let identifiantsAdmin = "";

function entetesAdmin(json = false) {
  const entetes = {
    Authorization: `Basic ${identifiantsAdmin}`,
  };
  if (json) entetes["Content-Type"] = "application/json";
  return entetes;
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
  container.innerHTML = "";

  for (const artisan of artisans) {
    const rep = await fetch(`${API}/artisans/${artisan.id}/avis`);
    if (!rep.ok) throw new Error("Impossible de charger les avis.");
    const avis = await rep.json();

    const avisHtml = avis
      .map(
        (a) => `
            <div class="admin-avis">
                <span>${a.auteur} (${a.note}/5) : ${a.commentaire || ""}</span>
                <button class="btn-suppr" onclick="supprimerAvis(${a.id})">Supprimer</button>
            </div>`,
      )
      .join("");

    const div = document.createElement("div");
    div.className = "admin-carte";
    div.innerHTML = `
            <div class="admin-header">
                <div>
                    <strong>${artisan.nom}</strong> - ${artisan.metier} (${artisan.ville}, ${artisan.experience} ans)
                </div>
                <div class="admin-actions">
                    <button class="btn-modifier" onclick="modifierArtisan(${artisan.id})">Modifier</button>
                    <button class="btn-suppr" onclick="supprimerArtisan(${artisan.id})">Supprimer</button>
                </div>
            </div>
            <div class="admin-avis-liste">${avisHtml || "<em>Aucun avis.</em>"}</div>`;
    container.appendChild(div);
  }
}

document.getElementById("form-connexion").onsubmit = async (e) => {
  e.preventDefault();
  const nom = document.getElementById("identifiant-admin").value;
  const motDePasse = document.getElementById("mot-de-passe-admin").value;
  const octets = new TextEncoder().encode(`${nom}:${motDePasse}`);
  const binaire = Array.from(octets, (octet) => String.fromCharCode(octet)).join(
    "",
  );
  identifiantsAdmin = btoa(binaire);

  try {
    await reponseAdmin(
      await fetch(`${API}/admin/session`, {
        headers: entetesAdmin(),
      }),
    );
    await chargerAdmin();
    document.getElementById("connexion-admin").classList.add("cache");
    document.getElementById("gestion-admin").classList.remove("cache");
    document.getElementById("mot-de-passe-admin").value = "";
    afficherErreur("");
  } catch (erreur) {
    identifiantsAdmin = "";
    document.getElementById("connexion-admin").classList.remove("cache");
    document.getElementById("gestion-admin").classList.add("cache");
    afficherErreur(erreur.message);
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
      const artisan = artisans.find((element) => element.id === id);
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
