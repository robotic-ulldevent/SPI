let charts = {};
let refreshInterval = null;

// 1. CONTROL DEL SPLASH SCREEN (5 SEGONS)
window.addEventListener('load', function() {
    setTimeout(function() {
        const splash = document.getElementById('splash');
        if(splash) {
            splash.style.opacity = '0';
            setTimeout(() => { splash.style.display = 'none'; }, 1000);
        }
    }, 5000);
});

// 2. NAVEGACIÓ ENTRE SECCIONS
function mostrarSeccio(id) {
    if(refreshInterval) clearInterval(refreshInterval);
    document.querySelectorAll('main, section').forEach(s => s.classList.add('oculta'));
    
    const target = document.getElementById(id);
    if(target) {
        target.classList.remove('oculta');
    }

    if(id === 'seccio-casa1') {
        carregarDades();
        refreshInterval = setInterval(carregarDades, 3600000); // Refresc cada hora
    }
    window.scrollTo(0,0);
}

// 3. CÀRREGA DE DADES DE THINGSPEAK
async function carregarDades() {
    const icona = document.getElementById('estat-icona');
    const text = document.getElementById('estat-text');

    try {
        const res = await fetch('https://api.thingspeak.com/channels/3200447/feeds.json?results=15');
        if (!res.ok) throw new Error("Error de xarxa");

        const data = await res.json();
        const feeds = data.feeds;

        if (feeds && feeds.length > 0) {
            const ultim = feeds[feeds.length - 1];

            // Actualitzem els valors textuals
            document.getElementById('val-hum').innerText = (ultim.field1 || "0") + " %";
            document.getElementById('val-temp').innerText = (ultim.field2 || "0") + " °C";
            document.getElementById('val-inc').innerText = (ultim.field3 || "0") + " °";
            document.getElementById('val-pluja').innerText = (ultim.field4 || "0") + " mm";

            // Indicador de connexió OK
            if(icona) icona.style.backgroundColor = "#27ae60"; 
            if(text) text.innerText = "Estat: Connectat (ID: 27)";

            // Preparem dades per als gràfics
            const labels = feeds.map(f => new Date(f.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
            
            // Creem els 4 gràfics integrats
            crearGrafic('graficHum', labels, feeds.map(f => f.field1), 'Humitat', '#3498db');
            crearGrafic('graficTemp', labels, feeds.map(f => f.field2), 'Temperatura', '#f39c12');
            crearGrafic('graficInc', labels, feeds.map(f => f.field3), 'Inclinació', '#27ae60');
            crearGrafic('graficPluja', labels, feeds.map(f => f.field4), 'Pluja', '#16a085');
        }
    } catch (e) {
        if(icona) icona.style.backgroundColor = "#e74c3c"; 
        if(text) text.innerText = "Estat: Desconnectat";
    }
}

// 4. GENERADOR DE MINI-GRÀFICS
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
