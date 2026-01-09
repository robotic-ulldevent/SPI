let charts = {};
        let refreshInterval = null;

        // 1. CONTROL DE SECCIONS
        function mostrarSeccio(id) {
            // Aturem qualsevol interval actiu per evitar duplicats
            if(refreshInterval) clearInterval(refreshInterval);

            // Amaguem totes les seccions
            document.querySelectorAll('main, section').forEach(s => s.classList.add('oculta'));
            
            // Mostrem la secció demanada
            const target = document.getElementById(id);
            if(target) {
                target.classList.remove('oculta');
            } else {
                console.error("La secció amb ID '" + id + "' no existeix.");
            }
            
            // Si entrem a la Casa 1, activem la càrrega de dades i el refresc cada hora
            if(id === 'seccio-casa1') {
                carregarDades();
                // 3600000 ms = 1 hora
                refreshInterval = setInterval(carregarDades, 3600000); 
            }
            window.scrollTo(0,0);
        }

        // 2. CÀRREGA DE DADES I ACTUALITZACIÓ DE L'INDICADOR D'ESTAT
        async function carregarDades() {
            const icona = document.getElementById('estat-icona');
            const text = document.getElementById('estat-text');

            try {
                // Petició a l'API de ThingSpeak
                const res = await fetch('https://api.thingspeak.com/channels/3200447/feeds.json?results=15');
                
                // Si la resposta no és correcta (error 404, 500, etc.)
                if (!res.ok) throw new Error("Error en la connexió amb l'API");

                const data = await res.json();
                const feeds = data.feeds;
                
                if (feeds && feeds.length > 0) {
                    const ultim = feeds[feeds.length - 1];

                    // Actualitzem els valors textuals de la Casa 1
                    document.getElementById('val-temp').innerText = (ultim.field2 || "0") + " °C";
                    document.getElementById('val-hum').innerText = (ultim.field1 || "0") + " %";
                    document.getElementById('val-inc').innerText = (ultim.field3 || "0") + " °";

                    // INDICADOR EN VERD: Connexió establerta i dades rebudes
                    if(icona) icona.style.backgroundColor = "#27ae60"; 
                    if(text) text.innerText = "Estat: Connectat (ID: 27)";

                    // Preparem les etiquetes de temps (eix X)
                    const labels = feeds.map(f => new Date(f.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
                    
                    // Creem/Actualitzem els 3 gràfics
                    crearGrafic('graficTemp', labels, feeds.map(f => f.field2), 'Temp', '#f39c12');
                    crearGrafic('graficHum', labels, feeds.map(f => f.field1), 'Hum', '#3498db');
                    crearGrafic('graficInc', labels, feeds.map(f => f.field3), 'Inc', '#27ae60');
                    
                    console.log("Dades actualitzades correctament: " + new Date().toLocaleTimeString());
                } else {
                    throw new Error("No s'han trobat dades al canal");
                }

            } catch (e) {
                console.error("Error durant la càrrega:", e);
                
                // INDICADOR EN VERMELL: Error de xarxa o de dades
                if(icona) icona.style.backgroundColor = "#e74c3c"; 
                if(text) text.innerText = "Estat: Desconnectat";
            }
        }

        // 3. GENERACIÓ DE GRÀFICS AMB CHART.JS
        function crearGrafic(canvasId, labels, dataPoints, label, color) {
            const canvasElement = document.getElementById(canvasId);
            if(!canvasElement) return;

            const ctx = canvasElement.getContext('2d');
            
            // Si el gràfic ja existia, el destruïm per poder crear-ne un de nou amb dades fresques
            if(charts[canvasId]) charts[canvasId].destroy();
            
            charts[canvasId] = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{ 
                        label: label,
                        data: dataPoints, 
                        borderColor: color, 
                        backgroundColor: color + '22', // Color amb transparència
                        fill: true, 
                        tension: 0.4,
                        borderWidth: 2,
                        pointRadius: 0 // Amaguem els punts per un disseny més net
                    }]
                },
                options: { 
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { 
                        legend: { display: false } // No mostrem la llegenda per estalviar espai
                    },
                    scales: {
                        y: { 
                            display: true, 
                            ticks: { display: false }, 
                            grid: { display: false } 
                        },
                        x: { 
                            display: true, 
                            ticks: { display: false }, 
                            grid: { display: false } 
                        }
                    }
                }
            });
        }

     window.addEventListener('load', function() {
    setTimeout(function() {
        const splash = document.getElementById('splash');
        splash.style.opacity = '0';
        setTimeout(() => {
            splash.style.display = 'none';
        }, 1000); // Temps perquè acabi l'animació de desaparèixer
    }, 5000); // 5 segons de visualització
});
