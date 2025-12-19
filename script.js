const CHANNEL_ID = '3200447';
const READ_API_KEY = '85WNYIM35DMXK9Z7';
const BASE_URL = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?api_key=${READ_API_KEY}`;

function inicialitzarAplicacio() {
    // ARA NOMÉS 5 SEGONS (5000ms)
    setTimeout(() => {
        document.getElementById('loading-screen').classList.add('oculta');
        document.getElementById('app-container').classList.remove('oculta');
        mostrarSeccio('principal'); 
        comprovarEstatConnexio();
    }, 5000); 
}

function mostrarSeccio(seccio) {
    document.querySelectorAll('section').forEach(s => s.classList.add('oculta'));
    document.getElementById('menu-principal-botons').classList.add('oculta');

    if (seccio === 'principal') {
        document.getElementById('menu-principal-botons').classList.remove('oculta');
    } else if (seccio === 'sensors') {
        document.getElementById('modul-sensors').classList.remove('oculta');
    } else if (seccio === 'casa1') {
        document.getElementById('casa1-detall').classList.remove('oculta');
        obtenirDadesThingSpeak();
    } else {
        document.getElementById(seccio).classList.remove('oculta');
    }
}

async function comprovarEstatConnexio() {
    try {
        const resp = await fetch(`https://api.thingspeak.com/channels/${CHANNEL_ID}.json?api_key=${READ_API_KEY}`);
        const data = await resp.json();
        const icona = document.getElementById('estat-icona');
        if (data.last_entry_id) {
            icona.className = 'icona-connectat';
            document.getElementById('estat-text').textContent = "Estat: Connectat";
        }
    } catch (e) {
        document.getElementById('estat-icona').className = 'icona-desconnectat';
        document.getElementById('estat-text').textContent = "Estat: Desconnectat";
    }
}

// Càrrega de dades (Exemple simplificat per a Casa 1)
async function obtenirDadesThingSpeak() {
    try {
        const resp = await fetch(`${BASE_URL}&results=1`);
        const data = await resp.json();
        const ultim = data.feeds[0];
        document.querySelector('#temp-quadre .dada-actual').textContent = ultim.field2 + " °C";
        document.querySelector('#humitat-quadre .dada-actual').textContent = ultim.field1 + " %";
    } catch (e) { console.log("Error ThingSpeak"); }
}

document.addEventListener('DOMContentLoaded', inicialitzarAplicacio);
