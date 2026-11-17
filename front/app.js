const API = "/api";
const CLE_AVIS_LOCAUX = "annuaire-avis";
const containerArtisans = document.getElementById("liste-artisans");
const inputRecherche = document.getElementById("recherche-globale");
const btnRecherche = document.getElementById("btn-recherche");
const containerFiltres = document.getElementById("filtres-metiers");
const messageMode = document.getElementById("mode-donnees");
let metierActif = "";
let modeDonnees = location.protocol === "file:" ? "local" : "api";
let avisLocaux;

const variantesMetier = new Map([
  ["menuisier", "menuiserie"],
  ["menuisiere", "menuiserie"],
  ["menuiserie", "menuiserie"],
  ["plombier", "plomberie"],
  ["plombiere", "plomberie"],
  ["plomberie", "plomberie"],
  ["electricien", "electricite"],
  ["electricienne", "electricite"],
  ["electricite", "electricite"],
  ["couturier", "couture"],
  ["couturiere", "couture"],
  ["couture", "couture"],
  ["coiffeur", "coiffure"],
  ["coiffeuse", "coiffure"],
  ["coiffure", "coiffure"],
]);

function cleNormalisee(valeur) {
  return String(valeur ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[-\u2010-\u2015]/g, " ")
    .replace(/\s+/g, " ");
}

function metierNormalise(valeur) {
  const metier = cleNormalisee(valeur);
  return variantesMetier.get(metier) || metier;
}

function activerModeLocal(message) {
  modeDonnees = "local";
  document.querySelector(".lien-admin").classList.add("cache");
  messageMode.textContent = message;
  messageMode.classList.remove("cache");
}

function lireAvisLocaux() {
  if (avisLocaux) return avisLocaux;

  const avisEnregistres = localStorage.getItem(CLE_AVIS_LOCAUX);
  avisLocaux =
    avisEnregistres === null
      ? JSON.parse(JSON.stringify(window.ANNUAIRE_DATA.avis))
      : JSON.parse(avisEnregistres);
  if (!Array.isArray(avisLocaux)) {
    throw new Error("Les avis enregistrés dans ce navigateur sont invalides.");
  }
  if (avisEnregistres === null) {
    localStorage.setItem(CLE_AVIS_LOCAUX, JSON.stringify(avisLocaux));
  }
  return avisLocaux;
}

function obtenirArtisansLocaux(q = "", metier = "") {
  const artisans = window.ANNUAIRE_DATA.artisans;
  const avis = lireAvisLocaux();
  const recherche = cleNormalisee(q);
  const metierRecherche = metierNormalise(recherche);

  return artisans
    .map((artisan) => {
      const categorie = metierNormalise(artisan.metier);
      const groupeMetier =
        {
          menuiserie: "Menuiserie",
          plomberie: "Plomberie",
          electricite: "Électricité",
          couture: "Couture",
          coiffure: "Coiffure",
        }[categorie] ||
        artisans
          .filter((autre) => metierNormalise(autre.metier) === categorie)
          .map((autre) => autre.metier)
          .sort()[0];

      return {
        ...artisan,
        groupe_metier: groupeMetier,
        avis: avis.filter((element) => element.artisan_id === artisan.id),
      };
    })
    .filter((artisan) => {
      const correspondMetier =
        !metier || metierNormalise(artisan.metier) === metierNormalise(metier);
      const champs = [
        artisan.nom,
        artisan.metier,
        artisan.ville,
        artisan.telephone,
        artisan.description,
        artisan.experience,
      ];
      const correspondRecherche =
        !recherche ||
        champs.some((champ) => cleNormalisee(champ).includes(recherche)) ||
        metierNormalise(artisan.metier) === metierRecherche;
      return correspondMetier && correspondRecherche;
    });
}

async function obtenirArtisans(q = "", metier = "") {
  if (modeDonnees === "local") return obtenirArtisansLocaux(q, metier);

  try {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (metier) params.set("metier", metier);
    const reponse = await fetch(`${API}/artisans?${params}`);
    if (!reponse.ok) throw new Error("L’API des artisans est indisponible.");
    const artisans = await reponse.json();
    return await Promise.all(
      artisans.map(async (artisan) => {
        const reponseAvis = await fetch(
          `${API}/artisans/${artisan.id}/avis`,
        );
        if (!reponseAvis.ok) throw new Error("L’API des avis est indisponible.");
        return { ...artisan, avis: await reponseAvis.json() };
      }),
    );
  } catch {
    activerModeLocal(
      
    );
    return obtenirArtisansLocaux(q, metier);
  }
}

async function chargerArtisans(q = "", metier = "") {
  containerArtisans.innerHTML = '<p class="loading">Chargement...</p>';
  try {
    const artisans = await obtenirArtisans(q, metier);
    if (artisans.length === 0) {
      containerArtisans.innerHTML = '<p class="vide">Aucun artisan trouvé.</p>';
      return;
    }

    containerArtisans.innerHTML = "";
    artisans.forEach((artisan) => {
      const noteMoy =
        artisan.avis.length > 0
          ? (
              artisan.avis.reduce((somme, avis) => somme + Number(avis.note), 0) /
              artisan.avis.length
            ).toFixed(1)
          : null;
      const etoiles = noteMoy
        ? `${"★".repeat(Math.round(noteMoy))}<span class="note-chiffre">(${noteMoy}/5)</span>`
        : "Nouveau";

      const carte = document.createElement("div");
      carte.className = "carte-artisan";
      carte.innerHTML = `
            <div class="carte-header">
                <div class="avatar">${artisan.nom.charAt(0)}</div>
                <div><h3>${artisan.nom}</h3><span class="metier">${artisan.metier}</span></div>
            </div>
            <p class="description">${artisan.description || "Aucune description."}</p>
            <div class="carte-infos"><span>${artisan.ville}</span><span>${artisan.experience} ans</span></div>
            <div class="carte-rating"><span>${etoiles}</span><span class="nb-avis">${artisan.avis.length} avis</span></div>
            <div class="carte-footer">
                <span class="tel">${artisan.telephone || "N/A"}</span>
                <button class="btn-avis" onclick="ouvrirModale(${artisan.id})">Donner un avis</button>
            </div>`;
      containerArtisans.appendChild(carte);
    });
  } catch (erreur) {
    messageMode.textContent = erreur.message;
    messageMode.classList.remove("cache");
  }
}

async function initialiserPage() {
  if (modeDonnees === "local") {
    activerModeLocal(
      "Mode autonome : les données et les avis sont conservés dans ce navigateur.",
    );
  }

  try {
    const artisans = await obtenirArtisans();
    document.getElementById("stat-total").textContent = artisans.length;
    const metiers = [
      ...new Set(artisans.map((artisan) => artisan.groupe_metier).filter(Boolean)),
    ];
    document.getElementById("stat-metiers").textContent = metiers.length;
    document.getElementById("stat-villes").textContent = [
      ...new Set(artisans.map((artisan) => cleNormalisee(artisan.ville))),
    ].length;

    containerFiltres.innerHTML = `<button class="pilule active" onclick="filtrerParMetier('', this)">Tous</button>`;
    metiers.forEach((metier) => {
      const bouton = document.createElement("button");
      bouton.className = "pilule";
      bouton.textContent = metier;
      bouton.onclick = () => filtrerParMetier(metier, bouton);
      containerFiltres.appendChild(bouton);
    });
    await chargerArtisans();
  } catch (erreur) {
    messageMode.textContent = erreur.message;
    messageMode.classList.remove("cache");
  }
}

function filtrerParMetier(metier, bouton) {
  metierActif = metier;
  document
    .querySelectorAll(".pilule")
    .forEach((element) => element.classList.remove("active"));
  bouton.classList.add("active");
  chargerArtisans(inputRecherche.value, metierActif);
}

function ouvrirModale(id) {
  document.getElementById("avis-artisan-id").value = id;
  document.getElementById("modale-avis").classList.remove("cache");
}

function fermerModale() {
  document.getElementById("modale-avis").classList.add("cache");
  document.getElementById("form-avis").reset();
}

function ajouterAvisLocal(avis) {
  const avisEnregistres = [...lireAvisLocaux()];
  const nouvelAvis = {
    ...avis,
    id:
      avisEnregistres.reduce(
        (maximum, element) => Math.max(maximum, element.id),
        0,
      ) + 1,
  };
  avisEnregistres.push(nouvelAvis);
  localStorage.setItem(CLE_AVIS_LOCAUX, JSON.stringify(avisEnregistres));
  avisLocaux = avisEnregistres;
}

document.getElementById("form-avis").onsubmit = async (e) => {
  e.preventDefault();
  const avis = {
    artisan_id: Number(document.getElementById("avis-artisan-id").value),
    auteur: document.getElementById("avis-auteur").value.trim(),
    note: Number(document.getElementById("avis-note").value),
    commentaire: document.getElementById("avis-commentaire").value.trim(),
  };

  try {
    if (modeDonnees === "local") {
      ajouterAvisLocal(avis);
    } else {
      const reponse = await fetch(`${API}/avis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(avis),
      });
      if (!reponse.ok) throw new Error("L’API des avis est indisponible.");
    }
    fermerModale();
    await chargerArtisans(inputRecherche.value, metierActif);
  } catch (erreur) {
    if (modeDonnees === "api") {
      try {
        activerModeLocal(
          "Serveur indisponible : votre avis sera enregistré dans ce navigateur.",
        );
        ajouterAvisLocal(avis);
        fermerModale();
        await chargerArtisans(inputRecherche.value, metierActif);
        return;
      } catch (erreurLocal) {
        erreur = erreurLocal;
      }
    }
    messageMode.textContent = erreur.message;
    messageMode.classList.remove("cache");
  }
};

window.ouvrirModale = ouvrirModale;
window.fermerModale = fermerModale;
window.filtrerParMetier = filtrerParMetier;
btnRecherche.onclick = () => chargerArtisans(inputRecherche.value, metierActif);
inputRecherche.onkeyup = (e) => {
  if (e.key === "Enter") chargerArtisans(inputRecherche.value, metierActif);
};

initialiserPage();
