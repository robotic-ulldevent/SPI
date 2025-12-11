document.addEventListener('DOMContentLoaded', () => {
    // === 1. CONFIGURACIÓ GLOBAL ===
    const CHANNEL_ID = '3200447';
    const READ_API_KEY = '85WNYIM35DMXK9Z7';
    const API_URL_LAST = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds/last.json?api_key=${READ_API_KEY}`;
    
    // Mapeig de camps i Alertes
    const FIELD_MAP = {
        temperatura: { field: 'field2', label: 'Temperatura', unit: '°C', threshold: 35, condition: '>' },
        humitat: { field: 'field1', label: 'Humitat', unit: '%', threshold: 75, condition: '>' },
        pluja: { field: 'field4', label: 'Pluja (1h)', unit: 'mm/h', threshold: 60, condition: '>' },
        inclinacio: { field: 'field3', label: 'Inclinació', unit: '°', threshold: 0, condition: '!=' },
        // Camps assumits per a Vigilància (ajustar si ThingSpeak utilitza altres camps)
        persona: { field: 'field5', label: 'Intrusió Persona', threshold_value: 1 }, 
        senglar: { field: 'field6', label: 'Intrusió Senglar', threshold_value: 1 } 
    };

    const splashScreen = document.getElementById('splash-screen');
    const mainContent = document.getElementById('main-content');
    const alertBox = document.getElementById('alert-box');
    const alertMessage = document.getElementById('alert-message');
    const alertSound = document.getElementById('alert-sound');

    // === 2. LÒGICA DE LA PORTADA (SPLASH SCREEN) ===
    if (splashScreen) {
        setTimeout(() => {
            splashScreen.classList.add('fade-out');
            setTimeout(() => {
                splashScreen.classList.add('hidden');
                mainContent.classList.remove('hidden');
            }, 500); 
        }, 5000); // 5 segons
    }

    // === 3. LÒGICA D'ALERTES ===

    /** Comprova les alertes i mostra el quadre si cal */
    function checkAlerts(data) {
        let alerts = [];
        let needsAlert = false;
        
        // Alerta Temperatura
        const temp = parseFloat(data[FIELD_MAP.temperatura.field]);
        if (temp > FIELD_MAP.temperatura.threshold) {
            alerts.push(`🌡️ Alerta: Temp. (${temp}°C) > 35°C`);
            needsAlert = true;
        }

        // Alerta Humitat
        const hum = parseFloat(data[FIELD_MAP.humitat.field]);
        if (hum > FIELD_MAP.humitat.threshold) {
            alerts.push(`💧 Alerta: Humitat (${hum}%) > 75%`);
            needsAlert = true;
        }

        // Alerta Inclinació (si és diferent de 0 en horitzontal)
        const incl = parseFloat(data[FIELD_MAP.inclinacio.field]);
        if (incl !== FIELD_MAP.inclinacio.threshold) {
            alerts.push(`📐 Alerta: Inclinació (${incl}°) diferent de 0°`);
            needsAlert = true;
        }

        // Alerta Pluja
        const pluja = parseFloat(data[FIELD_MAP.pluja.field]);
        if (pluja > FIELD_MAP.pluja.threshold) {
            alerts.push(`🌧️ Alerta: Pluja (${pluja}mm/h) > 60mm/h`);
            needsAlert = true;
        }
        
        // Alerta Persones (Assumint 1 significa detecció)
        const persona = parseFloat(data[FIELD_MAP.persona.field]);
        if (persona === FIELD_MAP.persona.threshold_value) {
            alerts.push(`👤 INTRUSIÓ: Persona no autoritzada detectada.`);
            needsAlert = true;
        }

        // Alerta Senglars (Assumint 1 significa detecció)
        const senglar = parseFloat(data[FIELD_MAP.senglar.field]);
        if (senglar === FIELD_MAP.senglar.threshold_value) {
            alerts.push(`🐗 INTRUSIÓ: Porc senglar detectat.`);
            needsAlert = true;
        }


        if (needsAlert) {
            alertMessage.innerHTML = alerts.join('<br>');
            alertBox.classList.remove('hidden');
            if (alertSound) alertSound.play();
        } else {
            alertBox.classList.add('hidden');
            if (alertSound) alertSound.pause();
        }
    }


    // === 4. LÒGICA DE RECOLLIDA DE DADES I CÀLCULS ===

    /**
     * Recupera l'última lectura i crida a la comprovació d'alertes.
     */
    async function fetchLastData() {
        try {
            const response = await fetch(API_URL_LAST);
            if (!response.ok) throw new Error('Error de xarxa amb ThingSpeak');
            
            const data = await response.json();
            
            // Comprova Alertes amb la darrera lectura
            checkAlerts(data);
            
            return data;
        } catch (error) {
            console.error('Error al obtenir l\'última lectura:', error);
            return null;
        }
    }

    // Exportem funcions per a ús a les subpàgines (p. ex., temperatura.html)
    window.FIELD_MAP = FIELD_MAP;
    window.CHANNEL_ID = CHANNEL_ID;
    window.READ_API_KEY = READ_API_KEY;
    window.fetchLastData = fetchLastData;
    window.checkAlerts = checkAlerts; // L'exportem per mantenir l'alerta activa en totes les pàgines

    // Cridem la funció al carregar la pàgina i cada 30 segons per mantenir l'estat de l'alerta
    fetchLastData();
    setInterval(fetchLastData, 30000); 
});
