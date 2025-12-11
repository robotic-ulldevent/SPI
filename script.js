// --- Configuració de ThingSpeak ---
const CHANNEL_ID = '3200447';
const READ_API_KEY = '85WNYIM35DMXK9Z7'; // Assegureu-vos que aquesta clau sigui correcta
const BASE_URL = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?api_key=${READ_API_KEY}`;
const STATUS_URL = `https://api.thingspeak.com/channels/${CHANNEL_ID}.json?api_key=${READ_API_KEY}`; // URL per l'estat del canal

// Mapeig dels camps
const FIELDS = {
    HUMIDITAT: 'field1',
    TEMPERATURA: 'field2',
    INCLINACIO: 'field3',
    PLUJA: 'field4'
};

let graficTemperatura = null;


// --- GESTIÓ DE LA CÀRREGA INICIAL I ESTAT DE CONNEXIÓ ---

function inicialitzarAplicacio() {
    
    // 1. Fes la transició de la pantalla de càrrega després de 10 segons (GARANTIT)
    setTimeout(() => {
        // Amaga la pantalla de càrrega
        document.getElementById('loading-screen').classList.add('oculta');
        
        // Mostra el contingut principal de l'app
        document.getElementById('app-container').classList.remove('oculta');
        
        // Mostra el menú principal amb els 3 botons
        mostrarSeccio('principal'); 

        // 2. Comprova l'estat de connexió i actualitza l'indicador
        comprovarEstatConnexio();
        
    }, 10000); // 10 segons
}

// 🌟 FUNCIÓ: COMPROVAR L'ESTAT DE CONNEXIÓ A THINGSPEAK 🌟
async function comprovarEstatConnexio() {
    try {
        const response = await fetch(STATUS_URL);
        const data = await response.json();
        
        const lastEntryId = data.last_entry_id;
        
        const estatIcona = document.getElementById('estat-icona');
        const estatText = document.getElementById('estat-text');

        if (lastEntryId && lastEntryId > 0) {
            // Connexió OK (hi ha dades rebudes)
            estatIcona.classList.remove('icona-desconnectat');
            estatIcona.classList.add('icona-connectat');
            estatText.textContent = `Estat: Connectat (ID: ${lastEntryId})`;
        } else {
            // Dades no trobades o canal buit
            throw new Error("No s'han trobat entrades o dades de connexió.");
        }

    } catch (error) {
        // Error de xarxa o de ThingSpeak
        const estatIcona = document.getElementById('estat-icona');
        const estatText = document.getElementById('estat-text');
        
        estatIcona.classList.remove('icona-connectat');
        estatIcona.classList.add('icona-desconnectat');
        estatText.textContent = "Estat: Desconnectat / Sense dades";
        console.error("Error en comprovar l'estat de connexió:", error);
    }
}


// Funció per a la navegació (Mostra/Oculta seccions)
function mostrarSeccio(seccio) {
    // Oculta totes les seccions (casa1, sensors, vigilancia, mapa)
    document.querySelectorAll('.seccio').forEach(sec => sec.classList.add('oculta'));
    
    // Oculta/Mostra el contenidor de botons principal segons la secció
    const menuBotons = document.getElementById('menu-principal-botons');
    
    // Per defecte, ocultem els botons principals i només els mostrem si es demana 'principal'
    menuBotons.classList.add('oculta');


    if (seccio === 'principal') {
        // Mostra els 3 botons principals (Mòdul Sensors, Vigilància, Mapa)
        menuBotons.classList.remove('oculta');
        
    } else if (seccio === 'sensors') {
        // Mostra la secció amb els 4 botons de les Cases (Casa 1-4)
        document.getElementById('modul-sensors').classList.remove('oculta');
        
    } else if (seccio === 'casa1') {
        // Mostra el detall de Casa 1 i carrega les dades
        document.getElementById('casa1-detall').classList.remove('oculta');
        obtenirDadesThingSpeak(); 
        
    } else if (seccio === 'vigilancia') {
        document.getElementById('vigilancia').classList.remove('oculta');
        
    } else if (seccio === 'mapa') {
        document.getElementById('mapa').classList.remove('oculta');
    }
}

// Inicialitza la vista i la càrrega quan l'HTML està completament carregat
document.addEventListener('DOMContentLoaded', () => {
    inicialitzarAplicacio();
    // Refrescar l'estat de connexió cada 60 segons (opcional)
    setInterval(comprovarEstatConnexio, 60000); 
});


// --- FUNCIONS DE THINGSPEAK I CÀLCUL ---

async function obtenirDadesThingSpeak() {
    // Demanem 48 lectures (2 dies aprox.) per al gràfic
    const url = `${BASE_URL}&results=48`; 

    try {
        const response = await fetch(url);
        const data = await response.json();
        const feeds = data.feeds;

        if (feeds && feeds.length > 0) {
            actualitzarDadesActuals(feeds);
            calcularIPresentarMitjanes(feeds);
            dibuixarGraficTemperatura(feeds); 
        } else {
            console.error("No s'han trobat dades a ThingSpeak.");
        }
    } catch (error) {
        console.error("Error en obtenir les dades de ThingSpeak:", error);
    }
}

// 1. Mostrar l'última lectura rebuda
function actualitzarDadesActuals(feeds) {
    const ultimaLectura = feeds[feeds.length - 1];
    
    document.querySelector('#temp-quadre .dada-actual').textContent = `${parseFloat(ultimaLectura[FIELDS.TEMPERATURA]).toFixed(1)} °C`;
    document.querySelector('#humitat-quadre .dada-actual').textContent = `${parseFloat(ultimaLectura[FIELDS.HUMIDITAT]).toFixed(1)} %`;
    document.querySelector('#pluja-quadre .
