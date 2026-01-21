let charts = {};
const CONFIG = {
    'casa1': { key: 'READ_KEY_CASA1', id: '3200447', v_id: '3229918', punt: 'ne', titol: 'Nord-est' },
    'casa2': { key: 'I9QM383Z4L55KB0F', id: '3229918', v_id: '3229918', punt: 'no', titol: 'Nord-oest' },
    'casa3': { key: 'ULWM1RF9EGBLJ3I5', id: '3229919', v_id: '3229919', punt: 'se', titol: 'Sud-est' },
    'casa4': { key: 'BZYJ00BYU6P4P48M', id: '3229920', v_id: '3229920', punt: 'so', titol: 'Sud-oest' }
};

window.addEventListener('load', () => {
    setTimeout(() => { 
        const splash = document.getElementById('splash');
        if(splash) splash.style.display = 'none'; 
    }, 5000);
    verificarEstatTotes();
    verificarVigiTotes();
});

function mostrarSeccio(id) {
    document.querySelectorAll('main, section').forEach(s => s.classList.add('oculta'));
    document.getElementById(id).classList.remove('oculta');
    if(id === 'seccio-vigilancia') verificarVigiTotes();
    window.scrollTo(0,0);
}

async function obrirCasa(id) {
    document.getElementById('titol-casa').innerText = "Dades " + id.toUpperCase();
    mostrarSeccio('seccio-detall-casa');
    try {
        const res = await fetch(`https://api.thingspeak.com/channels/${CONFIG[id].id}/feeds.json?api_key=${CONFIG[id].key}&results=15`);
        const data = await res.json();
        const ultim = data.feeds[data.feeds.length-1];
        
        document.getElementById('val-hum').innerText = (ultim.field1 || 0) + " %";
        document.getElementById('val-temp').innerText = (ultim.field2 || 0) + " °C";
        document.getElementById('val-inc').innerText = (ultim.field3 || 0) + " °";
        document.getElementById('val-pluja').innerText = (ultim.field4 || 0) + " mm";
        
        document.getElementById('estat-icona').className = "icona-estat estat-online";
        document.getElementById('estat-text').innerText = "En línia: " + id;

        const labels = data.feeds.map(f => new Date(f.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}));
        crearGrafic('graficHum', labels, data.feeds.map(f => f.field1), '#3498db');
        crearGrafic('graficTemp', labels, data.feeds.map(f => f.field2), '#f39c12');
        crearGrafic('graficInc', labels, data.feeds.map(f => f.field3), '#27ae60');
        crearGrafic('graficPluja', labels, data.feeds.map(f => f.field4), '#16a085');
    } catch(e) { 
        document.getElementById('estat-icona').className = "icona-estat estat-offline"; 
    }
}

async function verificarVigiTotes() {
    for (let k in CONFIG) {
        const pilot = document.getElementById(`pilot-${CONFIG[k].punt}`);
        try {
            const res = await fetch(`https://api.thingspeak.com/channels/${CONFIG[k].v_id}/feeds.json?api_key=${CONFIG[k].key}&results=1`);
            const data = await res.json();
            if(data.feeds && data.feeds[0]) {
                const hores = (new Date() - new Date(data.feeds[0].created_at)) / 3600000;
                pilot.className = "pilot-vigi " + (hores < 12 ? "vigi-vermell" : "vigi-verd");
            } else pilot.className = "pilot-vigi vigi-verd";
        } catch(e) { pilot.className = "pilot-vigi vigi-groc"; }
    }
}

async function obrirDetallVigi(puntId) {
    const k = Object.keys(CONFIG).find(x => CONFIG[x].punt === puntId);
    document.getElementById('titol-vigi').innerText = "Últimes 8 lectures - " + CONFIG[k].titol;
    mostrarSeccio('detall-vigilancia');
    const llista = document.getElementById('llista-alarmes');
    llista.innerHTML = "Carregant...";
    try {
        const res = await fetch(`https://api.thingspeak.com/channels/${CONFIG[k].v_id}/feeds.json?api_key=${CONFIG[k].key}&results=8`);
        const data = await res.json();
        llista.innerHTML = data.feeds.reverse().map(f => `
            <div style="border-bottom:1px solid #eee; padding:10px;">
                <b>Dada (F5):</b> ${f.field5 || 'Detectada'} <br>
                <small>${new Date(f.created_at).toLocaleString()}</small>
            </div>`).join('');
    } catch(e) { llista.innerHTML = "Error."; }
}

function crearGrafic(id, labels, data, color) {
    const ctx = document.getElementById(id).getContext('2d');
    if(charts[id]) charts[id].destroy();
    charts[id] = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets: [{ data, borderColor: color, fill: false, tension: 0.3, pointRadius: 0 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }
    });
}

async function verificarEstatTotes() {
    for (let k in CONFIG) {
        try {
            const res = await fetch(`https://api.thingspeak.com/channels/${CONFIG[k].id}/feeds.json?api_key=${CONFIG[k].key}&results=1`);
            const data = await res.json();
            const hores = (new Date() - new Date(data.feeds[0].created_at)) / 3600000;
            const punt = document.getElementById(`punt-${k}`);
            if(punt) punt.style.backgroundColor = (hores < 1 ? "#2ecc71" : "#e74c3c");
        } catch(e) {}
    }
}
