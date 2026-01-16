let charts = {};
let refreshInterval = null;
let vrefreshInterval = null;

// 1. CONFIGURACIÓ DE CANALS I CLAUS
// He actualitzat els IDs de canal per a la vigilància segons les teves instruccions
const CONFIG = {
    'casa1': { key: 'READ_KEY_CASA1', id: '3200447', v_id: '3229918', punt: 'ne', titol: 'Nord-est' },
    'casa2': { key: 'I9QM383Z4L55KB0F', id: '2815143', v_id: '3229918', punt: 'no', titol: 'Nord-oest' },
    'casa3': { key: 'ULWM1RF9EGBLJ3I5', id: '2815144', v_id: '3229919', punt: 'se', titol: 'Sud-est' },
    'casa4': { key: 'BZYJ00BYU6P4P48M', id: '2815145', v_id: '3229920', punt: 'so', titol: 'Sud-oest' }
};

// 2. CONTROL DEL SPLASH SCREEN
window.addEventListener('load', () => {
    setTimeout(() => {
        const splash = document.getElementById('splash');
        if(splash) {
            splash.style.opacity = '0';
            setTimeout(() => splash.style.display = 'none', 1000);
        }
    }, 5000);
    
    // Inicialització d'estats
    verificarEstatTotesCases();
    verificarVigilanciaTotes();
    
    // Intervals de refresc en segon pla
    setInterval(verificarEstatTotesCases, 60000); 
    setInterval(verificarVigilanciaTotes, 300000); // Cada 5 minuts
});

// 3. NAVEGACIÓ
function mostrarSeccio(id) {
    if(refreshInterval) clearInterval(refreshInterval);
    if(vrefreshInterval) clearInterval(vrefreshInterval);
    
    document.querySelectorAll('main, section').forEach(s => s.classList.add('oculta'));
    const target = document.getElementById(id);
    if(target) target.classList.remove('oculta');

    if(id === 'seccio-sensors') verificarEstatTotesCases();
    if(id === 'seccio-vigilancia') verificarVigilanciaTotes();
    
    window.scrollTo(0,0);
}

// 4. MÒDUL SENSORS (DETALL)
function obrirCasa(id) {
    const titol = document.getElementById('titol-casa');
    if(titol) titol.innerText = "Dades " + id.toUpperCase();
    
    mostrarSeccio('seccio-detall-casa');
    carregarDadesSensors(id);
    refreshInterval = setInterval(() => carregarDadesSensors(id), 60000);
}

async function carregarDadesSensors(id) {
    try {
        const res = await fetch(`https://api.thingspeak.com/channels/${CONFIG[id].id}/feeds.json?api_key=${CONFIG[id].key}&results=15`);
        const data = await res.json();
        const feeds = data.feeds;
        const ultim = feeds[feeds.length - 1];

        // Actualització valors textuals
        document.getElementById('val-hum').innerText = (ultim.field1 || 0) + " %";
        document.getElementById('val-temp').innerText = (ultim.field2 || 0) + " °C";
        document.getElementById('val-inc').innerText = (ultim.field3 || 0) + " °";
        document.getElementById('val-pluja').innerText = (ultim.field4 || 0) + " mm";

        // Estat de connexió al header
        const icona = document.getElementById('estat-icona');
        const text = document.getElementById('estat-text');
        if(icona) icona.style.backgroundColor = "#27ae60";
        if(text) text.innerText = "Connectat " + id.toUpperCase();

        // Gràfics
        const labels = feeds.map(f => new Date(f.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}));
        crearGrafic('graficHum', labels, feeds.map(f => f.field1), 'Humitat', '#3498db');
        crearGrafic('graficTemp', labels, feeds.map(f => f.field2), 'Temperatura', '#f39c12');
        crearGrafic('graficInc', labels, feeds.map(f => f.field3), 'Inclinació', '#27ae60');
        crearGrafic('graficPluja', labels, feeds.map(f => f.field4), 'Pluja', '#16a085');
        
    } catch (e) {
        if(document.getElementById('estat-icona')) document.getElementById('estat-icona').style.backgroundColor = "#e74c3c";
    }
}

// 5. VIGILÀNCIA PERIMETRAL (NOVA LÒGICA)
async function verificarVigilanciaTotes() {
    for (let id in CONFIG) {
        const pilot = document.getElementById(`pilot-${CONFIG[id].punt}`);
        if (!pilot) continue;

        try {
            // Demanem només l'última dada per verificar el temps
            const res = await fetch(`https://api.thingspeak.com/channels/${CONFIG[id].v_id}/feeds.json?api_key=${CONFIG[id].key}&results=1`);
            const data = await res.json();
            
            if (data.feeds && data.feeds.length > 0) {
                const ultim = data.feeds[0];
                const ara = new Date();
                const dataDada = new Date(ultim.created_at);
                const diffHores = (ara - dataDada) / (1000 * 60 * 60);

                // Lògica de colors:
                // VERMELL: Lectura en les últimes 12h
                // VERD: No hi ha noves lectures en les últimes 12h
                if (diffHores < 12) {
                    pilot.className = "pilot-vigi estat-vigi-vermell";
                } else {
                    pilot.className = "pilot-vigi estat-vigi-verd";
                }
            } else {
                // Si el canal respon però està buit, ho considerem sense alertes (verd)
                pilot.className = "pilot-vigi estat-vigi-verd";
            }
        } catch (e) {
            // GROC: No hi ha resposta de ThingSpeak
            pilot.className = "pilot-vigi estat-vigi-groc";
        }
    }
}

async function obrirDetallVigilancia(puntId) {
    const casaKey = Object.keys(CONFIG).find(k => CONFIG[k].punt === puntId);
    const titol = document.getElementById('titol-vigi');
    if(titol) titol.innerText = "Historial Vigilància - " + CONFIG[casaKey].titol;
    
    mostrarSeccio('detall-vigilancia');
    carregarAlarmesVigi(casaKey);
}

async function carregarAlarmesVigi(casaKey) {
    const llista = document.getElementById('llista-alarmes');
    llista.innerHTML = "Carregant darreres 8 lectures...";
    
    try {
        // Agafem les darreres 8 lectures de field5
        const res = await fetch(`https://api.thingspeak.com/channels/${CONFIG[casaKey].v_id}/feeds.json?api_key=${CONFIG[casaKey].key}&results=8`);
        const data = await res.json();
        
        if (data.feeds && data.feeds.length > 0) {
            llista.innerHTML = data.feeds.reverse().map(f => `
                <div style="border-bottom:1px solid #eee; padding:12px; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong style="color:#5A453A;">Punt:</strong> ${CONFIG[casaKey].titol}<br>
                        <small style="color:#888;">${new Date(f.created_at).toLocaleString()}</small>
                    </div>
                    <div style="text-align:right;">
                        <span style="background:#f8f9fa; padding:4px 8px; border-radius:4px; font-weight:bold;">
                            Dada: ${f.field5 || 'N/A'}
                        </span>
                    </div>
                </div>
            `).join('');
        } else {
            llista.innerHTML = "No hi ha registres disponibles.";
        }
    } catch (e) {
        llista.innerHTML = "Error al carregar l'historial.";
    }
}

// 6. FUNCIONS AUXILIARS (ESTATS I GRÀFICS)
async function verificarEstatTotesCases() {
    for (let id in CONFIG) {
        const punt = document.getElementById(`punt-${id}`);
        if (!punt) continue;
        try {
            const res = await fetch(`https://api.thingspeak.com/channels/${CONFIG[id].id}/feeds.json?api_key=${CONFIG[id].key}&results=1`);
            const data = await res.json();
            if (data.feeds && data.feeds[0]) {
                const diff = (new Date() - new Date(data.feeds[0].created_at)) / (1000 * 60 * 60);
                punt.className = "alerta-casa " + (diff < 1 ? "estat-connectat" : "estat-desconnectat");
            } else {
                punt.className = "alerta-casa estat-desconnectat";
            }
        } catch (e) {
            punt.className = "alerta-casa estat-desconnectat";
        }
    }
}

function crearGrafic(id, labels, data, label, color) {
    const canvas = document.getElementById(id);
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    if(charts[id]) charts[id].destroy();
    charts[id] = new Chart(ctx, {
        type: 'line',
        data: { 
            labels, 
            datasets: [{ 
                data, 
                borderColor: color, 
                backgroundColor: color+'22', 
                fill: true, 
                tension: 0.4, 
                pointRadius: 0 
            }] 
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            plugins: { legend: { display: false } }, 
            scales: { x: { display: false }, y: { display: false } } 
        }
    });
}
