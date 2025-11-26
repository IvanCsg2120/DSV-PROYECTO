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
    for (let dia = 1;
