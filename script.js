function inicialitzarAplicacio() {
    setTimeout(() => {
        document.getElementById('loading-screen').classList.add('oculta');
        document.getElementById('app-container').classList.remove('oculta');
        mostrarSeccio('principal'); 
        comprovarEstatConnexio();
    }, 5000); // 5 Segons
}

function mostrarSeccio(seccio) {
    // Amaguem totes les seccions i el menú
    document.querySelectorAll('section').forEach(s => s.classList.add('oculta'));
    document.getElementById('menu-principal-botons').classList.add('oculta');

    if (seccio === 'principal') {
        document.getElementById('menu-principal-botons').classList.remove('oculta');
    } else if (seccio === 'sensors') {
        document.getElementById('modul-sensors').classList.remove('oculta');
    } else if (seccio === 'casa1') {
        document.getElementById('casa1-detall').classList.remove('oculta');
    } else {
        document.getElementById(seccio).classList.remove('oculta');
    }
}

// ... resta de funcions de connexió i dades ...

document.addEventListener('DOMContentLoaded', inicialitzarAplicacio);
