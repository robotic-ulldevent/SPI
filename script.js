// --- Configuració de ThingSpeak ---
const CHANNEL_ID = '3200447';
const READ_API_KEY = '85WNYIM35DMXK9Z7'; // LA VOSTRA CLAU REAL
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


// --- GESTIÓ DE LA CÀRREGA I ESTAT DE CONNEXIÓ ---

function inicialitzarAplicacio() {
    // 1. Comprova l'estat de la connexió just després de carregar
    comprovarEstatConnexio();
    
    // 2. Fes la transició de la pantalla de càrrega després de 10 segons
    setTimeout(() => {
        document.getElementById('loading-screen').classList.add('oculta');
        document.getElementById('app-container').classList.remove('oculta');
        mostrarSeccio('principal'); 
    }, 10000); 
}

// 🌟 NOVA FUNCIÓ: COMPROVAR L'ESTAT DE CONNEXIÓ A THINGSPEAK 🌟
async function comprovarEstatConnexio() {
    try {
        const response = await fetch(STATUS_URL);
        const data = await response.json();
        
        const lastEntryId = data.last_entry_id;
        
        const estatIcona = document.getElementById('estat-icona');
        const estatText = document.getElementById('estat-text');

        // Considerem la connexió OK si hi ha dades rebudes recentment.
        // ThingSpeak no dóna l'últim timestamp directament a l'endpoint principal, 
        // així que ens basem en l'ID de l'última entrada.
        if (lastEntryId > 0) {
            estatIcona.classList.remove('icona-desconnectat');
            estatIcona.classList.add('icona-connectat');
            estatText.textContent = `Estat: Connectat (ID: ${lastEntryId})`;
        } else {
            throw new Error("No s'han trobat entrades.");
        }

    } catch (error) {
        // En cas d'error de xarxa o de dades no vàlides
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
    // Oculta totes les seccions i el contenidor de botons principal
    document.querySelectorAll('.seccio').forEach(sec => sec.classList.add('oculta'));
    document.getElementById('menu-principal-botons').classList.add('oculta');

    if (seccio === 'principal') {
        document.getElementById('menu-principal-botons').classList.remove('oculta');
    } else if (seccio === 'sensors') {
        document.getElementById('modul-sensors').classList.remove('oculta');
        // El menú principal es manté ocult per mostrar només els 4 botons de casa
    } else if (seccio === 'casa1') {
        document.getElementById('casa1-detall').classList.remove('oculta');
        obtenirDadesThingSpeak(); 
    } else if (seccio === 'vigilancia') {
        document.getElementById('vigilancia').classList.remove('oculta');
    } else if (seccio === 'mapa') {
        document.getElementById('mapa').classList.remove('oculta');
    }
}

// Inicialitza la vista i la càrrega
document.addEventListener('DOMContentLoaded', () => {
    inicialitzarAplicacio();
    // Opcional: Refrescar l'estat cada 60 segons per mantenir-lo actualitzat
    setInterval(comprovarEstatConnexio, 60000); 
});


// --- FUNCIONS DE THINGSPEAK I CÀLCUL (Es mantenen igual) ---

async function obtenirDadesThingSpeak() {
    const url = `${BASE_URL}&results=48`; 
    // ... (resta del codi obtenirDadesThingSpeak es manté)
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

function actualitzarDadesActuals(feeds) {
    const ultimaLectura = feeds[feeds.length - 1];
    
    document.querySelector('#temp-quadre .dada-actual').textContent = `${parseFloat(ultimaLectura[FIELDS.TEMPERATURA]).toFixed(1)} °C`;
    document.querySelector('#humitat-quadre .dada-actual').textContent = `${parseFloat(ultimaLectura[FIELDS.HUMIDITAT]).toFixed(1)} %`;
    document.querySelector('#pluja-quadre .dada-actual').textContent = `${parseFloat(ultimaLectura[FIELDS.PLUJA]).toFixed(1)} mm`;
    document.querySelector('#inclinacio-quadre .dada-actual').textContent = `${parseFloat(ultimaLectura[FIELDS.INCLINACIO]).toFixed(2)} graus`;
}

function calcularIPresentarMitjanes(feeds) {
    const dadesMati = { temp: [], hum: [], pluja: [], incl: [] };
    const dadesVespre = { temp: [], hum: [], pluja: [], incl: [] };
    
    const calcularMitjana = (arr) => arr.filter(v => !isNaN(v)).reduce((a, b) => a + b, 0) / arr.length;
    
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
    
    document.querySelector('#temp-quadre .mitjana-mati').textContent = `Mitjana Matí (8h): ${calcularMitjana(dadesMati.temp).toFixed(1)} °C`;
    document.querySelector('#humitat-quadre .mitjana-mati').textContent = `Mitjana Matí (8h): ${calcularMitjana(dadesMati.hum).toFixed(1)} %`;
    document.querySelector('#pluja-quadre .mitjana-mati').textContent = `Mitjana Matí (8h): ${calcularMitjana(dadesMati.pluja).toFixed(1)} mm`;
    document.querySelector('#inclinacio-quadre .mitjana-mati').textContent = `Mitjana Matí (8h): ${calcularMitjana(dadesMati.incl).toFixed(2)} graus`;

    document.querySelector('#temp-quadre .mitjana-vespre').textContent = `Mitjana Vespre (20h): ${calcularMitjana(dadesVespre.temp).toFixed(1)} °C`;
    document.querySelector('#humitat-quadre .mitjana-vespre').textContent = `Mitjana Vespre (20h): ${calcularMitjana(dadesVespre.hum).toFixed(1)} %`;
    document.querySelector('#pluja-quadre .mitjana-vespre').textContent = `Mitjana Vespre (20h): ${calcularMitjana(dadesVespre.pluja).toFixed(1)} mm`;
    document.querySelector('#inclinacio-quadre .mitjana-vespre').textContent = `Mitjana Vespre (20h): ${calcularMitjana(dadesVespre.incl).toFixed(2)} graus`;
}


function dibuixarGraficTemperatura(feeds) {
    const ctx = document.getElementById('grafic-temperatura').getContext('2d');
    
    const labels = feeds.map(feed => {
        const date = new Date(feed.created_at);
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    });
    
    const dataValues = feeds.map(feed => parseFloat(feed[FIELDS.TEMPERATURA]));

    if (graficTemperatura) {
        graficTemperatura.destroy();
    }

    graficTemperatura = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Temperatura (°C)',
                data: dataValues,
                borderColor: '#c0392b', 
                backgroundColor: 'rgba(192, 57, 43, 0.2)',
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, 
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Data i Hora'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Temperatura (°C)'
                    },
                    beginAtZero: false 
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Evolució Horària de la Temperatura'
                }
            }
        }
    });
}
