// --- Configuració de ThingSpeak ---
const CHANNEL_ID = '3200447';
const READ_API_KEY = '85WNYIM35DMXK9Z7'; // LA VOSTRA CLAU REAL
const BASE_URL = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?api_key=${READ_API_KEY}`;

// Mapeig dels camps
const FIELDS = {
    HUMIDITAT: 'field1',
    TEMPERATURA: 'field2',
    INCLINACIO: 'field3',
    PLUJA: 'field4'
};

// Variable per gestionar el gràfic (Chart.js)
let graficTemperatura = null;


// --- GESTIÓ DE LA CÀRREGA INICIAL (10 segons) ---
function inicialitzarAplicacio() {
    // Amaga la pantalla de càrrega i mostra el contenidor principal després de 10 segons (10000ms)
    setTimeout(() => {
        document.getElementById('loading-screen').classList.add('oculta');
        document.getElementById('app-container').classList.remove('oculta');
        // Mostrar la franja vermella i el menú principal
        mostrarSeccio('principal'); 
    }, 10000); 
}

// Funció per a la navegació (Mostra/Oculta seccions)
function mostrarSeccio(seccio) {
    // Oculta totes les seccions i el main
    document.querySelectorAll('.seccio').forEach(sec => sec.classList.add('oculta'));
    document.querySelector('.menu-principal').classList.add('oculta');

    if (seccio === 'principal') {
        document.querySelector('.menu-principal').classList.remove('oculta');
    } else if (seccio === 'sensors') {
        document.getElementById('modul-sensors').classList.remove('oculta');
        document.querySelector('.menu-principal').classList.remove('oculta'); 
    } else if (seccio === 'casa1') {
        document.getElementById('casa1-detall').classList.remove('oculta');
        document.querySelector('.menu-principal').classList.add('oculta'); 
        obtenirDadesThingSpeak(); // Carrega les dades quan s'entra al detall
    }
}

// Inicialitza la vista i la càrrega quan l'HTML està completament carregat
document.addEventListener('DOMContentLoaded', () => {
    inicialitzarAplicacio();
});


// --- FUNCIONS DE THINGSPEAK I CÀLCUL ---

// Funció principal per obtenir dades
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
            // (Es podria afegir una alerta o missatge d'error al DOM)
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
    document.querySelector('#pluja-quadre .dada-actual').textContent = `${parseFloat(ultimaLectura[FIELDS.PLUJA]).toFixed(1)} mm`;
    document.querySelector('#inclinacio-quadre .dada-actual').textContent = `${parseFloat(ultimaLectura[FIELDS.INCLINACIO]).toFixed(2)} graus`;
}


// 2. Calcular i mostrar les mitjanes (8h matí i 20h vespre)
function calcularIPresentarMitjanes(feeds) {
    const dadesMati = { temp: [], hum: [], pluja: [], incl: [] };
    const dadesVespre = { temp: [], hum: [], pluja: [], incl: [] };

    feeds.forEach(feed => {
        const dataLectura = new Date(feed.created_at);
        const hora = dataLectura.getHours();

        // 8h del matí (aproximadament entre 7h i 9h)
        if (hora >= 7 && hora <= 9) {
            dadesMati.temp.push(parseFloat(feed[FIELDS.TEMPERATURA]));
            dadesMati.hum.push(parseFloat(feed[FIELDS.HUMIDITAT]));
            dadesMati.pluja.push(parseFloat(feed[FIELDS.PLUJA]));
            dadesMati.incl.push(parseFloat(feed[FIELDS.INCLINACIO]));
        }

        // 20h del vespre (aproximadament entre 19h i 21h)
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


// 3. Dibuixar el gràfic de temperatura
function dibuixarGraficTemperatura(feeds) {
    const ctx = document.getElementById('grafic-temperatura').getContext('2d');
    
    const labels = feeds.map(feed => {
        const date = new Date(feed.created_at);
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    });
    
    const dataValues = feeds.map(feed => parseFloat(feed[FIELDS.TEMPERATURA]));

    // Destruir l'instància anterior per evitar errors en recarregar la secció
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
