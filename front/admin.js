const API = "/api";

async function chargerAdmin() {
  const reponse = await fetch(`${API}/artisans`);
  const artisans = await reponse.json();
  const container = document.getElementById("admin-liste");
  container.innerHTML = "";

  for (const artisan of artisans) {
    const rep = await fetch(`${API}/artisans/${artisan.id}/avis`);
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
                <button class="btn-suppr" onclick="supprimerArtisan(${artisan.id})">Supprimer l'artisan</button>
            </div>
            <div class="admin-avis-liste">${avisHtml || "<em>Aucun avis.</em>"}</div>`;
    container.appendChild(div);
  }
}

document.getElementById("form-artisan").onsubmit = async (e) => {
  e.preventDefault();
  const artisan = {
    nom: document.getElementById("nom").value,
    metier: document.getElementById("metier").value,
    ville: document.getElementById("ville").value,
    experience: document.getElementById("experience").value,
    telephone: document.getElementById("telephone").value,
    description: document.getElementById("description").value,
  };
  await fetch(`${API}/artisans`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(artisan),
  });
  e.target.reset();
  chargerAdmin();
};

async function supprimerArtisan(id) {
  if (!confirm("Supprimer cet artisan et tous ses avis ?")) return;
  await fetch(`${API}/artisans/${id}`, { method: "DELETE" });
  chargerAdmin();
}

async function supprimerAvis(id) {
  if (!confirm("Supprimer cet avis ?")) return;
  await fetch(`${API}/avis/${id}`, { method: "DELETE" });
  chargerAdmin();
}

chargerAdmin();
