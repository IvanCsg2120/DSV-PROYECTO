// js/mensajes.js
// Gestión completa del sistema de mensajes

let conversaciones = [];
let mensajes = [];
let conversacionActiva = null;
let clientes = [];

// Inicialización del sistema de mensajes
async function inicializarMensajes() {
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

    // Cargar datos
    await cargarClientes();
    await cargarConversaciones();
    
    // Configurar eventos
    configurarEventosMensajes();
    
    console.log("✅ Sistema de mensajes inicializado");
}

// Cargar clientes para mensajes
async function cargarClientes() {
    try {
        clientes = await getAll("clientes") || [];
        
        // Llenar selector de destinatarios
        const selectDestinatario = document.getElementById("destinatarioMensaje");
        if (selectDestinatario) {
            selectDestinatario.innerHTML = '<option value="">Seleccionar destinatario...</option>';
            
            clientes.forEach(cliente => {
                const option = document.createElement("option");
                option.value = cliente.id;
                option.textContent = cliente.nombre;
                option.dataset.tipo = "cliente";
                selectDestinatario.appendChild(option);
            });
            
            // Agregar opciones de equipo (ejemplo)
            const equipo = [
                { id: "equipo_tec", nombre: "Equipo Técnico", tipo: "equipo" },
                { id: "equipo_ventas", nombre: "Equipo de Ventas", tipo: "equipo" }
            ];
            
            equipo.forEach(miembro => {
                const option = document.createElement("option");
                option.value = miembro.id;
                option.textContent = miembro.nombre;
                option.dataset.tipo = "equipo";
                selectDestinatario.appendChild(option);
            });
        }
        
    } catch (error) {
        console.error("Error cargando clientes:", error);
    }
}

// Cargar conversaciones desde la base de datos
async function cargarConversaciones() {
    try {
        conversaciones = await getAll("conversaciones") || [];
        mensajes = await getAll("mensajes") || [];
        
        // Si no hay conversaciones, crear algunas de ejemplo
        if (conversaciones.length === 0) {
            await crearConversacionesEjemplo();
            conversaciones = await getAll("conversaciones");
            mensajes = await getAll("mensajes");
        }
        
        // Ordenar conversaciones por fecha del último mensaje
        conversaciones.sort((a, b) => {
            const mensajesA = mensajes.filter(m => m.conversacionId === a.id);
            const mensajesB = mensajes.filter(m => m.conversacionId === b.id);
            
            const ultimoA = mensajesA.length > 0 ? 
                new Date(mensajesA[mensajesA.length - 1].fecha) : new Date(a.fechaCreacion);
            const ultimoB = mensajesB.length > 0 ? 
                new Date(mensajesB[mensajesB.length - 1].fecha) : new Date(b.fechaCreacion);
            
            return ultimoB - ultimoA;
        });
        
        // Actualizar badges
        actualizarBadgesMensajes();
        
        // Renderizar conversaciones
        renderizarConversaciones();
        
    } catch (error) {
        console.error("Error cargando conversaciones:", error);
    }
}

// Crear conversaciones de ejemplo
async function crearConversacionesEjemplo() {
    const usuarioActual = JSON.parse(localStorage.getItem("sessionUser"));
    
    // Conversación con cliente
    const conversacionCliente = {
        id: "conv_" + Date.now(),
        tipo: "cliente",
        participanteId: clientes[0]?.id || "cliente_1",
        participanteNombre: clientes[0]?.nombre || "Empresa ABC SA",
        fechaCreacion: new Date().toISOString(),
        noLeidos: 2
    };
    
    await addItem("conversaciones", conversacionCliente);
    
    // Mensajes de ejemplo para la conversación con cliente
    const mensajesCliente = [
        {
            id: "msg_" + Date.now(),
            conversacionId: conversacionCliente.id,
            remitenteId: clientes[0]?.id || "cliente_1",
            remitenteNombre: clientes[0]?.nombre || "Empresa ABC SA",
            contenido: "Hola, tengo interés en el servicio de mantenimiento preventivo para nuestras computadoras. ¿Podrían enviarme más información?",
            fecha: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 horas atrás
            leido: false,
            tipo: "cliente"
        },
        {
            id: "msg_" + (Date.now() + 1),
            conversacionId: conversacionCliente.id,
            remitenteId: usuarioActual.id,
            remitenteNombre: usuarioActual.nombre,
            contenido: "¡Hola! Claro que sí. El servicio de mantenimiento preventivo incluye limpieza interna, optimización del sistema y revisión de componentes. ¿Cuántas computadoras necesitan mantenimiento?",
            fecha: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hora atrás
            leido: true,
            tipo: "propio"
        },
        {
            id: "msg_" + (Date.now() + 2),
            conversacionId: conversacionCliente.id,
            remitenteId: clientes[0]?.id || "cliente_1",
            remitenteNombre: clientes[0]?.nombre || "Empresa ABC SA",
            contenido: "Tenemos 15 equipos que requieren mantenimiento. ¿Podrían enviarme una cotización?",
            fecha: new Date().toISOString(),
            leido: false,
            tipo: "cliente"
        }
    ];
    
    for (const mensaje of mensajesCliente) {
        await addItem("mensajes", mensaje);
    }
    
    // Conversación con equipo
    const conversacionEquipo = {
        id: "conv_" + (Date.now() + 1000),
        tipo: "equipo",
        participanteId: "equipo_tec",
        participanteNombre: "Equipo Técnico",
        fechaCreacion: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 día atrás
        noLeidos: 0
    };
    
    await addItem("conversaciones", conversacionEquipo);
    
    // Mensajes de ejemplo para la conversación con equipo
    const mensajesEquipo = [
        {
            id: "msg_" + (Date.now() + 3),
            conversacionId: conversacionEquipo.id,
            remitenteId: "tecnico_1",
            remitenteNombre: "Carlos Rodríguez",
            contenido: "He completado la instalación de red en la oficina principal. Todos los puntos están funcionando correctamente.",
            fecha: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 horas atrás
            leido: true,
            tipo: "equipo"
        },
        {
            id: "msg_" + (Date.now() + 4),
            conversacionId: conversacionEquipo.id,
            remitenteId: usuarioActual.id,
            remitenteNombre: usuarioActual.nombre,
            contenido: "Excelente trabajo, Carlos. ¿Podrías documentar la configuración en el sistema?",
            fecha: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 horas atrás
            leido: true,
            tipo: "propio"
        }
    ];
    
    for (const mensaje of mensajesEquipo) {
        await addItem("mensajes", mensaje);
    }
}

// Configurar eventos del sistema de mensajes
function configurarEventosMensajes() {
    // Búsqueda en tiempo real
    document.getElementById("searchInput").addEventListener("input", buscarConversaciones);
    
    // Envío de mensajes con Enter (Ctrl+Enter para nueva línea)
    document.getElementById("editorMensaje").addEventListener("keydown", function(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            enviarMensaje();
        }
    });
    
    // Cerrar modales al hacer clic fuera
    window.addEventListener("click", function(event) {
        const modal = document.getElementById("modalNuevoMensaje");
        if (event.target === modal) {
            cerrarModalNuevoMensaje();
        }
    });
    
    // Tecla ESC para cerrar modales
    window.addEventListener("keydown", function(event) {
        if (event.key === "Escape") {
            cerrarModalNuevoMensaje();
        }
    });
    
    // Auto-expandir textarea
    document.getElementById("editorMensaje").addEventListener("input", function() {
        this.style.height = "auto";
        this.style.height = (this.scrollHeight) + "px";
    });
}

// Renderizar lista de conversaciones
function renderizarConversaciones() {
    const lista = document.getElementById("listaConversaciones");
    
    if (!lista) return;
    
    let html = "";
    
    conversaciones.forEach(conversacion => {
        const mensajesConversacion = mensajes.filter(m => m.conversacionId === conversacion.id);
        const ultimoMensaje = mensajesConversacion[mensajesConversacion.length - 1];
        const preview = ultimoMensaje ? 
            (ultimoMensaje.contenido.length > 50 ? 
             ultimoMensaje.contenido.substring(0, 50) + "..." : 
             ultimoMensaje.contenido) : 
            "Sin mensajes";
        
        const fecha = ultimoMensaje ? 
            formatearFechaRelativa(new Date(ultimoMensaje.fecha)) : 
            formatearFechaRelativa(new Date(conversacion.fechaCreacion));
        
        const claseConversacion = `
            conversacion-item 
            ${conversacion.tipo}
            ${conversacionActiva && conversacionActiva.id === conversacion.id ? 'activa' : ''}
            ${conversacion.noLeidos > 0 ? 'no-leida' : ''}
        `.trim();
        
        const iniciales = obtenerIniciales(conversacion.participanteNombre);
        
        html += `
            <div class="${claseConversacion}" data-id="${conversacion.id}">
                <div class="conversacion-header">
                    <div class="conversacion-info">
                        <div class="conversacion-avatar ${conversacion.tipo}">
                            ${iniciales}
                        </div>
                        <div class="conversacion-datos">
                            <div class="conversacion-nombre">${escapeHtml(conversacion.participanteNombre)}</div>
                            <div class="conversacion-preview">${escapeHtml(preview)}</div>
                        </div>
                    </div>
                    <div class="conversacion-meta">
                        <div class="conversacion-fecha">${fecha}</div>
                        ${conversacion.noLeidos > 0 ? 
                            `<div class="conversacion-badge">${conversacion.noLeidos}</div>` : 
                            ''}
                    </div>
                </div>
            </div>
        `;
    });
    
    lista.innerHTML = html || `
        <div class="estado-vacio">
            <div class="estado-icono">
                <i class="fas fa-comments"></i>
            </div>
            <h3>No hay conversaciones</h3>
            <p>Inicia una nueva conversación para comenzar</p>
        </div>
    `;
    
    // Agregar evento de clic a las conversaciones
    document.querySelectorAll('.conversacion-item').forEach(item => {
        item.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            abrirConversacion(id);
        });
    });
}

// Abrir conversación
async function abrirConversacion(id) {
    conversacionActiva = conversaciones.find(c => c.id === id);
    
    if (!conversacionActiva) return;
    
    // Marcar como activa en la UI
    document.querySelectorAll('.conversacion-item').forEach(item => {
        item.classList.remove('activa');
    });
    document.querySelector(`.conversacion-item[data-id="${id}"]`).classList.add('activa');
    
    // Mostrar panel de mensajes
    document.getElementById("mensajesVacio").style.display = "none";
    document.getElementById("mensajesContenido").style.display = "flex";
    
    // Actualizar header de conversación
    actualizarHeaderConversacion();
    
    // Cargar y mostrar mensajes
    await cargarMensajesConversacion();
    
    // Marcar mensajes como leídos
    await marcarMensajesComoLeidos();
    
    // Scroll al final
    setTimeout(() => {
        const areaMensajes = document.getElementById("areaMensajes");
        areaMensajes.scrollTop = areaMensajes.scrollHeight;
    }, 100);
}

// Actualizar header de la conversación
function actualizarHeaderConversacion() {
    const header = document.getElementById("headerConversacion");
    const iniciales = obtenerIniciales(conversacionActiva.participanteNombre);
    
    header.innerHTML = `
        <div class="conversacion-detalles">
            <div class="conversacion-header-avatar ${conversacionActiva.tipo}">
                ${iniciales}
            </div>
            <div class="conversacion-header-info">
                <h4>${escapeHtml(conversacionActiva.participanteNombre)}</h4>
                <p>${conversacionActiva.tipo === 'cliente' ? 'Cliente' : 'Equipo'}</p>
            </div>
        </div>
        <div class="conversacion-acciones">
            <button class="btn-conversacion" title="Llamar">
                <i class="fas fa-phone"></i>
            </button>
            <button class="btn-conversacion" title="Video llamada">
                <i class="fas fa-video"></i>
            </button>
            <button class="btn-conversacion" title="Más opciones">
                <i class="fas fa-ellipsis-v"></i>
            </button>
        </div>
    `;
}

// Cargar mensajes de la conversación activa
async function cargarMensajesConversacion() {
    const mensajesConversacion = mensajes
        .filter(m => m.conversacionId === conversacionActiva.id)
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    
    renderizarMensajes(mensajesConversacion);
}

// Renderizar mensajes
function renderizarMensajes(mensajesArray) {
    const area = document.getElementById("areaMensajes");
    
    if (!area) return;
    
    let html = "";
    let fechaAnterior = null;
    
    mensajesArray.forEach(mensaje => {
        const fecha = new Date(mensaje.fecha);
        const fechaActual = fecha.toDateString();
        
        // Agregar separador de fecha si cambió
        if (fechaActual !== fechaAnterior) {
            html += `
                <div class="mensaje-fecha-separador">
                    <span class="mensaje-fecha-texto">${formatearFecha(fecha)}</span>
                </div>
            `;
            fechaAnterior = fechaActual;
        }
        
        const claseMensaje = `mensaje-item ${mensaje.tipo}`;
        const iniciales = obtenerIniciales(mensaje.remitenteNombre);
        
        html += `
            <div class="${claseMensaje}">
                <div class="mensaje-avatar">
                    ${iniciales}
                </div>
                <div class="mensaje-contenido">
                    <div class="mensaje-burbuja">
                        <p class="mensaje-texto">${escapeHtml(mensaje.contenido)}</p>
                    </div>
                    <div class="mensaje-metadata">
                        <span>${formatearHora(fecha)}</span>
                        ${mensaje.tipo === 'propio' ? `
                            <div class="mensaje-estado">
                                <i class="fas fa-check${mensaje.leido ? '-double' : ''}"></i>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    });
    
    area.innerHTML = html;
}

// Enviar mensaje
async function enviarMensaje() {
    if (!conversacionActiva) {
        mostrarNotificacion("Selecciona una conversación primero", "error");
        return;
    }
    
    const editor = document.getElementById("editorMensaje");
    const contenido = editor.value.trim();
    
    if (!contenido) {
        mostrarNotificacion("Escribe un mensaje", "error");
        return;
    }
    
    const usuarioActual = JSON.parse(localStorage.getItem("sessionUser"));
    
    const mensaje = {
        id: "msg_" + Date.now(),
        conversacionId: conversacionActiva.id,
        remitenteId: usuarioActual.id,
        remitenteNombre: usuarioActual.nombre,
        contenido: contenido,
        fecha: new Date().toISOString(),
        leido: false,
        tipo: "propio"
    };
    
    try {
        await addItem("mensajes", mensaje);
        mensajes.push(mensaje);
        
        // Actualizar conversación
        conversacionActiva.noLeidos = 0;
        await updateItem("conversaciones", conversacionActiva.id, { 
            noLeidos: 0 
        });
        
        // Limpiar editor
        editor.value = "";
        editor.style.height = "auto";
        
        // Recargar mensajes
        await cargarMensajesConversacion();
        
        // Scroll al final
        setTimeout(() => {
            const areaMensajes = document.getElementById("areaMensajes");
            areaMensajes.scrollTop = areaMensajes.scrollHeight;
        }, 100);
        
        // Actualizar lista de conversaciones
        renderizarConversaciones();
        actualizarBadgesMensajes();
        
    } catch (error) {
        console.error("Error enviando mensaje:", error);
        mostrarNotificacion("Error al enviar el mensaje", "error");
    }
}

// Marcar mensajes como leídos
async function marcarMensajesComoLeidos() {
    if (!conversacionActiva) return;
    
    const mensajesNoLeidos = mensajes.filter(m => 
        m.conversacionId === conversacionActiva.id && 
        !m.leido && 
        m.tipo !== 'propio'
    );
    
    for (const mensaje of mensajesNoLeidos) {
        mensaje.leido = true;
        await updateItem("mensajes", mensaje.id, { leido: true });
    }
    
    // Actualizar contador en conversación
    conversacionActiva.noLeidos = 0;
    await updateItem("conversaciones", conversacionActiva.id, { noLeidos: 0 });
    
    // Actualizar UI
    renderizarConversaciones();
    actualizarBadgesMensajes();
}

// Filtrar conversaciones
function filtrarConversaciones() {
    const filtro = document.getElementById("filtroConversaciones").value;
    
    let conversacionesFiltradas = [...conversaciones];
    
    switch (filtro) {
        case 'no-leidas':
            conversacionesFiltradas = conversacionesFiltradas.filter(c => c.noLeidos > 0);
            break;
        case 'clientes':
            conversacionesFiltradas = conversacionesFiltradas.filter(c => c.tipo === 'cliente');
            break;
        case 'equipo':
            conversacionesFiltradas = conversacionesFiltradas.filter(c => c.tipo === 'equipo');
            break;
    }
    
    // Renderizar conversaciones filtradas
    const lista = document.getElementById("listaConversaciones");
    const conversacionesOriginales = [...conversaciones];
    conversaciones = conversacionesFiltradas;
    renderizarConversaciones();
    conversaciones = conversacionesOriginales;
}

// Buscar conversaciones
function buscarConversaciones(e) {
    const termino = e.target.value.toLowerCase();
    
    if (termino) {
        const conversacionesFiltradas = conversaciones.filter(conversacion => 
            conversacion.participanteNombre.toLowerCase().includes(termino)
        );
        
        // Renderizar resultados filtrados
        const lista = document.getElementById("listaConversaciones");
        const conversacionesOriginales = [...conversaciones];
        conversaciones = conversacionesFiltradas;
        renderizarConversaciones();
        conversaciones = conversacionesOriginales;
    } else {
        renderizarConversaciones();
    }
}

// Marcar todos como leídos
async function marcarTodosComoLeidos() {
    for (const conversacion of conversaciones) {
        if (conversacion.noLeidos > 0) {
            conversacion.noLeidos = 0;
            await updateItem("conversaciones", conversacion.id, { noLeidos: 0 });
            
            // Marcar mensajes no leídos
            const mensajesConversacion = mensajes.filter(m => 
                m.conversacionId === conversacion.id && 
                !m.leido && 
                m.tipo !== 'propio'
            );
            
            for (const mensaje of mensajesConversacion) {
                mensaje.leido = true;
                await updateItem("mensajes", mensaje.id, { leido: true });
            }
        }
    }
    
    renderizarConversaciones();
    actualizarBadgesMensajes();
    mostrarNotificacion("Todos los mensajes marcados como leídos", "success");
}

// Nuevo mensaje
async function abrirModalNuevoMensaje() {
    const modal = document.getElementById("modalNuevoMensaje");
    modal.style.display = 'flex';
    
    setTimeout(() => {
        modal.querySelector('.modal-contenido').style.transform = 'translateY(0)';
        modal.querySelector('.modal-contenido').style.opacity = '1';
    }, 10);
}

function cerrarModalNuevoMensaje() {
    const modal = document.getElementById("modalNuevoMensaje");
    modal.querySelector('.modal-contenido').style.transform = 'translateY(20px)';
    modal.querySelector('.modal-contenido').style.opacity = '0';
    
    setTimeout(() => {
        modal.style.display = 'none';
        document.getElementById("formNuevoMensaje").reset();
    }, 300);
}

// Enviar nuevo mensaje (iniciar conversación)
document.getElementById("formNuevoMensaje").addEventListener("submit", async function(e) {
    e.preventDefault();
    
    const destinatarioId = document.getElementById("destinatarioMensaje").value;
    const asunto = document.getElementById("asuntoMensaje").value.trim();
    const contenido = document.getElementById("contenidoMensaje").value.trim();
    
    if (!destinatarioId || !asunto || !contenido) {
        mostrarNotificacion("Completa todos los campos", "error");
        return;
    }
    
    const usuarioActual = JSON.parse(localStorage.getItem("sessionUser"));
    const destinatarioOption = document.getElementById("destinatarioMensaje").selectedOptions[0];
    const destinatarioNombre = destinatarioOption.textContent;
    const tipo = destinatarioOption.dataset.tipo;
    
    // Crear nueva conversación
    const nuevaConversacion = {
        id: "conv_" + Date.now(),
        tipo: tipo,
        participanteId: destinatarioId,
        participanteNombre: destinatarioNombre,
        asunto: asunto,
        fechaCreacion: new Date().toISOString(),
        noLeidos: 0
    };
    
    // Crear mensaje
    const mensaje = {
        id: "msg_" + Date.now(),
        conversacionId: nuevaConversacion.id,
        remitenteId: usuarioActual.id,
        remitenteNombre: usuarioActual.nombre,
        contenido: contenido,
        fecha: new Date().toISOString(),
        leido: false,
        tipo: "propio"
    };
    
    try {
        await addItem("conversaciones", nuevaConversacion);
        await addItem("mensajes", mensaje);
        
        conversaciones.push(nuevaConversacion);
        mensajes.push(mensaje);
        
        cerrarModalNuevoMensaje();
        renderizarConversaciones();
        mostrarNotificacion("Mensaje enviado correctamente", "success");
        
        // Abrir la nueva conversación
        setTimeout(() => {
            abrirConversacion(nuevaConversacion.id);
        }, 500);
        
    } catch (error) {
        console.error("Error enviando mensaje:", error);
        mostrarNotificacion("Error al enviar el mensaje", "error");
    }
});

// Actualizar badges de mensajes
function actualizarBadgesMensajes() {
    const totalNoLeidos = conversaciones.reduce((total, conv) => total + conv.noLeidos, 0);
    
    // Badge en la página de mensajes
    const badgeMensajes = document.getElementById("navBadgeMensajes");
    if (badgeMensajes) {
        badgeMensajes.textContent = totalNoLeidos > 0 ? totalNoLeidos : "";
    }
    
    // Badge en el header
    const actionBadges = document.querySelectorAll('.action-badge');
    actionBadges.forEach(badge => {
        if (badge.parentElement.querySelector('.fa-envelope')) {
            badge.textContent = totalNoLeidos > 0 ? totalNoLeidos : "";
            badge.style.display = totalNoLeidos > 0 ? "flex" : "none";
        }
    });
}

// Utilidades
function obtenerIniciales(nombre) {
    return nombre
        .split(' ')
        .map(part => part.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2);
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

function formatearFechaRelativa(fecha) {
    const ahora = new Date();
    const diffMs = ahora - fecha;
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDias === 0) {
        return formatearHora(fecha);
    } else if (diffDias === 1) {
        return "Ayer";
    } else if (diffDias < 7) {
        return `Hace ${diffDias} días`;
    } else {
        return formatearFecha(fecha);
    }
}

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

// Inicializar cuando se carga la página
document.addEventListener("DOMContentLoaded", function() {
    if (window.location.pathname.includes("mensajes.html")) {
        inicializarMensajes();
    }
});