// ===============================
// FUNCIONES AUXILIARES
// ===============================
function clean(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ===============================
// INICIAR SESIÓN - CORREGIDO
// ===============================
async function login(e) {
  if (e) e.preventDefault();

  const cedula = document.getElementById("cedula").value.trim();
  const nombreInput = document.getElementById("nombre").value.trim();

  console.log("Intentando login con:", { cedula, nombreInput }); // Debug

  if (!cedula || !nombreInput) {
    alert("Completa cédula y nombre.");
    return false;
  }

  await ensureDBReady();
  const users = await getAll("users");

  console.log("Usuarios en DB:", users); // Debug

  // CORRECCIÓN: Buscar solo por cédula
  const matchingUser = users.find(u => {
    console.log("Comparando:", u.cedula, "con", cedula); // Debug
    return u.cedula === cedula;
  });

  if (!matchingUser) {
    alert("Cédula no encontrada. Regístrate primero.");
    return false;
  }

  // Verificar nombre (opcional, pero mantengamos la validación)
  if (clean(matchingUser.nombre) !== clean(nombreInput)) {
    alert("El nombre no coincide con la cédula proporcionada.");
    return false;
  }

  const session = {
    id: matchingUser.id,
    nombre: matchingUser.nombre,
    cedula: matchingUser.cedula,
    email: matchingUser.email,
    inicio: new Date().toISOString()
  };

  localStorage.setItem("sessionUser", JSON.stringify(session));
  alert(`¡Bienvenido ${matchingUser.nombre}!`);
  location.href = "dashboard.html";
  return false;
}

// ===============================
// REGISTRO DE USUARIO - CORREGIDO
// ===============================
async function register(e) {
  if (e) e.preventDefault();

  const nombre = document.getElementById("regNombre").value.trim();
  const apellido = document.getElementById("regApellido").value.trim();
  const cedula = document.getElementById("regCedula").value.trim();
  const email = document.getElementById("regEmail").value.trim();

  console.log("Registrando:", { nombre, apellido, cedula, email }); // Debug

  if (!nombre || !apellido || !cedula || !email) {
    alert("Todos los campos son obligatorios.");
    return false;
  }

  await ensureDBReady();
  const users = await getAll("users");

  console.log("Usuarios existentes:", users); // Debug

  // Verificar si ya existe la cédula
  if (users.some(u => u.cedula === cedula)) {
    alert("Ya existe un usuario con esta cédula.");
    return false;
  }

  // Verificar si ya existe el email
  if (users.some(u => u.email && u.email.toLowerCase() === email.toLowerCase())) {
    alert("Ya existe un usuario con este email.");
    return false;
  }

  const newUser = {
    nombre: `${nombre} ${apellido}`,
    cedula: cedula,
    email: email,
    fechaRegistro: new Date().toISOString().slice(0, 10)
  };

  console.log("Guardando usuario:", newUser); // Debug

  try {
    const userId = await addItem("users", newUser);
    console.log("Usuario guardado con ID:", userId); // Debug
    
    // Verificar que se guardó correctamente
    const updatedUsers = await getAll("users");
    console.log("Usuarios después de guardar:", updatedUsers); // Debug
    
    alert("✅ Registro exitoso. Ahora puedes iniciar sesión.");
    showLogin();
  } catch (error) {
    console.error("Error al guardar usuario:", error);
    alert("❌ Error en el registro. Intenta nuevamente.");
  }
  
  return false;
}

// ===============================
// FUNCIÓN PARA VER USUARIOS (DEBUG)
// ===============================
async function debugUsers() {
  await ensureDBReady();
  const users = await getAll("users");
  console.log("=== DEBUG USUARIOS ===");
  console.log("Total usuarios:", users.length);
  users.forEach((user, index) => {
    console.log(`Usuario ${index + 1}:`, user);
  });
  console.log("======================");
}

// ===============================
// CONTROL DE SESIÓN
// ===============================
function logout() {
  localStorage.removeItem("sessionUser");
  location.href = "index.html";
}

function ensureAuthenticated() {
  const session = localStorage.getItem("sessionUser");
  if (!session) location.href = "index.html";
  return JSON.parse(session);
}

// Hacer funciones globales
window.login = login;
window.register = register;
window.logout = logout;
window.ensureAuthenticated = ensureAuthenticated;
window.debugUsers = debugUsers; // Para debugging
