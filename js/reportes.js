// js/reportes.js - Versión InfinityFree
async function cargarClientesReporte() {
    await openDB();
    const clientes = await getAll("clientes");
    const select = document.getElementById("repCliente");
    
    if (select) {
        select.innerHTML = '<option value="">-- Todos los clientes --</option>';
        clientes.forEach(cliente => {
            select.innerHTML += `<option value="${cliente.id}">${escapeHtml(cliente.nombre)}</option>`;
        });
    }
}

async function generarReporte() {
    const clienteId = document.getElementById("repCliente").value;
    const desde = document.getElementById("repDesde").value;
    const hasta = document.getElementById("repHasta").value;
    
    let datos = await getAll("cotizaciones");
    const clientes = await getAll("clientes");
    
    // Aplicar filtros
    if (clienteId) {
        datos = datos.filter(d => d.clienteId == clienteId);
    }
    if (desde) {
        datos = datos.filter(d => d.fecha >= desde);
    }
    if (hasta) {
        datos = datos.filter(d => d.fecha <= hasta);
    }
    
    const contenedor = document.getElementById("reporteArea");
    if (!contenedor) return;
    
    if (datos.length === 0) {
        contenedor.innerHTML = "<p class='small'>No hay resultados para los filtros seleccionados.</p>";
        return;
    }
    
    // Calcular totales
    let subtotalTotal = 0;
    let impuestoTotal = 0;
    let totalGeneral = 0;
    
    let html = `
        <table class="table">
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Subtotal</th>
                    <th>Impuesto</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    datos.forEach(cotizacion => {
        const cliente = clientes.find(c => c.id == cotizacion.clienteId) || { nombre: "N/E" };
        
        subtotalTotal += cotizacion.subtotal;
        impuestoTotal += cotizacion.impuesto;
        totalGeneral += cotizacion.total;
        
        html += `
            <tr>
                <td>${cotizacion.fecha}</td>
                <td>${cotizacion.id}</td>
                <td>${escapeHtml(cliente.nombre)}</td>
                <td>$${cotizacion.subtotal.toFixed(2)}</td>
                <td>$${cotizacion.impuesto.toFixed(2)}</td>
                <td>$${cotizacion.total.toFixed(2)}</td>
            </tr>
        `;
    });
    
    html += `</tbody></table>`;
    
    // Agregar resumen
    html += `
        <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 5px;">
            <h4>Resumen del Reporte</h4>
            <p><strong>Total Subtotal:</strong> $${subtotalTotal.toFixed(2)}</p>
            <p><strong>Total Impuesto:</strong> $${impuestoTotal.toFixed(2)}</p>
            <p><strong>Total General:</strong> $${totalGeneral.toFixed(2)}</p>
            <p><strong>Cantidad de Cotizaciones:</strong> ${datos.length}</p>
        </div>
    `;
    
    contenedor.innerHTML = html;
}

async function exportarReporteCSV() {
    const clienteId = document.getElementById("repCliente").value;
    const desde = document.getElementById("repDesde").value;
    const hasta = document.getElementById("repHasta").value;
    
    let datos = await getAll("cotizaciones");
    const clientes = await getAll("clientes");
    
    // Aplicar mismos filtros
    if (clienteId) datos = datos.filter(d => d.clienteId == clienteId);
    if (desde) datos = datos.filter(d => d.fecha >= desde);
    if (hasta) datos = datos.filter(d => d.fecha <= hasta);
    
    if (datos.length === 0) {
        alert("No hay datos para exportar.");
        return;
    }
    
    let csv = "Fecha,ID,Cliente,Subtotal,Impuesto,Total\n";
    
    datos.forEach(cotizacion => {
        const cliente = clientes.find(c => c.id == cotizacion.clienteId) || { nombre: "" };
        csv += `"${cotizacion.fecha}","${cotizacion.id}","${cliente.nombre}","${cotizacion.subtotal}","${cotizacion.impuesto}","${cotizacion.total}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reporte_cotizaciones_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

// Inicialización
(async function initReportes() {
    const path = location.pathname.split("/").pop();
    if (path !== "reporte.html" && path !== "ReportesCotizacion.html") return;
    
    await cargarClientesReporte();
})();
