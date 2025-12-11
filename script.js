// --- Configuració de ThingSpeak ---
const CHANNEL_ID = '3200447';
const READ_API_KEY = '85WNYIM35DMXK9Z7'; // <-- LA VOSTRA CLAU REAL
const BASE_URL = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?api_key=${READ_API_KEY}`;

// Mapeig dels camps (tal com ho heu demanat)
const FIELDS = {
    HUMIDITAT: 'field1',
    TEMPERATURA: 'field2',
    INCLINACIO: 'field3',
    PLUJA: 'field4'
};

// Funció per a la navegació (Mostra/Oculta seccions)
function mostrarSeccio(seccio) {
    // Oculta totes les seccions (excepte el main, que es pot deixar)
    document.querySelectorAll('.seccio').forEach(sec => sec.classList.add('oculta'));

    // Mostra la secció demanada
    if (seccio === 'sensors') {
        document.getElementById('modul-sensors').classList.remove('oculta');
        document.querySelector('.menu-principal').classList.add('oculta'); // Oculta el menú principal
    } else if (seccio === 'casa1') {
        document.getElementById('casa1-detall').classList.remove('oculta');
        document.getElementById('modul-sensors').classList.add('oculta'); // Oculta el menú de sensors
        obtenirDadesThingSpeak(); // Quan entrem a Casa 1, carreguem les dades
    }
}

// Inicialitza la vista (oculta les seccions de detall al carregar)
document.addEventListener('DOMContentLoaded', () => {
    // Per defecte, només mostra el menú principal
    mostrarSeccio('principal');
});

// Funció principal per obtenir dades de ThingSpeak
async function obtenirDadesThingSpeak() {
    // Demanem 24 hores de dades per calcular les mitjanes (aproximadament 24 lectures)
    const url = `${BASE_URL}&results=24`; 

    try {
        const response = await fetch(url);
        const data = await response.json();
        const feeds = data.feeds;

        if (feeds && feeds.length > 0) {
            actualitzarDadesActuals(feeds);
            calcularIPresentarMitjanes(feeds);
        } else {
            console.error("No s'han trobat dades a ThingSpeak.");
            // Actualitzar el DOM per indicar l'error
        }
    } catch (error) {
        console.error("Error en obtenir les dades de ThingSpeak:", error);
    }
}

// 1. Mostrar l'última lectura rebuda
function actualitzarDadesActuals(feeds) {
    const ultimaLectura = feeds[feeds.length - 1];
    
    // Temperatura
    document.querySelector('#temp-quadre .dada-actual').textContent = `${parseFloat(ultimaLectura[FIELDS.TEMPERATURA]).toFixed(1)} °C`;
    
    // Humitat
    document.querySelector('#humitat-quadre .dada-actual').textContent = `${parseFloat(ultimaLectura[FIELDS.HUMIDITAT]).toFixed(1)} %`;

    // Pluja
    document.querySelector('#pluja-quadre .dada-actual').textContent = `${parseFloat(ultimaLectura[FIELDS.PLUJA]).toFixed(1)} mm`;

    // Inclinació
    document.querySelector('#inclinacio-quadre .dada-actual').textContent = `${parseFloat(ultimaLectura[FIELDS.INCLINACIO]).toFixed(2)} graus`;
}


// 2. Calcular i mostrar les mitjanes (8h matí i 20h vespre)
function calcularIPresentarMitjanes(feeds) {
    // Array per guardar els valors de cada camp a les hores clau
    const dadesMati = { temp: [], hum: [], pluja: [], incl: [] };
    const dadesVespre = { temp: [], hum: [], pluja: [], incl: [] };

    feeds.forEach(feed => {
        const dataLectura = new Date(feed.created_at);
        const hora = dataLectura.getHours();

        // Si l'hora és a prop de les 8 del matí (e.g., entre 7h i 9h)
        if (hora >= 7 && hora <= 9) {
            dadesMati.temp.push(parseFloat(feed[FIELDS.TEMPERATURA]));
            dadesMati.hum.push(parseFloat(feed[FIELDS.HUMIDITAT]));
            dadesMati.pluja.push(parseFloat(feed[FIELDS.PLUJA]));
            dadesMati.incl.push(parseFloat(feed[FIELDS.INCLINACIO]));
        }

        // Si l'hora és a prop de les 8 del vespre (e.g., entre 19h i 21h)
        if (hora >= 19 && hora <= 21) {
            dadesVespre.temp.push(parseFloat(feed[FIELDS.TEMPERATURA]));
            dadesVespre.hum.push(parseFloat(feed[FIELDS.HUMIDITAT]));
            dadesVespre.pluja.push(parseFloat(feed[FIELDS.PLUJA]));
            dadesVespre.incl.push(parseFloat(feed[FIELDS.INCLINACIO]));
        }
    });

    // Funció auxiliar per calcular la mitjana
    const calcularMitjana = (arr) => arr.filter(v => !isNaN(v)).reduce((a, b) => a + b, 0) / arr.length;
    
    // --- Presentar Dades de MATÍ ---
    document.querySelector('#temp-quadre .mitjana-mati').textContent = `Mitjana Matí (8h): ${calcularMitjana(dadesMati.temp).toFixed(1)} °C`;
    document.querySelector('#humitat-quadre .mitjana-mati').textContent = `Mitjana Matí (8h): ${calcularMitjana(dadesMati.hum).toFixed(1)} %`;
    document.querySelector('#pluja-quadre .mitjana-mati').textContent = `Mitjana Matí (8h): ${calcularMitjana(dadesMati.pluja).toFixed(1)} mm`;
    document.querySelector('#inclinacio-quadre .mitjana-mati').textContent = `Mitjana Matí (8h): ${calcularMitjana(dadesMati.incl).toFixed(2)} graus`;

    // --- Presentar Dades de VESPRE ---
    document.querySelector('#temp-quadre .mitjana-vespre').textContent = `Mitjana Vespre (20h): ${calcularMitjana(dadesVespre.temp).toFixed(1)} °C`;
    document.querySelector('#humitat-quadre .mitjana-vespre').textContent = `Mitjana Vespre (20h): ${calcularMitjana(dadesVespre.hum).toFixed(1)} %`;
    document.querySelector('#pluja-quadre .mitjana-vespre').textContent = `Mitjana Vespre (20h): ${calcularMitjana(dadesVespre.pluja).toFixed(1)} mm`;
    document.querySelector('#inclinacio-quadre .mitjana-vespre').textContent = `Mitjana Vespre (20h): ${calcularMitjana(dadesVespre.incl).toFixed(2)} graus`;
}
