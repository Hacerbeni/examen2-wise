const API = "/api";
const containerArtisans = document.getElementById("liste-artisans");
const inputRecherche = document.getElementById("recherche-globale");
const btnRecherche = document.getElementById("btn-recherche");
const containerFiltres = document.getElementById("filtres-metiers");
let metierActif = "";

function cleNormalisee(valeur) {
  return valeur
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[-\u2010-\u2015]/g, " ")
    .replace(/\s+/g, " ");
}

async function chargerArtisans(q = "", metier = "") {
  let url = `${API}/artisans?`;
  if (q) url += `q=${encodeURIComponent(q)}&`;
  if (metier) url += `metier=${encodeURIComponent(metier)}`;

  containerArtisans.innerHTML = '<p class="loading">Chargement...</p>';
  const reponse = await fetch(url);
  const artisans = await reponse.json();

  if (artisans.length === 0) {
    containerArtisans.innerHTML = '<p class="vide">Aucun artisan trouvé.</p>';
    return;
  }

  containerArtisans.innerHTML = "";

  const artisansAvecAvis = await Promise.all(
    artisans.map(async (a) => {
      const r = await fetch(`${API}/artisans/${a.id}/avis`);
      return { ...a, avis: await r.json() };
    }),
  );

  artisansAvecAvis.forEach((artisan) => {
    const noteMoy =
      artisan.avis.length > 0
        ? (
            artisan.avis.reduce((s, a) => s + a.note, 0) / artisan.avis.length
          ).toFixed(1)
        : null;

    const etoiles = noteMoy
      ? "".repeat(Math.round(noteMoy)) +
        `<span class="note-chiffre">(${noteMoy}/5)</span>`
      : "Nouveau";

    const carte = document.createElement("div");
    carte.className = "carte-artisan";
    carte.innerHTML = `
            <div class="carte-header">
                <div class="avatar">${artisan.nom.charAt(0)}</div>
                <div><h3>${artisan.nom}</h3><span class="metier">${artisan.metier}</span></div>
            </div>
            <p class="description">${artisan.description || "Aucune description."}</p>
            <div class="carte-infos"><span> ${artisan.ville}</span><span> ${artisan.experience} ans</span></div>
            <div class="carte-rating"><span>${etoiles}</span><span class="nb-avis">${artisan.avis.length} avis</span></div>
            <div class="carte-footer">
                <span class="tel"> ${artisan.telephone || "N/A"}</span>
                <button class="btn-avis" onclick="ouvrirModale(${artisan.id})">Donner un avis</button>
            </div>`;
    containerArtisans.appendChild(carte);
  });
}

async function initialiserPage() {
  const reponse = await fetch(`${API}/artisans`);
  const artisans = await reponse.json();

  document.getElementById("stat-total").textContent = artisans.length;
  const metiers = [
    ...new Set(artisans.map((a) => a.groupe_metier).filter(Boolean)),
  ];
  document.getElementById("stat-metiers").textContent = metiers.length;
  document.getElementById("stat-villes").textContent = [
    ...new Set(artisans.map((a) => cleNormalisee(a.ville))),
  ].length;

  containerFiltres.innerHTML = `<button class="pilule active" onclick="filtrerParMetier('', this)">Tous</button>`;
  metiers.forEach((m) => {
    const btn = document.createElement("button");
    btn.className = "pilule";
    btn.textContent = m;
    btn.onclick = () => filtrerParMetier(m, btn);
    containerFiltres.appendChild(btn);
  });
}

function filtrerParMetier(metier, btn) {
  metierActif = metier;
  document
    .querySelectorAll(".pilule")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  chargerArtisans(inputRecherche.value, metierActif);
}

btnRecherche.onclick = () => chargerArtisans(inputRecherche.value, metierActif);
inputRecherche.onkeyup = (e) => {
  if (e.key === "Enter") chargerArtisans(inputRecherche.value, metierActif);
};

function ouvrirModale(id) {
  document.getElementById("avis-artisan-id").value = id;
  document.getElementById("modale-avis").classList.remove("cache");
}
function fermerModale() {
  document.getElementById("modale-avis").classList.add("cache");
  document.getElementById("form-avis").reset();
}
document.getElementById("form-avis").onsubmit = async (e) => {
  e.preventDefault();
  const avis = {
    artisan_id: document.getElementById("avis-artisan-id").value,
    auteur: document.getElementById("avis-auteur").value,
    note: document.getElementById("avis-note").value,
    commentaire: document.getElementById("avis-commentaire").value,
  };
  await fetch(`${API}/avis`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(avis),
  });
  fermerModale();
  chargerArtisans(inputRecherche.value, metierActif);
};

initialiserPage();
chargerArtisans();
