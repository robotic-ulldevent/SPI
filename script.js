document.addEventListener('DOMContentLoaded', () => {
    // === 1. CONFIGURACIÓ GLOBAL (Sense Canvis) ===
    const CHANNEL_ID = '3200447';
    const READ_API_KEY = '85WNYIM35DMXK9Z7';
    const API_URL_LAST = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds/last.json?api_key=${READ_API_KEY}`;
    
    // ... FIELD_MAP (sense canvis) ...
    const FIELD_MAP = {
        temperatura: { field: 'field2', label: 'Temperatura', unit: '°C', threshold: 35, condition: '>' },
        humitat: { field: 'field1', label: 'Humitat', unit: '%', threshold: 75, condition: '>' },
        pluja: { field: 'field4', label: 'Pluja (1h)', unit: 'mm/h', threshold: 60, condition: '>' },
        inclinacio: { field: 'field3', label: 'Inclinació', unit: '°', threshold: 0, condition: '!=' },
        persona: { field: 'field5', label: 'Intrusió Persona', threshold_value: 1 }, 
        senglar: { field: 'field6', label: 'Intrusió Senglar', threshold_value: 1 } 
    };

    const splashScreen = document.getElementById('splash-screen');
    const mainContent = document.getElementById('main-content');
    const alertBox = document.getElementById('alert-box');
    const alertMessage = document.getElementById('alert-message');
    const alertSound = document.getElementById('alert-sound');
    
    // NOUS ELEMENTS D'ESTAT
    const statusIcon = document.getElementById('status-icon');
    const statusLabel = document.getElementById('status-label');

    // === 2. LÒGICA DE LA PORTADA (SPLASH SCREEN) (Sense Canvis) ===
    if (splashScreen) {
        // ... (el codi existent de 5 segons) ...
        setTimeout(() => {
            splashScreen.classList.add('fade-out');
            setTimeout(() => {
                splashScreen.classList.add('hidden');
                mainContent.classList.remove('hidden');
            }, 500); 
        }, 5000); // 5 segons
    }

    // === 3. LÒGICA D'ALERTES (Sense Canvis) ===
    function checkAlerts(data) {
        // ... (el codi existent de checkAlerts) ...
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


    // === 4. LÒGICA DE RECOLLIDA DE DADES I ESTAT ===

    /** Actualitza l'indicador visual de connexió */
    function updateConnectionStatus(success) {
        if (!statusIcon || !statusLabel) return;

        // Reset classes
        statusIcon.classList.remove('icon-success', 'icon-error', 'icon-loading');
        statusIcon.style.animation = 'none';

        if (success) {
            statusIcon.innerHTML = '✔'; // Tick verd
            statusIcon.classList.add('icon-success');
            statusLabel.textContent = 'Rebent dades de ThingSpeak';
        } else {
            statusIcon.innerHTML = '✕'; // Creu vermella
            statusIcon.classList.add('icon-error');
            statusLabel.textContent = 'Sense connexió a ThingSpeak (ERROR)';
        }
    }
    
    /** Recupera l'última lectura i crida a la comprovació d'alertes. */
    async function fetchLastData() {
        // Estat de càrrega
        if (statusIcon) {
            statusIcon.innerHTML = '...';
            statusIcon.classList.add('icon-loading');
            statusIcon.style.animation = 'spin 1s infinite linear';
        }
        if (statusLabel) statusLabel.textContent = 'Connectant...';
        
        try {
            const response = await fetch(API_URL_LAST);
            
            if (!response.ok) {
                updateConnectionStatus(false);
                throw new Error('Error de xarxa amb ThingSpeak');
            }
            
            const data = await response.json();
            
            // Si la resposta és OK, però les dades són antigues o buides... podríem afinar més.
            // Però, per defecte, si l'API respon OK, considerem la connexió exitosa.
            updateConnectionStatus(true);
            
            // Comprova Alertes amb la darrera lectura
            checkAlerts(data);
            
            return data;
        } catch (error) {
            console.error('Error al obtenir l\'última lectura:', error);
            updateConnectionStatus(false);
            return null;
        }
    }

    // Exportem funcions per a ús a les subpàgines (sense canvis)
    window.FIELD_MAP = FIELD_MAP;
    window.CHANNEL_ID = CHANNEL_ID;
    window.READ_API_KEY = READ_API_KEY;
    window.fetchLastData = fetchLastData;
    window.checkAlerts = checkAlerts;

    // Cridem la funció al carregar la pàgina i cada 30 segons per mantenir l'estat
    fetchLastData();
    // Continuem actualitzant l'estat cada 30 segons per comprovar la connexió
    setInterval(fetchLastData, 30000); 
});
