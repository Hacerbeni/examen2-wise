const API = '/api';

async function chargerAdmin() {
    const reponse = await fetch(`${API}/artisans`);
    const artisans = await reponse.json();
    const container = document.getElementById('admin-liste');
    container.innerHTML = '';

    for (const artisan of artisans) {
        const rep = await fetch(`${API}/artisans/${artisan.id}/avis`);
        const avis = await rep.json();
        
        const avisHtml = avis.map(a => `
            <div class="admin-avis">
                <span>${a.auteur} (${a.note}/5) : ${a.commentaire || ''}</span>
                <button class="btn-suppr" onclick="supprimerAvis(${a.id})"></button>
            </div>`).join('');

        const div = document.createElement('div');
        div.className = 'admin-carte';
        div.innerHTML = `
            <div class="admin-header">
                <div>
                    <strong>${artisan.nom}</strong> - ${artisan.metier} (${artisan.ville}, ${artisan.experience} ans)
                </div>
                <button class="btn-suppr" onclick="supprimerArtisan(${artisan.id})">Supprimer l'artisan</button>
            </div>
            <div class="admin-avis-liste">${avisHtml || '<em>Aucun avis.</em>'}</div>`;
        container.appendChild(div);
    }
}
