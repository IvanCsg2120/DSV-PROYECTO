// js/main.js
// Lógica para dashboard: resumen y accesos rápidos

(async function () {
  // Si la página no es dashboard no hacemos nada
  const path = location.pathname.split("/").pop();
  if (path !== "dashboard.html") return;

  // asegurar DB y sesión
  await openDB();
  const session = localStorage.getItem("sessionUser");
  if (!session) { location.href = "index.html"; return; }
  const user = JSON.parse(session);
  const userEl = document.getElementById("usuarioNombre");
  if (userEl) userEl.textContent = user.nombre || user.email;

  // cargar resumen
  async function cargarResumen() {
    const clientes = await getAll("clientes");
    const servicios = await getAll("servicios");
    const cotizaciones = await getAll("cotizaciones");
    const cont = document.getElementById("resumen");
    if (!cont) return;
    cont.innerHTML = `
      <div class="card">
        <h3>Resumen rápido</h3>
        <p>Clientes registrados: <strong>${clientes.length}</strong></p>
        <p>Servicios disponibles: <strong>${servicios.length}</strong></p>
        <p>Cotizaciones registradas: <strong>${cotizaciones.length}</strong></p>
      </div>
    `;
  }

  cargarResumen();
})();

