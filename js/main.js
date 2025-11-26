// js/main.js - Versión InfinityFree
async function inicializarDashboard() {
    // Verificar sesión
    const sesion = localStorage.getItem("sessionUser");
    if (!sesion) {
        window.location.href = "index.html";
        return;
    }
    
    const usuario = JSON.parse(sesion);
    
    // Actualizar UI con datos del usuario
    const elementosNombre = document.querySelectorAll("#usuarioNombre, #sidebarUserName, #welcomeText");
    elementosNombre.forEach(el => {
        if (el.id === "welcomeText") {
            const hora = new Date().getHours();
            let saludo = "Buenos días";
            if (hora >= 12 && hora < 18) saludo = "Buenas tardes";
            else if (hora >= 18) saludo = "Buenas noches";
            
            el.textContent = `${saludo}, ${usuario.nombre} 👋`;
        } else {
            el.textContent = usuario.nombre;
        }
    });
    
    // Cargar y actualizar estadísticas
    await actualizarEstadisticas();
    
    // Actualizar fecha y hora
    actualizarFechaHora();
    setInterval(actualizarFechaHora, 60000);
}

async function actualizarEstadisticas() {
    try {
        await openDB();
        
        const clientes = await getAll("clientes");
        const servicios = await getAll("servicios");
        const cotizaciones = await getAll("cotizaciones");
        
        // Actualizar KPIs
        document.getElementById("kpiClientes").textContent = clientes.length;
        document.getElementById("kpiServicios").textContent = servicios.length;
        document.getElementById("kpiCot").textContent = cotizaciones.length;
        
        // Calcular ingresos (últimos 30 días)
        const hace30Dias = new Date();
        hace30Dias.setDate(hace30Dias.getDate() - 30);
        
        const ingresosRecientes = cotizaciones
            .filter(cot => new Date(cot.fecha) >= hace30Dias)
            .reduce((total, cot) => total + (cot.total || 0), 0);
        
        document.getElementById("kpiIngresos").textContent = `$${ingresosRecientes.toLocaleString('es-ES', {minimumFractionDigits: 2})}`;
        
        // Actualizar badges en sidebar
        document.getElementById("navBadgeClientes").textContent = clientes.length;
        document.getElementById("navBadgeServicios").textContent = servicios.length;
        document.getElementById("navBadgeCotizaciones").textContent = cotizaciones.length;
        
    } catch (error) {
        console.error("Error actualizando estadísticas:", error);
    }
}

function actualizarFechaHora() {
    const ahora = new Date();
    const opciones = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    const fechaFormateada = ahora.toLocaleDateString('es-ES', opciones);
    const elementoFecha = document.getElementById("currentDateTime");
    
    if (elementoFecha) {
        elementoFecha.textContent = fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1);
    }
}

// Funciones de UI
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('collapsed');
    }
}

function toggleNotifications() {
    alert("🔔 Sistema de notificaciones - Próximamente");
}

function toggleMessages() {
    alert("💬 Sistema de mensajes - Próximamente");
}

function exportReport() {
    alert("📊 Exportando reporte - Próximamente");
}

// Inicialización cuando la página carga
document.addEventListener("DOMContentLoaded", function() {
    if (window.location.pathname.includes("dashboard.html")) {
        inicializarDashboard();
    }
});
