// --- Configuració de ThingSpeak (Mateix que abans) ---
const CHANNEL_ID = '3200447';
const READ_API_KEY = '85WNYIM35DMXK9Z7'; 
const BASE_URL = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?api_key=${READ_API_KEY}`;

const FIELDS = {
    HUMIDITAT: 'field1',
    TEMPERATURA: 'field2',
    INCLINACIO: 'field3',
    PLUJA: 'field4'
};

// --- NOVA FUNCIÓ: GESTIÓ DE LA CÀRREGA INICIAL ---
function inicialitzarAplicacio() {
    // 1. Amaga la pantalla de càrrega i mostra el contenidor principal després de 10 segons (10000ms)
    setTimeout(() => {
        document.getElementById('loading-screen').classList.add('oculta');
        document.getElementById('app-container').classList.remove('oculta');
    }, 10000); 
}


// Funció per a la navegació (Mostra/Oculta seccions)
function mostrarSeccio(seccio) {
    // Oculta totes les seccions i el main
    document.querySelectorAll('.seccio').forEach(sec => sec.classList.add('oculta'));
    document.querySelector('.menu-principal').classList.add('oculta');

    // Mostra la secció demanada
    if (seccio === 'principal') {
         // Quan tornem a la principal, només mostrem el contenidor del menú
        document.querySelector('.menu-principal').classList.remove('oculta');
    } else if (seccio === 'sensors') {
        document.getElementById('modul-sensors').classList.remove('oculta');
        document.querySelector('.menu-principal').classList.remove('oculta'); // Mantenim la franja vermella superior visible
    } else if (seccio === 'casa1') {
        document.getElementById('casa1-detall').classList.remove('oculta');
        document.querySelector('.menu-principal').classList.add('oculta'); // Amaguem la franja vermella quan entrem al detall
        obtenirDadesThingSpeak(); 
    }
}

// Inicialitza la vista i la càrrega
document.addEventListener('DOMContentLoaded', () => {
    inicialitzarAplicacio();
});

// (La resta de funcions per a ThingSpeak es mantenen igual)

// Funció principal per obtenir dades de ThingSpeak
async function obtenirDadesThingSpeak() {
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
    const dadesMati = { temp: [], hum: [], pluja: [], incl: [] };
    const dadesVespre = { temp: [], hum: [], pluja: [], incl: [] };

    feeds.forEach(feed => {
        const dataLectura = new Date(feed.created_at);
        const hora = dataLectura.getHours();

        if (hora >= 7 && hora <= 9) {
            dadesMati.temp.push(parseFloat(feed[FIELDS.TEMPERATURA]));
            dadesMati.hum.push(parseFloat(feed[FIELDS.HUMIDITAT]));
            dadesMati.pluja.push(parseFloat(feed[FIELDS.PLUJA]));
            dadesMati.incl.push(parseFloat(feed[FIELDS.INCLINACIO]));
        }

        if (hora >= 19 && hora <= 21) {
            dadesVespre.temp.push(parseFloat(feed[FIELDS.TEMPERATURA]));
            dadesVespre.hum.push(parseFloat(feed[FIELDS.HUMIDITAT]));
            dadesVespre.pluja.push(parseFloat(feed[FIELDS.PLUJA]));
            dadesVespre.incl.push(parseFloat(feed[FIELDS.INCLINACIO]));
        }
    });

    const calcularMitjana = (arr) => arr.filter(v => !isNaN(v)).reduce((a, b) => a + b, 0) / arr.length;
    
    // Presentar Dades de MATÍ
    document.querySelector('#temp-quadre .mitjana-mati').textContent = `Mitjana Matí (8h): ${calcularMitjana(dadesMati.temp).toFixed(1)} °C`;
    document.querySelector('#humitat-quadre .mitjana-mati').textContent = `Mitjana Matí (8h): ${calcularMitjana(dadesMati.hum).toFixed(1)} %`;
    document.querySelector('#pluja-quadre .mitjana-mati').textContent = `Mitjana Matí (8h): ${calcularMitjana(dadesMati.pluja).toFixed(1)} mm`;
    document.querySelector('#inclinacio-quadre .mitjana-mati').textContent = `Mitjana Matí (8h): ${calcularMitjana(dadesMati.incl).toFixed(2)} graus`;

    // Presentar Dades de VESPRE
    document.querySelector('#temp-quadre .mitjana-vespre').textContent = `Mitjana Vespre (20h): ${calcularMitjana(dadesVespre.temp).toFixed(1)} °C`;
    document.querySelector('#humitat-quadre .mitjana-vespre').textContent = `Mitjana Vespre (20h): ${calcularMitjana(dadesVespre.hum).toFixed(1)} %`;
    document.querySelector('#pluja-quadre .mitjana-vespre').textContent = `Mitjana Vespre (20h): ${calcularMitjana(dadesVespre.pluja).toFixed(1)} mm`;
    document.querySelector('#inclinacio-quadre .mitjana-vespre').textContent = `Mitjana Vespre (20h): ${calcularMitjana(dadesVespre.incl).toFixed(2)} graus`;
}
