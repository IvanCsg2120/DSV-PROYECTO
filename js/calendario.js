// js/calendario.js
// Gestión completa del calendario profesional

let fechaActual = new Date();
let vistaActual = 'mes';
let eventoEditando = null;

// Inicialización del calendario
async function inicializarCalendario() {
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

    // Cargar clientes para el selector
    await cargarClientes();

    // Generar calendario inicial
    generarCalendarioMes();
    
    // Configurar eventos
    configurarEventos();
    
    console.log("✅ Calendario inicializado correctamente");
}

// Cargar clientes para el selector de eventos
async function cargarClientes() {
    try {
        const clientes = await getAll("clientes");
        const selectCliente = document.getElementById("eventoCliente");
        
        selectCliente.innerHTML = '<option value="">Seleccionar cliente</option>';
        
        clientes.forEach(cliente => {
            const option = document.createElement("option");
            option.value = cliente.id;
            option.textContent = cliente.nombre;
            selectCliente.appendChild(option);
        });
    } catch (error) {
        console.error("Error cargando clientes:", error);
    }
}

// Configurar eventos del calendario
function configurarEventos() {
    // Formulario de evento
    document.getElementById("formEvento").addEventListener("submit", guardarEvento);
    
    // Búsqueda
    document.getElementById("searchInput").addEventListener("input", buscarEventos);
    
    // Fecha inicio/fin automática
    document.getElementById("eventoFechaInicio").addEventListener("change", function() {
        const fechaFin = document.getElementById("eventoFechaFin");
        if (!fechaFin.value || fechaFin.value < this.value) {
            fechaFin.value = this.value;
        }
    });
}

// Generar vista mensual
function generarCalendarioMes() {
    const año = fechaActual.getFullYear();
    const mes = fechaActual.getMonth();
    
    // Actualizar título
    const opciones = { year: 'numeric', month: 'long' };
    document.getElementById("fechaActual").textContent = 
        fechaActual.toLocaleDateString('es-ES', opciones);
    
    // Primer día del mes y último día del mes
    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);
    
    // Días del mes anterior para completar la primera semana
    const primerDiaSemana = primerDia.getDay(); // 0 = Domingo, 1 = Lunes, etc.
    
    const diasMes = document.getElementById("diasMes");
    diasMes.innerHTML = '';
    
    // Días del mes anterior
    const ultimoDiaMesAnterior = new Date(año, mes, 0).getDate();
    for (let i = primerDiaSemana - 1; i >= 0; i--) {
        const dia = ultimoDiaMesAnterior - i;
        crearDiaMes(dia, mes - 1, año, true);
    }
    
    // Días del mes actual
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
        const esHoy = esHoyDia(dia, mes, año);
        crearDiaMes(dia, mes, año, false, esHoy);
    }
    
    // Días del próximo mes para completar la última semana
    const ultimoDiaSemana = ultimoDia.getDay();
    for (let dia = 1; dia < 7 - ultimoDiaSemana; dia++) {
        crearDiaMes(dia, mes + 1, año, true);
    }
    
    // Cargar eventos para el mes
    cargarEventosMes(año, mes);
}

// Crear elemento de día para el mes
function crearDiaMes(dia, mes, año, esOtroMes, esHoy = false) {
    const diasMes = document.getElementById("diasMes");
    const divDia = document.createElement("div");
    
    divDia.className = "dia-mes";
    if (esOtroMes) divDia.classList.add("otro-mes");
    if (esHoy) divDia.classList.add("hoy");
    
    const numeroDia = document.createElement("div");
    numeroDia.className = "numero-dia";
    numeroDia.textContent = dia;
    
    const eventosDia = document.createElement("div");
    eventosDia.className = "eventos-dia";
    eventosDia.id = `eventos-${año}-${mes}-${dia}`;
    
    divDia.appendChild(numeroDia);
    divDia.appendChild(eventosDia);
    
    // Hacer clic en el día para crear evento
    if (!esOtroMes) {
        divDia.addEventListener("click", function() {
            abrirModalEventoConFecha(año, mes, dia);
        });
    }
    
    diasMes.appendChild(divDia);
}

// Verificar si es hoy
function esHoyDia(dia, mes, año) {
    const hoy = new Date();
    return dia === hoy.getDate() && 
           mes === hoy.getMonth() && 
           año === hoy.getFullYear();
}

// Cargar eventos para el mes
async function cargarEventosMes(año, mes) {
    try {
        const eventos = await getAll("eventos") || [];
        
        eventos.forEach(evento => {
            const fechaEvento = new Date(evento.fechaInicio);
            if (fechaEvento.getFullYear() === año && fechaEvento.getMonth() === mes) {
                mostrarEventoEnCalendario(evento);
            }
        });
    } catch (error) {
        console.error("Error cargando eventos:", error);
    }
}

// Mostrar evento en el calendario
function mostrarEventoEnCalendario(evento) {
    const fecha = new Date(evento.fechaInicio);
    const dia = fecha.getDate();
    const mes = fecha.getMonth();
    const año = fecha.getFullYear();
    
    const contenedorEventos = document.getElementById(`eventos-${año}-${mes}-${dia}`);
    if (!contenedorEventos) return;
    
    const elementoEvento = document.createElement("div");
    elementoEvento.className = `evento ${evento.tipo}`;
    elementoEvento.textContent = evento.titulo;
    elementoEvento.title = `${evento.titulo}\n${formatearHora(evento.fechaInicio)} - ${formatearHora(evento.fechaFin)}`;
    
    elementoEvento.addEventListener("click", function(e) {
        e.stopPropagation();
        mostrarDetalleEvento(evento);
    });
    
    contenedorEventos.appendChild(elementoEvento);
}

// Formatear hora
function formatearHora(fechaString) {
    const fecha = new Date(fechaString);
    return fecha.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

// Cambiar mes
function cambiarMes(direccion) {
    fechaActual.setMonth(fechaActual.getMonth() + direccion);
    
    if (vistaActual === 'mes') {
        generarCalendarioMes();
    } else if (vistaActual === 'semana') {
        generarCalendarioSemana();
    } else if (vistaActual === 'dia') {
        generarCalendarioDia();
    }
}

// Ir a hoy
function hoy() {
    fechaActual = new Date();
    
    if (vistaActual === 'mes') {
        generarCalendarioMes();
    } else if (vistaActual === 'semana') {
        generarCalendarioSemana();
    } else if (vistaActual === 'dia') {
        generarCalendarioDia();
    }
}

// Cambiar vista
function cambiarVista(vista) {
    vistaActual = vista;
    
    // Actualizar botones activos
    document.querySelectorAll('.vista-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Ocultar todas las vistas
    document.getElementById('vistaMes').style.display = 'none';
    document.getElementById('vistaSemana').style.display = 'none';
    document.getElementById('vistaDia').style.display = 'none';
    
    // Mostrar vista seleccionada
    if (vista === 'mes') {
        document.getElementById('vistaMes').style.display = 'block';
        generarCalendarioMes();
    } else if (vista === 'semana') {
        document.getElementById('vistaSemana').style.display = 'block';
        generarCalendarioSemana();
    } else if (vista === 'dia') {
        document.getElementById('vistaDia').style.display = 'block';
        generarCalendarioDia();
    }
}

// Generar vista semanal (placeholder)
function generarCalendarioSemana() {
    // Implementación básica - se puede expandir
    document.getElementById("fechaActual").textContent = "Vista Semana - " + 
        fechaActual.toLocaleDateString('es-ES', { week: 'long', year: 'numeric', month: 'long' });
    
    // Aquí iría la lógica completa para generar la vista semanal
    console.log("Generando vista semanal...");
}

// Generar vista diaria (placeholder)
function generarCalendarioDia() {
    // Implementación básica - se puede expandir
    document.getElementById("fechaActual").textContent = "Vista Día - " + 
        fechaActual.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    // Aquí iría la lógica completa para generar la vista diaria
    console.log("Generando vista diaria...");
}

// Abrir modal para nuevo evento
function abrirModalEvento() {
    eventoEditando = null;
    document.getElementById("modalTitulo").textContent = "Nuevo Evento";
    document.getElementById("formEvento").reset();
    
    // Establecer fecha actual por defecto
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById("eventoFechaInicio").value = hoy;
    document.getElementById("eventoFechaFin").value = hoy;
    
    mostrarModal('modalEvento');
}

// Abrir modal con fecha específica
function abrirModalEventoConFecha(año, mes, dia) {
    abrirModalEvento();
    
    const fecha = new Date(año, mes, dia);
    const fechaStr = fecha.toISOString().split('T')[0];
    
    document.getElementById("eventoFechaInicio").value = fechaStr;
    document.getElementById("eventoFechaFin").value = fechaStr;
}

// Mostrar modal
function mostrarModal(idModal) {
    const modal = document.getElementById(idModal);
    modal.style.display = 'flex';
    
    setTimeout(() => {
        modal.querySelector('.modal-contenido').style.transform = 'translateY(0)';
        modal.querySelector('.modal-contenido').style.opacity = '1';
    }, 10);
}

// Cerrar modal evento
function cerrarModalEvento() {
    const modal = document.getElementById('modalEvento');
    modal.querySelector('.modal-contenido').style.transform = 'translateY(20px)';
    modal.querySelector('.modal-contenido').style.opacity = '0';
    
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

// Cerrar modal detalle
function cerrarModalDetalle() {
    const modal = document.getElementById('modalDetalleEvento');
    modal.querySelector('.modal-contenido').style.transform = 'translateY(20px)';
    modal.querySelector('.modal-contenido').style.opacity = '0';
    
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

// Guardar evento
async function guardarEvento(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const titulo = document.getElementById("eventoTitulo").value;
    const fechaInicio = document.getElementById("eventoFechaInicio").value;
    const horaInicio = document.getElementById("eventoHoraInicio").value;
    const fechaFin = document.getElementById("eventoFechaFin").value;
    const horaFin = document.getElementById("eventoHoraFin").value;
    const tipo = document.getElementById("eventoTipo").value;
    const descripcion = document.getElementById("eventoDescripcion").value;
    const clienteId = document.getElementById("eventoCliente").value;
    
    if (!titulo) {
        mostrarNotificacion("El título del evento es obligatorio", "error");
        return;
    }
    
    try {
        const evento = {
            titulo,
            fechaInicio: `${fechaInicio}T${horaInicio || '00:00'}`,
            fechaFin: `${fechaFin}T${horaFin || '23:59'}`,
            tipo,
            descripcion,
            clienteId: clienteId || null,
            creado: new Date().toISOString(),
            actualizado: new Date().toISOString()
        };
        
        if (eventoEditando) {
            evento.id = eventoEditando.id;
            await updateItem("eventos", eventoEditando.id, evento);
            mostrarNotificacion("Evento actualizado correctamente");
        } else {
            await addItem("eventos", evento);
            mostrarNotificacion("Evento creado correctamente");
        }
        
        cerrarModalEvento();
        
        // Recargar calendario
        if (vistaActual === 'mes') {
            generarCalendarioMes();
        }
        
    } catch (error) {
        console.error("Error guardando evento:", error);
        mostrarNotificacion("Error al guardar el evento", "error");
    }
}

// Mostrar detalle del evento
function mostrarDetalleEvento(evento) {
    document.getElementById("detalleTitulo").textContent = evento.titulo;
    document.getElementById("detalleFechaHora").textContent = 
        `${new Date(evento.fechaInicio).toLocaleString('es-ES')} - ${new Date(evento.fechaFin).toLocaleString('es-ES')}`;
    
    document.getElementById("detalleTipo").textContent = 
        evento.tipo.charAt(0).toUpperCase() + evento.tipo.slice(1);
    
    document.getElementById("detalleCliente").textContent = 
        evento.clienteId ? `Cliente #${evento.clienteId}` : "No asignado";
    
    document.getElementById("detalleDescripcion").textContent = 
        evento.descripcion || "Sin descripción";
    
    eventoEditando = evento;
    mostrarModal('modalDetalleEvento');
}

// Editar evento
function editarEvento() {
    if (!eventoEditando) return;
    
    cerrarModalDetalle();
    
    // Llenar formulario con datos del evento
    document.getElementById("modalTitulo").textContent = "Editar Evento";
    document.getElementById("eventoId").value = eventoEditando.id;
    document.getElementById("eventoTitulo").value = eventoEditando.titulo;
    
    const fechaInicio = new Date(eventoEditando.fechaInicio);
    document.getElementById("eventoFechaInicio").value = fechaInicio.toISOString().split('T')[0];
    document.getElementById("eventoHoraInicio").value = 
        fechaInicio.toTimeString().split(' ')[0].substring(0, 5);
    
    const fechaFin = new Date(eventoEditando.fechaFin);
    document.getElementById("eventoFechaFin").value = fechaFin.toISOString().split('T')[0];
    document.getElementById("eventoHoraFin").value = 
        fechaFin.toTimeString().split(' ')[0].substring(0, 5);
    
    document.getElementById("eventoTipo").value = eventoEditando.tipo;
    document.getElementById("eventoDescripcion").value = eventoEditando.descripcion || "";
    document.getElementById("eventoCliente").value = eventoEditando.clienteId || "";
    
    mostrarModal('modalEvento');
}

// Eliminar evento
async function eliminarEvento() {
    if (!eventoEditando || !confirm("¿Estás seguro de que quieres eliminar este evento?")) {
        return;
    }
    
    try {
        await deleteItem("eventos", eventoEditando.id);
        mostrarNotificacion("Evento eliminado correctamente");
        cerrarModalDetalle();
        
        // Recargar calendario
        if (vistaActual === 'mes') {
            generarCalendarioMes();
        }
        
    } catch (error) {
        console.error("Error eliminando evento:", error);
        mostrarNotificacion("Error al eliminar el evento", "error");
    }
}

// Buscar eventos
function buscarEventos(e) {
    const termino = e.target.value.toLowerCase();
    
    // Aquí iría la lógica de búsqueda en tiempo real
    console.log("Buscando eventos:", termino);
}

// Mostrar notificación
function mostrarNotificacion(mensaje, tipo = 'success') {
    const notificacion = document.createElement('div');
    const bgColor = tipo === 'success' ? 'var(--mountain-meadow)' : 'var(--rojo)';
    
    notificacion.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${bgColor};
        color: ${tipo === 'success' ? 'var(--rich-black)' : 'white'};
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: var(--shadow-lg);
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
    
    // Animación de entrada
    setTimeout(() => {
        notificacion.style.transform = 'translateX(0)';
        notificacion.style.opacity = '1';
    }, 10);
    
    // Remover después de 4 segundos
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

// Funciones de navegación y sidebar
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
    mostrarNotificacion("🔔 No hay nuevas notificaciones pendientes.", 'success');
}

function toggleMessages() {
    mostrarNotificacion("💬 Sistema de mensajes en desarrollo", 'success');
}

function openNewEventModal() {
    abrirModalEvento();
}

// Inicializar cuando se carga la página
document.addEventListener("DOMContentLoaded", function() {
    if (window.location.pathname.includes("calendario.html")) {
        inicializarCalendario();
    }
});
