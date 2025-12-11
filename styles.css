/* Estils Generals */
body {
    font-family: sans-serif;
    margin: 0;
    padding: 0;
    background-color: #f4f4f9;
    color: #333;
}

/* Classe per ocultar elements de manera forçada */
.oculta {
    display: none !important; 
}

/* --- ESTILS DE LA PANTALLA DE CÀRREGA --- */
.loading-screen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #2c3e50; 
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    color: white;
}
/* (Estils loading-image, loading-text i spinner es mantenen igual) */
.loading-image {
    width: 80%;
    max-width: 600px;
    height: auto;
    object-fit: cover;
    border: 5px solid white;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
    margin-bottom: 30px;
}
.loading-text {
    font-size: 1.5em;
    margin-bottom: 20px;
}
.spinner {
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top: 4px solid white;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
}
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* --- ESTILS DE LA CAPÇALERA (FRANJA VERMELLA) --- */
.portada.menu-roig {
    background-color: #c0392b; /* Vermell fosc / teula */
    color: white;
    padding: 50px 20px;
    text-align: center;
    margin-bottom: 0;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

main, section {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
}

.seccio {
    padding-top: 50px;
}

/* Estil general del Contenidor de Quadres */
.quadre-container {
    display: flex;
    flex-wrap: wrap; 
    gap: 20px;
    justify-content: center; /* Per centrar els quadres */
}

/* Estil general dels Quadres (Botons) */
.quadre {
    background-color: white;
    border-radius: 10px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2); 
    padding: 20px;
    text-align: center;
    text-decoration: none; 
    color: #333;
    transition: transform 0.3s, box-shadow 0.3s;
    flex-grow: 1; 
    min-width: 250px; 
}
.quadre:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

/* Estils Específics: 3 Quadres principals (han de quedar alineats) */
#menu-principal-botons .quadre {
    flex-basis: calc(33.33% - 20px); 
    max-width: calc(33.33% - 20px);
}
#menu-principal-botons .quadre h3 {
    color: #c0392b; 
}

/* Estils Específics: 4 Quadres de Casa 1 */
.casa1-detall-container .quadre {
    background-color: #ecf0f1; 
    flex-basis: calc(25% - 20px); 
    max-width: calc(25% - 20px);
}
/* Estils Específics: 4 Quadres de Sensors (Cases) */
.sensors-container .quadre {
    background-color: #3498db; 
    color: white;
    flex-basis: calc(25% - 20px); 
    max-width: calc(25% - 20px);
}

/* (Estils boto-tornar i gràfics es mantenen igual) */
.boto-tornar {
    display: inline-block;
    margin-bottom: 20px;
    padding: 10px 15px;
    background-color: #95a5a6;
    color: white;
    text-decoration: none;
    border-radius: 5px;
}
#grafic-temperatura {
    margin-top: 40px;
    padding: 20px;
    background-color: white;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    height: 400px; 
    max-width: 100%;
}
#casa1-detall {
    max-width: 90%; 
}

/* Estil Responsivitat: Mòbils */
@media (max-width: 768px) {
    .menu-principal .quadre,
    .sensors-container .quadre,
    .casa1-detall-container .quadre {
        flex-basis: 100%; 
        max-width: 100%;
    }
}
