'use strict';
 
/* 
  CONFIGURACIÓN Y DATOS
    */
 
const ADMIN_USER = 'admin';
const ADMIN_PASS = '2026';
const NOTA_APROBACION = 70;          
const DB_KEY = 'viajeros_estacion_gt';
 
const RUTAS = [
    { id: 'colonial', nombre: 'Ruta Colonial',     trayecto: 'Guatemala ➔ Antigua',               salida: '07:30 AM', llegada: '08:30 AM', precio: 25,  anden: 1, imagen: 'img/antigua.jpg',      enlace: 'https://es.wikipedia.org/wiki/Antigua_Guatemala' },
    { id: 'altos',    nombre: 'Ruta de Los Altos', trayecto: 'Guatemala ➔ Quetzaltenango',        salida: '06:00 AM', llegada: '09:45 AM', precio: 60,  anden: 2, imagen: 'img/quetzaltenango.jpg', enlace: 'https://es.wikipedia.org/wiki/Quetzaltenango' },
    { id: 'maya',     nombre: 'Ruta Maya Express', trayecto: 'Guatemala ➔ Flores, Petén',         salida: '05:00 AM', llegada: '11:30 AM', precio: 150, anden: 3, imagen: 'img/peten.jpg',        enlace: 'https://es.wikipedia.org/wiki/Flores_(Guatemala)' },
    { id: 'caribe',   nombre: 'Ruta Caribe',       trayecto: 'Guatemala ➔ Puerto Barrios',        salida: '06:30 AM', llegada: '12:00 PM', precio: 85,  anden: 4, imagen: 'img/puerto-barrios.jpg', enlace: 'https://es.wikipedia.org/wiki/Puerto_Barrios' }
];
 
const CLASES = {
    turista:   { nombre: 'Turista / Estándar',        recargo: 0 },
    ejecutiva: { nombre: 'Ejecutiva / Preferencial',  recargo: 25 },
    primera:   { nombre: 'Primera Clase',             recargo: 50 }
};
 
const TIPOS_VIAJERO = {
    adulto: { nombre: 'Adulto',                factor: 1 },
    nino:   { nombre: 'Niño (3 a 12 años)',    factor: 0.5 },
    mayor:  { nombre: 'Adulto mayor (60+)',    factor: 0.75 }
};
 
const PUNTOS = {
    puntualidad: { 'Excelente': 100, 'Buena': 70, 'Regular': 30 },
    recomendacion: { 'Sí': 100, 'Tal vez': 60, 'No': 20 },
    atencion: { 'Excelente': 100, 'Buena': 75, 'Regular': 50, 'Deficiente': 20 }
};
 
const IMAGEN_RESPALDO = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400">' +
    '<rect width="800" height="400" fill="#262632"/>' +
    '<text x="400" y="205" fill="#a855f7" font-family="sans-serif" font-size="26" text-anchor="middle">Imagen no disponible</text></svg>'
);
 
/* 
    ESTADO ASE DE DATOS
    */
 
const state = {
    ruta: null,      
    registro: null  
};
 
const db = {
    todos() {
        try {
            return JSON.parse(localStorage.getItem(DB_KEY)) || [];
        } catch (e) {
            return [];
        }
    },
    guardar(registro) {
        const lista = this.todos();
        const i = lista.findIndex(r => r.id === registro.id);
        if (i >= 0) {
            lista[i] = registro;
        } else {
            lista.push(registro);
        }
        localStorage.setItem(DB_KEY, JSON.stringify(lista));
    },
    vaciar() {
        localStorage.removeItem(DB_KEY);
    }
};
 
/* 
    UTILIDADES
    */
 
const $ = id => document.getElementById(id);
 
const dinero = n => `Q ${n.toFixed(2)}`;
 
function calcularTotal(ruta, claseKey, tipoKey) {
    const base = ruta.precio + CLASES[claseKey].recargo;
    return base * TIPOS_VIAJERO[tipoKey].factor;
}
 
function fechaLegible(iso) {
    // iso = "2026-05-20" -> "20/05/2026" 
    const [a, m, d] = iso.split('-');
    return `${d}/${m}/${a}`;
}
 
function hoyISO() {
    const h = new Date();
    return new Date(h.getTime() - h.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
 
function mostrarSeccion(id) {
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    $(id).classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
 
/* Rellena todos los data-campo dentro de un contenedor usa textContent: seguro */
function llenarCampos(contenedorId, datos) {
    $(contenedorId).querySelectorAll('[data-campo]').forEach(el => {
        el.textContent = datos[el.dataset.campo] ?? '';
    });
}
 
function crearEl(tag, texto, clase) {
    const el = document.createElement(tag);
    if (texto !== undefined) el.textContent = texto;
    if (clase) el.className = clase;
    return el;
}
 
/*   registro guardado  listo para mostrar */
function aPlano(reg) {
    return {
        codigo: reg.codigo,
        nombre: reg.pasajero.nombre,
        documento: reg.pasajero.documento,
        email: reg.pasajero.email,
        tipo: reg.pasajero.tipo,
        ruta: reg.viaje.ruta,
        trayecto: reg.viaje.trayecto,
        salida: reg.viaje.salida,
        llegada: reg.viaje.llegada,
        anden: `Andén ${reg.viaje.anden}`,
        fechaViaje: fechaLegible(reg.viaje.fecha),
        clase: reg.viaje.clase,
        total: dinero(reg.viaje.total)
    };
}
 
/* 
    IMÁGENES CON RESPALDO
    */
 
document.addEventListener('error', e => {
    const el = e.target;
    if (el.tagName === 'IMG' && !el.dataset.respaldo) {
        el.dataset.respaldo = '1';
        el.src = IMAGEN_RESPALDO;
    }
}, true);
 
/* 
  . LOGIN Y PANEL ADMIN
    */
 
function abrirLogin() {
    $('modal-login').classList.remove('hidden');
    $('admin-user').focus();
}
 
function cerrarLogin() {
    $('modal-login').classList.add('hidden');
    $('form-login').reset();
    $('login-error').classList.add('hidden');
}
 
function iniciarSesionAdmin(e) {
    e.preventDefault();
    const user = $('admin-user').value.trim();
    const pass = $('admin-pass').value;
 
    if (user === ADMIN_USER && pass === ADMIN_PASS) {
        cerrarLogin();
        mostrarSeccion('sec-admin');
        cargarPanelAdmin();
    } else {
        $('login-error').classList.remove('hidden');
    }
}
 
function cargarPanelAdmin() {
    const datos = db.todos();
    const tbody = $('admin-tbody');
    tbody.innerHTML = '';
 
    const evaluados = datos.filter(r => r.evaluacion);
    const aprobados = evaluados.filter(r => r.evaluacion.aprobado);
    const promedio = evaluados.length
        ? Math.round(evaluados.reduce((s, r) => s + r.evaluacion.puntaje, 0) / evaluados.length)
        : 0;
 
    const stats = $('admin-stats');
    stats.innerHTML = '';
    [
        ['Viajeros registrados', datos.length],
        ['Evaluaciones', evaluados.length],
        ['Puntaje promedio', `${promedio} / 100`],
        ['Aprobados', aprobados.length]
    ].forEach(([etiqueta, valor]) => {
        const caja = crearEl('div', undefined, 'stat');
        caja.appendChild(crearEl('strong', String(valor)));
        caja.appendChild(crearEl('span', etiqueta));
        stats.appendChild(caja);
    });
 
    if (datos.length === 0) {
        const tr = document.createElement('tr');
        const td = crearEl('td', 'Aún no hay viajeros registrados.');
        td.colSpan = 8;
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
    }
 
    datos.forEach((reg, i) => {
        const ev = reg.evaluacion;
        const celdas = [
            i + 1,
            reg.pasajero.nombre,
            reg.pasajero.documento,
            reg.viaje.ruta,
            fechaLegible(reg.viaje.fecha),
            ev ? ev.puntaje : '-',
            ev ? (ev.aprobado ? 'Aprobado' : 'No aprobado') : 'Sin evaluar',
            ev && ev.respuestas.comentarios ? ev.respuestas.comentarios : '-'
        ];
        const tr = document.createElement('tr');
        celdas.forEach(c => tr.appendChild(crearEl('td', String(c))));
        tbody.appendChild(tr);
    });
}
 
function vaciarDatos() {
    if (confirm('¿Seguro que desea borrar todos los viajeros y evaluaciones guardados?')) {
        db.vaciar();
        cargarPanelAdmin();
    }
}
 
/* 
   TARIFAS, RUTAS Y REGISTRO
    */
 
function renderTarifas() {
    const tbody = $('tarifas-body');
    RUTAS.forEach(r => {
        const tr = document.createElement('tr');
        [
            r.nombre,
            r.trayecto,
            `${r.salida} - ${r.llegada}`,
            dinero(r.precio),
            dinero(r.precio + CLASES.ejecutiva.recargo),
            dinero(r.precio + CLASES.primera.recargo)
        ].forEach(t => tr.appendChild(crearEl('td', t)));
        tbody.appendChild(tr);
    });
}
 
function renderRutas() {
    const grid = $('rutas-grid');
    RUTAS.forEach(r => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'ruta-card';
        card.dataset.id = r.id;
        card.appendChild(crearEl('h3', r.nombre));
        card.appendChild(crearEl('p', r.trayecto, 'estaciones'));
        card.appendChild(crearEl('p', `${r.salida} - ${r.llegada}`, 'horario'));
        card.appendChild(crearEl('p', `Desde ${dinero(r.precio)}`, 'precio'));
        card.addEventListener('click', () => seleccionarRuta(r, card));
        grid.appendChild(card);
    });
}
 
function renderOpcionesRegistro() {
    Object.entries(TIPOS_VIAJERO).forEach(([key, t]) => {
        const texto = t.factor === 1 ? t.nombre : `${t.nombre} (${Math.round(t.factor * 100)} % de la tarifa)`;
        $('reg-tipo').add(new Option(texto, key));
    });
    Object.entries(CLASES).forEach(([key, c]) => {
        const texto = c.recargo ? `${c.nombre} (+Q${c.recargo})` : c.nombre;
        $('reg-clase').add(new Option(texto, key));
    });
}
 
function seleccionarRuta(ruta, card) {
    document.querySelectorAll('.ruta-card').forEach(c => c.classList.remove('activa'));
    card.classList.add('activa');
    state.ruta = ruta;
 
    $('resumen-ruta-txt').textContent = `${ruta.nombre}: ${ruta.trayecto}`;
    $('resumen-horario-txt').textContent = `${ruta.salida} - ${ruta.llegada}`;
 
    $('paso-registro').classList.remove('hidden');
    actualizarTotal();
    $('paso-registro').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
 
function actualizarTotal() {
    if (!state.ruta) return;
    const total = calcularTotal(state.ruta, $('reg-clase').value, $('reg-tipo').value);
    $('total-estimado').textContent = dinero(total);
}
 
function validarRegistro() {
    let ok = true;
    const marcar = (id, mensaje) => {
        $(id).textContent = mensaje;
        if (mensaje) ok = false;
    };
 
    const nombre = $('reg-nombre').value.trim();
    marcar('err-nombre', nombre.length < 3 || !nombre.includes(' ')
        ? 'Escriba su nombre y apellido.' : '');
 
    const doc = $('reg-documento').value;
    marcar('err-documento', !/^\d{6,13}$/.test(doc)
        ? 'Use entre 6 y 13 dígitos (sin guiones ni espacios).' : '');
 
    marcar('err-email', !$('reg-email').checkValidity() || $('reg-email').value.trim() === ''
        ? 'Escriba un correo válido, por ejemplo nombre@correo.com.' : '');
 
    const fecha = $('reg-fecha').value;
    marcar('err-fecha', !fecha || fecha < hoyISO()
        ? 'Elija una fecha de hoy en adelante.' : '');
 
    return ok;
}
 
function procesarRegistro(e) {
    e.preventDefault();
 
    if (!state.ruta) {
        alert('Primero seleccione una ruta.');
        return;
    }
    if (!validarRegistro()) return;
 
    const claseKey = $('reg-clase').value;
    const tipoKey = $('reg-tipo').value;
 
    state.registro = {
        id: Date.now(),
        codigo: 'FG-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
        pasajero: {
            nombre: $('reg-nombre').value.trim(),
            documento: $('reg-documento').value,
            email: $('reg-email').value.trim(),
            tipo: TIPOS_VIAJERO[tipoKey].nombre
        },
        viaje: {
            rutaId: state.ruta.id,
            ruta: state.ruta.nombre,
            trayecto: state.ruta.trayecto,
            salida: state.ruta.salida,
            llegada: state.ruta.llegada,
            anden: state.ruta.anden,
            fecha: $('reg-fecha').value,
            clase: CLASES[claseKey].nombre,
            total: calcularTotal(state.ruta, claseKey, tipoKey)
        },
        evaluacion: null
    };
 
    llenarCampos('resumen-datos', aPlano(state.registro));
    mostrarSeccion('sec-resumen');
}
 
/* 
    BOLETO
    */
 
function confirmarYMostrarBoleto() {
    db.guardar(state.registro);   // se guarda el viajero en la base de datos
 
    const ruta = RUTAS.find(r => r.id === state.registro.viaje.rutaId);
    llenarCampos('boleto', aPlano(state.registro));
 
    const img = $('boleto-imagen');
    delete img.dataset.respaldo;
    img.src = ruta.imagen;
    img.alt = `Imagen de ${ruta.trayecto.split('➔')[1].trim()}`;
    $('boleto-imagen-pie').textContent = ruta.trayecto;
 
    $('enlace-destino').href = ruta.enlace;
    $('enlace-destino').textContent = `Conozca su destino: ${ruta.trayecto.split('➔')[1].trim()}`;
 
    mostrarSeccion('sec-boleto');
}
 
/* 
   EVALUACIÓN, RESULTADO Y DIPLOMA
    */
 
function procesarEvaluacion(e) {
    e.preventDefault();
 
    const valor = name => document.querySelector(`input[name="${name}"]:checked`).value;
 
    const respuestas = {
        puntualidad: valor('p1'),
        servicios: Array.from(document.querySelectorAll('input[name="p2"]:checked')).map(cb => cb.value),
        frecuencia: $('p3').value,
        limpieza: Number($('p4').value),
        recomendacion: valor('p5'),
        atencion: $('p6').value,
        comentarios: $('p7').value.trim()
    };
 
    const detalle = [
        { pregunta: 'Puntualidad', respuesta: respuestas.puntualidad,     puntos: PUNTOS.puntualidad[respuestas.puntualidad] },
        { pregunta: 'Limpieza',    respuesta: `${respuestas.limpieza} / 5`, puntos: respuestas.limpieza * 20 },
        { pregunta: 'Recomendación', respuesta: respuestas.recomendacion,   puntos: PUNTOS.recomendacion[respuestas.recomendacion] },
        { pregunta: 'Atención del personal', respuesta: respuestas.atencion, puntos: PUNTOS.atencion[respuestas.atencion] }
    ];
 
    const puntaje = Math.round(detalle.reduce((s, d) => s + d.puntos, 0) / detalle.length);
 
    state.registro.evaluacion = {
        respuestas,
        detalle,
        puntaje,
        aprobado: puntaje >= NOTA_APROBACION,
        fecha: new Date().toLocaleString('es-GT')
    };
 
    db.guardar(state.registro);   // se actualiza el registro con la evaluación
    mostrarResultado();
}
 
function mostrarResultado() {
    const reg = state.registro;
    const ev = reg.evaluacion;
 
    $('puntaje-valor').textContent = ev.puntaje;
    $('barra-relleno').style.width = `${ev.puntaje}%`;
 
    const lista = $('resultado-detalle');
    lista.innerHTML = '';
    ev.detalle.forEach(d => {
        lista.appendChild(crearEl('li', `${d.pregunta}: ${d.respuesta} (${d.puntos} pts)`));
    });
    if (ev.respuestas.servicios.length) {
        lista.appendChild(crearEl('li', `Áreas utilizadas: ${ev.respuestas.servicios.join(', ')}`));
    }
 
    $('resultado-mensaje').textContent = ev.aprobado
        ? `¡Aprobado! Superó el mínimo de ${NOTA_APROBACION} puntos. Gracias por ayudarnos a mejorar.`
        : `Puntaje por debajo de ${NOTA_APROBACION}. Gracias por su sinceridad; trabajaremos para mejorar. Puede repetir la evaluación.`;
 
    $('diploma').classList.toggle('hidden', !ev.aprobado);
    $('btn-imprimir-diploma').classList.toggle('hidden', !ev.aprobado);
    $('btn-repetir').classList.toggle('hidden', ev.aprobado);
 
    if (ev.aprobado) {
        $('diploma-nombre').textContent = reg.pasajero.nombre;
        $('diploma-puntaje').textContent = ev.puntaje;
        $('diploma-ruta').textContent = reg.viaje.ruta;
        $('diploma-fecha').textContent = ev.fecha.split(',')[0];
        $('diploma-codigo').textContent = reg.codigo;
    }
 
    mostrarSeccion('sec-resultado');
}
 
/* 
    IMPRESIÓN boleto y diploma
    */
 
function escapar(texto) {
    return String(texto).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}
 
/* Abre un documento limpio en otra ventana y lo imprime
   Si el navegador bloquea la ventana, imprime la página actual. */
function imprimirDocumento(titulo, cuerpoHTML, css) {
    const ventana = window.open('', '_blank');
 
    if (!ventana) {
        window.print();   // respaldo
        return;
    }
 
    ventana.document.write(
        '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">' +
        `<title>${escapar(titulo)}</title><style>${css}</style></head><body>${cuerpoHTML}</body></html>`
    );
    ventana.document.close();
    ventana.focus();
    setTimeout(() => ventana.print(), 400);
}
 
const CSS_IMPRESION = `
    * { box-sizing: border-box; font-family: Arial, sans-serif; }
    body { margin: 0; padding: 24px; color: #111; }
    h1 { color: #4c1d95; margin-bottom: 4px; }
    .caja { border: 2px solid #4c1d95; border-radius: 8px; padding: 20px; max-width: 600px; }
    .codigo { display: flex; justify-content: space-between; border-bottom: 2px dashed #999; padding-bottom: 8px; margin-bottom: 12px; }
    p { margin: 6px 0; font-size: 15px; }
    .diploma { border: 8px double #4c1d95; padding: 50px 30px; text-align: center; }
    .diploma h1 { font-size: 40px; }
    .diploma .nombre { font-size: 34px; font-weight: bold; margin: 18px 0; }
    .pie { margin-top: 30px; font-size: 13px; color: #444; }
    @page { margin: 12mm; }
`;
 
function imprimirBoleto() {
    const d = aPlano(state.registro);
    const html = `
        <h1>FEGUA GT - Boleto</h1>
        <div class="caja">
            <div class="codigo"><span>Código</span><strong>${escapar(d.codigo)}</strong></div>
            <p><strong>Pasajero:</strong> ${escapar(d.nombre)}</p>
            <p><strong>Documento:</strong> ${escapar(d.documento)}</p>
            <p><strong>Ruta:</strong> ${escapar(d.ruta)}</p>
            <p><strong>Trayecto:</strong> ${escapar(d.trayecto)}</p>
            <p><strong>Fecha de viaje:</strong> ${escapar(d.fechaViaje)}</p>
            <p><strong>Hora de salida:</strong> ${escapar(d.salida)}</p>
            <p><strong>Hora de llegada:</strong> ${escapar(d.llegada)}</p>
            <p><strong>Andén:</strong> ${escapar(d.anden)}</p>
            <p><strong>Clase:</strong> ${escapar(d.clase)}</p>
            <p><strong>Total pagado:</strong> ${escapar(d.total)}</p>
        </div>`;
    imprimirDocumento(`Boleto ${d.codigo}`, html, CSS_IMPRESION);
}
 
function imprimirDiploma() {
    const reg = state.registro;
    const ev = reg.evaluacion;
    const html = `
        <div class="diploma">
            <p>FEGUA GT · Estación Central</p>
            <h1>DIPLOMA DE APROBACIÓN</h1>
            <p>Se otorga a</p>
            <p class="nombre">${escapar(reg.pasajero.nombre)}</p>
            <p>por completar y aprobar la evaluación de satisfacción del servicio<br>
               con un puntaje de <strong>${escapar(ev.puntaje)}</strong> / 100.</p>
            <p class="pie">Ruta: ${escapar(reg.viaje.ruta)} · Fecha: ${escapar(ev.fecha.split(',')[0])} · Código: ${escapar(reg.codigo)}</p>
        </div>`;
    imprimirDocumento(`Diploma ${reg.codigo}`, html, CSS_IMPRESION + ' @page { size: landscape; }');
}
 
/* 
    REINICIO
    */
 
function reiniciarProceso() {
    $('form-registro').reset();
    $('form-evaluacion').reset();
    $('p4-valor').textContent = '5';
    document.querySelectorAll('.error-campo').forEach(el => { el.textContent = ''; });
    document.querySelectorAll('.ruta-card').forEach(c => c.classList.remove('activa'));
    $('paso-registro').classList.add('hidden');
 
    state.ruta = null;
    state.registro = null;
 
    mostrarSeccion('sec-inicio');
}
 
/* 
    INICIALIZACIÓN: todos los eventos se conectan aquí
    */
 
document.addEventListener('DOMContentLoaded', () => {
    renderTarifas();
    renderRutas();
    renderOpcionesRegistro();
 
    // Fecha mínima de viaje = hoy
    $('reg-fecha').min = hoyISO();
 
    // Filtros de escritura
    $('reg-nombre').addEventListener('input', function () {
        this.value = this.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]/g, '');
    });
    $('reg-documento').addEventListener('input', function () {
        this.value = this.value.replace(/\D/g, '').slice(0, 13);
    });
 
    // Total en vivo
    $('reg-clase').addEventListener('change', actualizarTotal);
    $('reg-tipo').addEventListener('change', actualizarTotal);
 
    // Login / admin
    $('btn-open-login').addEventListener('click', abrirLogin);
    $('btn-close-login').addEventListener('click', cerrarLogin);
    $('form-login').addEventListener('submit', iniciarSesionAdmin);
    $('modal-login').addEventListener('click', e => { if (e.target === $('modal-login')) cerrarLogin(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarLogin(); });
    $('btn-logout').addEventListener('click', () => mostrarSeccion('sec-inicio'));
    $('btn-vaciar').addEventListener('click', vaciarDatos);
 
    // Flujo principal
    $('form-registro').addEventListener('submit', procesarRegistro);
    $('btn-editar').addEventListener('click', () => mostrarSeccion('sec-inicio'));
    $('btn-confirmar').addEventListener('click', confirmarYMostrarBoleto);
    $('btn-imprimir-boleto').addEventListener('click', imprimirBoleto);
    $('btn-ir-evaluacion').addEventListener('click', () => mostrarSeccion('sec-evaluacion'));
 
    $('p4').addEventListener('input', () => { $('p4-valor').textContent = $('p4').value; });
    $('form-evaluacion').addEventListener('submit', procesarEvaluacion);
 
    $('btn-imprimir-diploma').addEventListener('click', imprimirDiploma);
    $('btn-repetir').addEventListener('click', () => {
        $('form-evaluacion').reset();
        $('p4-valor').textContent = '5';
        mostrarSeccion('sec-evaluacion');
    });
    $('btn-nuevo').addEventListener('click', reiniciarProceso);
});