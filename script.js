let charts = {};
let refreshInterval = null;

// Configuració de les claus d'API i Canals
const configCases = {
    'casa1': { clau: 'EL_TEU_API_KEY_CASA1', canal: '3200447' }, 
    'casa2': { clau: 'I9QM383Z4L55KB0F', canal: 'CANAL_ID_CASA2' }, // Posa l'ID del canal si el saps
    'casa3': { clau: 'ULWM1RF9EGBLJ3I5', canal: 'CANAL_ID_CASA3' },
    'casa4': { clau: 'BZYJ00BYU6P4P48M', canal: 'CANAL_ID_CASA4' }
};

// 1. CONTROL DEL SPLASH SCREEN (5 SEGONS)
window.addEventListener('load', function() {
    setTimeout(function() {
        const splash = document.getElementById('splash');
        if(splash) {
            splash.style.opacity = '0';
            setTimeout(() => { splash.style.display = 'none'; }, 1000);
        }
    }, 5000);
    
    // Verificació d'estat inicial per a totes les cases al menú principal
    verificarAlertesTotes();
    setInterval(verificarAlertesTotes, 60000); // Actualitza els punts cada minut
});

// 2. NAVEGACIÓ ENTRE SECCIONS
function mostrarSeccio(id) {
    if(refreshInterval) clearInterval(refreshInterval);
    document.querySelectorAll('main, section').forEach(s => s.classList.add('oculta'));
    
    const target = document.getElementById(id);
    if(target) {
        target.classList.remove('oculta');
    }

    // Lògica per carregar dades segons la casa triada
    if(id.startsWith('seccio-casa')) {
        const casaId = id.replace('seccio-', ''); // Extreu 'casa1', 'casa2', etc.
        carregarDades(casaId);
        refreshInterval = setInterval(() => carregarDades(casaId), 3600000); 
    }
    window.scrollTo(0,0);
}

// 3. SISTEMA D'ALERTES (PUNT VERD/VERMELL)
async function verificarAlertesTotes() {
    for (let id in configCases) {
        const punt = document.getElementById(`punt-${id}`);
        if (!punt) continue;

        try {
            const res = await fetch(`https://api.thingspeak.com/channels/${configCases[id].canal}/feeds.json?api_key=${configCases[id].clau}&results=1`);
            const data = await res.json();
            const ultim = data.feeds[0];

            if (ultim) {
                const ara = new Date();
                const dataDada = new Date(ultim.created_at);
                const diferenciaSegons = (ara - dataDada) / 1000;

                // Si té accés i la dada és de fa menys d'1 hora (3600s)
                if (diferenciaSegons < 3600) {
                    punt.style.backgroundColor = "#27ae60"; // Verd
                } else {
                    punt.style.backgroundColor = "#e74c3c"; // Vermell (Dada antiga)
                }
            } else {
                punt.style.backgroundColor = "#e74c3c"; // Vermell (Sense dades)
            }
        } catch (e) {
            punt.style.backgroundColor = "#e74c3c"; // Vermell (Error connexió)
        }
    }
}

// 4. CÀRREGA DE DADES DE THINGSPEAK (DETALL DE CASA)
async function carregarDades(id) {
    const icona = document.getElementById('estat-icona');
    const text = document.getElementById('estat-text');
    const config = configCases[id];

    try {
        const res = await fetch(`https://api.thingspeak.com/channels/${config.canal}/feeds.json?api_key=${config.clau}&results=15`);
        if (!res.ok) throw new Error("Error de xarxa");

        const data = await res.json();
        const feeds = data.feeds;

        if (feeds && feeds.length > 0) {
            const ultim = feeds[feeds.length - 1];

            document.getElementById('val-hum').innerText = (ultim.field1 || "0") + " %";
            document.getElementById('val-temp').innerText = (ultim.field2 || "0") + " °C";
            document.getElementById('val-inc').innerText = (ultim.field3 || "0") + " °";
            document.getElementById('val-pluja').innerText = (ultim.field4 || "0") + " mm";

            if(icona) icona.style.backgroundColor = "#27ae60"; 
            if(text) text.innerText = `Estat: Connectat (${id.toUpperCase()})`;

            const labels = feeds.map(f => new Date(f.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
            
            crearGrafic('graficHum', labels, feeds.map(f => f.field1), 'Humitat', '#3498db');
            crearGrafic('graficTemp', labels, feeds.map(f => f.field2), 'Temperatura', '#f39c12');
            crearGrafic('graficInc', labels, feeds.map(f => f.field3), 'Inclinació', '#27ae60');
            crearGrafic('graficPluja', labels, feeds.map(f => f.field4), 'Pluja', '#16a085');
        }
    } catch (e) {
        if(icona) icona.style.backgroundColor = "#e74c3c"; 
        if(text) text.innerText = "Estat: Error en " + id;
    }
}

// 5. GENERADOR DE MINI-GRÀFICS
function crearGrafic(canvasId, labels, dataPoints, label, color) {
    const canvasElement = document.getElementById(canvasId);
    if(!canvasElement) return;

    const ctx = canvasElement.getContext('2d');
    if(charts[canvasId]) charts[canvasId].destroy();

    charts[canvasId] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{ 
                data: dataPoints, 
                borderColor: color, 
                backgroundColor: color + '22', 
                fill: true, 
                tension: 0.4, 
                borderWidth: 2, 
                pointRadius: 0 
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { display: false },
                x: { display: false }
            }
        }
    });
}
