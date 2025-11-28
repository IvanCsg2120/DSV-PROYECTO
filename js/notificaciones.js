// js/notificaciones.js
// Gestión completa del sistema de notificaciones

let notificaciones = [];
let filtrosActivos = {
    tipo: 'todas',
    estado: 'todas',
    fecha: 'todas'
};

// Inicialización del sistema de notificaciones
async function inicializarNotificaciones() {
    await openDB();
    
    // Verificar sesión
    const s = localStorage.getItem("sessionUser");
    if (!s) { 
        location.href = "index.html"; 
        return; 
    }

    const user = JSON.parse(s);
    
    // Actualizar información del usuario en sidebar
    document.getElementById("sidebarUserName").textContent = user.nombre || "Usuario";
    document.getElementById("sidebarUserRole").textContent = user.rol || "Administrador";

    // Cargar notificaciones
    await cargarNotificaciones();
    
    // Configurar eventos
    configurarEventosNotificaciones();
    
    // Cargar configuración
    await cargarConfiguracion();
    
    console.log("✅ Sistema de notificaciones inicializado");
}

// Cargar notificaciones desde la base de datos
async function cargarNotificaciones() {
    try {
        notificaciones = await getAll("notificaciones") || [];
        
        // Si no hay notificaciones, crear algunas de ejemplo
        if (notificaciones.length === 0) {
            await crearNotificacionesEjemplo();
            notificaciones = await getAll("notificaciones");
        }
        
        // Ordenar por fecha (más recientes primero)
        notificaciones.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        
        // Actualizar badges
        actualizarBadgesNotificaciones();
        
        // Renderizar notificaciones
        renderizarNotificaciones();
        
    } catch (error) {
        console.error("Error cargando notificaciones:", error);
    }
}

// Crear notificaciones de ejemplo
async function crearNotificacionesEjemplo() {
    const notificacionesEjemplo = [
        {
            id: Date.now(),
            titulo: "Nuevo cliente registrado",
            descripcion: "Empresa XYZ se ha registrado en el sistema. Revisa su perfil y agenda una cita de bienvenida.",
            tipo: "cliente",
            leida: false,
            urgente: false,
            fecha: new Date().toISOString(),
            accion: "clientes.html",
            icono: "fas fa-user-plus"
        },
        {
            id: Date.now() + 1,
            titulo: "Cotización pendiente de aprobación",
            descripcion: "Tienes 3 cotizaciones que requieren tu revisión y aprobación antes de mañana.",
            tipo: "cotizacion",
            leida: false,
            urgente: true,
            fecha: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 horas atrás
            accion: "cotizaciones.html",
            icono: "fas fa-file-invoice-dollar"
        },
        {
            id: Date.now() + 2,
            titulo: "Evento programado para mañana",
            descripcion: "Reunión con Juan Pérez está programada para mañana a las 10:00 AM. ¿Necesitas preparar algún material?",
            tipo: "calendario",
            leida: true,
            urgente: false,
            fecha: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 horas atrás
            accion: "calendario.html",
            icono: "fas fa-calendar-check"
        },
        {
            id: Date.now() + 3,
            titulo: "Actualización del sistema disponible",
            descripcion: "Una nueva versión de Nexus Pro está disponible. Incluye mejoras en el rendimiento y nuevas características.",
            tipo: "sistema",
            leida: true,
            urgente: false,
            fecha: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 día atrás
            accion: "settings.html",
            icono: "fas fa-sync-alt"
        },
        {
            id: Date.now() + 4,
            titulo: "Recordatorio: Backup semanal",
            descripcion: "Es momento de realizar el backup semanal de la base de datos para mantener la información segura.",
            tipo: "sistema",
            leida: false,
            urgente: false,
            fecha: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 días atrás
            accion: "settings.html",
            icono: "fas fa-database"
        }
    ];
    
    for (const notif of notificacionesEjemplo) {
        await addItem("notificaciones", notif);
    }
}

// Configurar eventos del sistema de notificaciones
function configurarEventosNotificaciones() {
    // Búsqueda en tiempo real
    document.getElementById("searchInput").addEventListener("input", buscarNotificaciones);
    
    // Cerrar modales al hacer clic fuera
    window.addEventListener("click", function(event) {
        const modal = document.getElementById("modalConfiguracion");
        if (event.target === modal) {
            cerrarModalConfiguracion();
        }
    });
    
    // Tecla ESC para cerrar modales
    window.addEventListener("keydown", function(event) {
        if (event.key === "Escape") {
            cerrarModalConfiguracion();
        }
    });
}

// Renderizar lista de notificaciones
function renderizarNotificaciones() {
    const lista = document.getElementById("listaNotificaciones");
    const estadoVacio = document.getElementById("estadoVacio");
    
    if (!lista) return;
    
    // Filtrar notificaciones
    const notificacionesFiltradas = filtrarNotificaciones();
    
    if (notificacionesFiltradas.length === 0) {
        lista.style.display = "none";
        estadoVacio.style.display = "block";
        return;
    }
    
    lista.style.display = "block";
    estadoVacio.style.display = "none";
    
    let html = "";
    
    notificacionesFiltradas.forEach(notificacion => {
        const fecha = new Date(notificacion.fecha);
        const fechaFormateada = formatearFecha(fecha);
        const horaFormateada = formatearHora(fecha);
        
        const claseNotificacion = `
            notificacion-item 
            ${notificacion.leida ? '' : 'no-leida'}
            ${notificacion.urgente ? 'urgente' : ''}
        `.trim();
        
        const claseIcono = `notificacion-icono ${notificacion.tipo}`;
        
        html += `
            <div class="${claseNotificacion}" data-id="${notificacion.id}">
                <div class="notificacion-header">
                    <div class="notificacion-info">
                        <div class="${claseIcono}">
                            <i class="${notificacion.icono}"></i>
                        </div>
                        <div class="notificacion-contenido">
                            <h3 class="notificacion-titulo">${escapeHtml(notificacion.titulo)}</h3>
                            <p class="notificacion-descripcion">${escapeHtml(notificacion.descripcion)}</p>
                            <div class="notificacion-meta">
                                <span class="notificacion-fecha">${fechaFormateada} a las ${horaFormateada}</span>
                                <span class="notificacion-tipo">${notificacion.tipo}</span>
                            </div>
                        </div>
                    </div>
                    <div class="notificacion-acciones">
                        ${!notificacion.leida ? `
                            <button class="btn-notificacion leer" onclick="marcarComoLeida(${notificacion.id})" title="Marcar como leída">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        <button class="btn-notificacion eliminar" onclick="eliminarNotificacion(${notificacion.id})" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    lista.innerHTML = html;
    
    // Agregar evento de clic a las notificaciones
    document.querySelectorAll('.notificacion-item').forEach(item => {
        item.addEventListener('click', function(e) {
            if (!e.target.closest('.notificacion-acciones')) {
                const id = this.getAttribute('data-id');
                abrirNotificacion(id);
            }
        });
    });
}

// Filtrar notificaciones según criterios
function filtrarNotificaciones() {
    const tipo = document.getElementById("filtroTipo").value;
    const estado = document.getElementById("filtroEstado").value;
    const fecha = document.getElementById("filtroFecha").value;
    
    filtrosActivos = { tipo, estado, fecha };
    
    return notificaciones.filter(notificacion => {
        // Filtro por tipo
        if (tipo !== 'todas' && notificacion.tipo !== tipo) {
            return false;
        }
        
        // Filtro por estado
        if (estado === 'no-leidas' && notificacion.leida) {
            return false;
        }
        if (estado === 'leidas' && !notificacion.leida) {
            return false;
        }
        
        // Filtro por fecha
        if (fecha !== 'todas') {
            const fechaNotificacion = new Date(notificacion.fecha);
            const hoy = new Date();
            
            switch (fecha) {
                case 'hoy':
                    if (!esMismoDia(fechaNotificacion, hoy)) return false;
                    break;
                case 'semana':
                    if (!esMismaSemana(fechaNotificacion, hoy)) return false;
                    break;
                case 'mes':
                    if (!esMismoMes(fechaNotificacion, hoy)) return false;
                    break;
            }
        }
        
        return true;
    });
}

// Funciones de utilidad para fechas
function esMismoDia(fecha1, fecha2) {
    return fecha1.getDate() === fecha2.getDate() &&
           fecha1.getMonth() === fecha2.getMonth() &&
           fecha1.getFullYear() === fecha2.getFullYear();
}

function esMismaSemana(fecha1, fecha2) {
    const inicioSemana1 = new Date(fecha1);
    inicioSemana1.setDate(fecha1.getDate() - fecha1.getDay());
    
    const inicioSemana2 = new Date(fecha2);
    inicioSemana2.setDate(fecha2.getDate() - fecha2.getDay());
    
    return esMismoDia(inicioSemana1, inicioSemana2);
}

function esMismoMes(fecha1, fecha2) {
    return fecha1.getMonth() === fecha2.getMonth() &&
           fecha1.getFullYear() === fecha2.getFullYear();
}

function formatearFecha(fecha) {
    const opciones = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return fecha.toLocaleDateString('es-ES', opciones);
}

function formatearHora(fecha) {
    const opciones = { 
        hour: '2-digit', 
        minute: '2-digit' 
    };
    return fecha.toLocaleTimeString('es-ES', opciones);
}

// Buscar notificaciones
function buscarNotificaciones(e) {
    const termino = e.target.value.toLowerCase();
    
    if (termino) {
        const notificacionesFiltradas = notificaciones.filter(notificacion => 
            notificacion.titulo.toLowerCase().includes(termino) ||
            notificacion.descripcion.toLowerCase().includes(termino)
        );
        
        // Renderizar resultados filtrados
        const lista = document.getElementById("listaNotificaciones");
        const estadoVacio = document.getElementById("estadoVacio");
        
        if (notificacionesFiltradas.length === 0) {
            lista.style.display = "none";
            estadoVacio.style.display = "block";
            estadoVacio.innerHTML = `
                <div class="estado-icono">
                    <i class="fas fa-search"></i>
                </div>
                <h3>No se encontraron notificaciones</h3>
                <p>No hay notificaciones que coincidan con "${termino}"</p>
            `;
        } else {
            // Guardar notificaciones originales temporalmente
            const notificacionesOriginales = [...notificaciones];
            notificaciones = notificacionesFiltradas;
            renderizarNotificaciones();
            notificaciones = notificacionesOriginales;
        }
    } else {
        renderizarNotificaciones();
    }
}

// Marcar notificación como leída
async function marcarComoLeida(id) {
    const notificacion = notificaciones.find(n => n.id == id);
    if (notificacion && !notificacion.leida) {
        notificacion.leida = true;
        await updateItem("notificaciones", id, { leida: true });
        renderizarNotificaciones();
        actualizarBadgesNotificaciones();
        mostrarNotificacion("Notificación marcada como leída", "success");
    }
}

// Marcar todas como leídas
async function marcarTodasComoLeidas() {
    const noLeidas = notificaciones.filter(n => !n.leida);
    
    for (const notificacion of noLeidas) {
        notificacion.leida = true;
        await updateItem("notificaciones", notificacion.id, { leida: true });
    }
    
    renderizarNotificaciones();
    actualizarBadgesNotificaciones();
    mostrarNotificacion("Todas las notificaciones marcadas como leídas", "success");
}

// Eliminar notificación
async function eliminarNotificacion(id) {
    if (!confirm("¿Estás seguro de que quieres eliminar esta notificación?")) {
        return;
    }
    
    await deleteItem("notificaciones", id);
    notificaciones = notificaciones.filter(n => n.id != id);
    renderizarNotificaciones();
    actualizarBadgesNotificaciones();
    mostrarNotificacion("Notificación eliminada", "success");
}

// Eliminar todas las notificaciones
async function eliminarTodasNotificaciones() {
    if (!confirm("¿Estás seguro de que quieres eliminar todas las notificaciones? Esta acción no se puede deshacer.")) {
        return;
    }
    
    for (const notificacion of notificaciones) {
        await deleteItem("notificaciones", notificacion.id);
    }
    
    notificaciones = [];
    renderizarNotificaciones();
    actualizarBadgesNotificaciones();
    mostrarNotificacion("Todas las notificaciones han sido eliminadas", "success");
}

// Abrir notificación (navegar a la acción)
function abrirNotificacion(id) {
    const notificacion = notificaciones.find(n => n.id == id);
    if (notificacion) {
        // Marcar como leída si no lo está
        if (!notificacion.leida) {
            marcarComoLeida(id);
        }
        
        // Navegar a la acción si existe
        if (notificacion.accion) {
            window.location.href = notificacion.accion;
        }
    }
}

// Actualizar badges de notificaciones
function actualizarBadgesNotificaciones() {
    const noLeidas = notificaciones.filter(n => !n.leida).length;
    
    // Badge en la página de notificaciones
    const badgeNotificaciones = document.getElementById("navBadgeNotificaciones");
    if (badgeNotificaciones) {
        badgeNotificaciones.textContent = noLeidas > 0 ? noLeidas : "";
    }
    
    // Badge en el header
    const actionBadge = document.querySelector('.action-badge');
    if (actionBadge) {
        actionBadge.textContent = noLeidas > 0 ? noLeidas : "";
        actionBadge.style.display = noLeidas > 0 ? "flex" : "none";
    }
}

// Configuración de notificaciones
async function cargarConfiguracion() {
    const config = JSON.parse(localStorage.getItem("notificacionesConfig") || "{}");
    
    // Aplicar configuración a los switches
    document.getElementById("notificacionesEmail").checked = config.notificacionesEmail !== false;
    document.getElementById("notificacionesPush").checked = config.notificacionesPush !== false;
    document.getElementById("notificacionesSonido").checked = config.notificacionesSonido || false;
    document.getElementById("notifNuevosClientes").checked = config.notifNuevosClientes !== false;
    document.getElementById("notifCotizaciones").checked = config.notifCotizaciones !== false;
    document.getElementById("notifEventos").checked = config.notifEventos !== false;
    document.getElementById("notifSistema").checked = config.notifSistema !== false;
}

async function guardarConfiguracion() {
    const config = {
        notificacionesEmail: document.getElementById("notificacionesEmail").checked,
        notificacionesPush: document.getElementById("notificacionesPush").checked,
        notificacionesSonido: document.getElementById("notificacionesSonido").checked,
        notifNuevosClientes: document.getElementById("notifNuevosClientes").checked,
        notifCotizaciones: document.getElementById("notifCotizaciones").checked,
        notifEventos: document.getElementById("notifEventos").checked,
        notifSistema: document.getElementById("notifSistema").checked
    };
    
    localStorage.setItem("notificacionesConfig", JSON.stringify(config));
    cerrarModalConfiguracion();
    mostrarNotificacion("Configuración guardada correctamente", "success");
}

// Modal de configuración
function abrirModalConfiguracion() {
    const modal = document.getElementById("modalConfiguracion");
    modal.style.display = 'flex';
    
    setTimeout(() => {
        modal.querySelector('.modal-contenido').style.transform = 'translateY(0)';
        modal.querySelector('.modal-contenido').style.opacity = '1';
    }, 10);
}

function cerrarModalConfiguracion() {
    const modal = document.getElementById("modalConfiguracion");
    modal.querySelector('.modal-contenido').style.transform = 'translateY(20px)';
    modal.querySelector('.modal-contenido').style.opacity = '0';
    
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

// Función para crear notificaciones desde otras partes del sistema
async function crearNotificacion(titulo, descripcion, tipo = "sistema", urgente = false, accion = null) {
    const notificacion = {
        id: Date.now(),
        titulo,
        descripcion,
        tipo,
        leida: false,
        urgente,
        fecha: new Date().toISOString(),
        accion,
        icono: obtenerIconoPorTipo(tipo)
    };
    
    await addItem("notificaciones", notificacion);
    
    // Recargar notificaciones si estamos en la página de notificaciones
    if (window.location.pathname.includes("notificaciones.html")) {
        await cargarNotificaciones();
    } else {
        // Actualizar badge
        actualizarBadgesNotificaciones();
    }
    
    // Mostrar notificación push si está habilitada
    const config = JSON.parse(localStorage.getItem("notificacionesConfig") || "{}");
    if (config.notificacionesPush !== false) {
        mostrarNotificacionPush(titulo, descripcion);
    }
}

function obtenerIconoPorTipo(tipo) {
    const iconos = {
        sistema: "fas fa-cog",
        cliente: "fas fa-users",
        cotizacion: "fas fa-file-invoice-dollar",
        calendario: "fas fa-calendar-alt",
        urgente: "fas fa-exclamation-triangle"
    };
    
    return iconos[tipo] || "fas fa-bell";
}

function mostrarNotificacionPush(titulo, mensaje) {
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification(titulo, {
            body: mensaje,
            icon: "img/logo.png"
        });
    }
}

// Solicitar permisos para notificaciones push
function solicitarPermisosNotificaciones() {
    if ("Notification" in window) {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                mostrarNotificacion("Permisos de notificación concedidos", "success");
            }
        });
    }
}

// Utilidades
function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function mostrarNotificacion(mensaje, tipo = 'success') {
    const notificacion = document.createElement('div');
    const bgColor = tipo === 'success' ? '#22CA95' : '#dc3545';
    
    notificacion.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${bgColor};
        color: ${tipo === 'success' ? '#000000' : 'white'};
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        z-index: 1001;
        font-weight: 600;
        transition: all 0.4s ease;
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 400px;
        transform: translateX(100px);
        opacity: 0;
    `;
    
    notificacion.innerHTML = `
        <i class="fas fa-${tipo === 'success' ? 'check-circle' : 'exclamation-triangle'}"></i>
        <span>${mensaje}</span>
    `;
    
    document.body.appendChild(notificacion);
    
    setTimeout(() => {
        notificacion.style.transform = 'translateX(0)';
        notificacion.style.opacity = '1';
    }, 10);
    
    setTimeout(() => {
        notificacion.style.transform = 'translateX(100px)';
        notificacion.style.opacity = '0';
        setTimeout(() => {
            if (document.body.contains(notificacion)) {
                document.body.removeChild(notificacion);
            }
        }, 400);
    }, 4000);
}

// Funciones de navegación
function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('collapsed');
}

function logout() {
    if (confirm("¿Estás seguro de que deseas cerrar sesión?")) {
        localStorage.removeItem("sessionUser");
        window.location.href = "index.html";
    }
}

function irAlInicio() {
    window.location.href = "dashboard.html";
}

function toggleNotifications() {
    window.location.href = "notificaciones.html";
}

function toggleMessages() {
    window.location.href = "mensajes.html";
}

function openNewEventModal() {
    mostrarNotificacion("Función de nuevo evento en desarrollo", "success");
}

// Inicializar cuando se carga la página
document.addEventListener("DOMContentLoaded", function() {
    if (window.location.pathname.includes("notificaciones.html")) {
        inicializarNotificaciones();
    }
});