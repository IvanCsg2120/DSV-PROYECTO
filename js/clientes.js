// js/clientes.js

function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

async function cargarClientes() {
    await openDB();
    const lista = await getAll("clientes");
    const cont = document.getElementById("listaClientes");
    if (!cont) return;

    if (lista.length === 0) {
        cont.innerHTML = "<p>No hay clientes registrados.</p>";
        return;
    }

    cont.innerHTML = "";
    lista.forEach(cli => {
        const div = document.createElement("div");
        div.classList.add("cliente-item");

        div.innerHTML = `
            <h3>${escapeHtml(cli.nombre)}</h3>
            <p><strong>Email:</strong> ${escapeHtml(cli.email)}</p>
            <p><strong>Teléfono:</strong> ${escapeHtml(cli.telefono)}</p>
            <button class="btn" onclick="editarCliente(${cli.id})">Editar</button>
        `;
        cont.appendChild(div);
    });
}

async function guardarCliente() {
    const nombre = document.getElementById("cli_nombre").value.trim();
    const email = document.getElementById("cli_email").value.trim();
    const tel = document.getElementById("cli_tel").value.trim();

    if (!nombre) return alert("El nombre es obligatorio.");

    await addItem("clientes", {
        nombre,
        email,
        telefono: tel,
        fecha_registro: new Date().toISOString().split("T")[0]
    });

    alert("Cliente guardado.");
    cargarClientes();
}

(async () => {
    const path = location.pathname.split("/").pop();
    if (path === "clientes.html") cargarClientes();
})();


