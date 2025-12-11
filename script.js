// --- Configuració de ThingSpeak ---
const CHANNEL_ID = '3200447';
const READ_API_KEY = '85WNYIM35DMXK9Z7'; // LA VOSTRA CLAU REAL
const BASE_URL = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?api_key=${READ_API_KEY}`;
const STATUS_URL = `https://api.thingspeak.com/channels/${CHANNEL_ID}.json?api_key=${READ_API_KEY}`; 

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
        // AMAGA LA PANTALLA DE CÀRREGA
        document.getElementById('loading-screen').classList.add('oculta');
        
        // MOSTRA EL CONTINGUT PRINCIPAL
        document.getElementById('app-container').classList.remove('oculta');
        
        // MOSTRA EL MENÚ PRINCIPAL
        mostrarSeccio('principal'); 

        // 2. Comprova l'estat de connexió i actualitza l'indicador (S'executa DESPRÉS de la transició)
        comprovarEstatConnexio();
        
    }, 10000); // 10 segons
}

// FUNCIÓ: COMPROVAR L'ESTAT DE CONNEXIÓ A THINGSPEAK 
async function comprovarEstatConnexio() {
    try {
        const response = await fetch(STATUS_URL);
        const data = await response.json();
        
        const lastEntryId = data.last_entry_id;
        
        const estatIcona = document.getElementById('estat-icona');
        const estatText = document.getElementById('estat-text');

        if (lastEntryId && lastEntryId > 0) {
            // Connexió OK 
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
    
    menuBotons.classList.add('oculta');


    if (seccio === 'principal') {
        // Mostra els 3 botons principals 
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
    // Refrescar l'estat de connexió cada 60 segons 
    setInterval(comprovarEstatConnexio, 60000); 
});


// --- FUNCIONS DE THINGSPEAK I CÀLCUL (Mantingudes) ---

async function obtenirDadesThingSpeak() {
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
