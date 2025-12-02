// Archivo: src/scripts/main.js
// Utilidad para obtener JSON desde una URL usando fetch
async function fetchJSON(url) {
  const r = await fetch(url); // Realiza la petición
  return r.json(); // Devuelve el JSON parseado
}

// Escapar texto para HTML (pequeña utilidad)
function escapeHtml(s) {
  if (!s) return ''; // Si no hay valor, devolver cadena vacía
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); // Reemplaza caracteres peligrosos
}

// Construir lista única de tags y renderizar casillas
function renderTagsFilter() {
  const tagsEl = document.getElementById('tags-list'); // Elemento donde van las casillas
  if (!tagsEl) return; // Si no existe, salir
  const tags = new Set(); // Usamos Set para evitar duplicados
  allMovies.forEach(m => (m.tags || []).forEach(t => { if (t) tags.add(String(t).trim()); })); // Recolecta tags de todas las películas
  const arr = Array.from(tags).sort((a, b) => a.localeCompare(b)); // Convierte a array y ordena
  if (!arr.length) { tagsEl.innerHTML = '<em>No hay tags</em>'; return; } // Si no hay tags, mostrar mensaje
  // NOTA: el siguiente bloque usa template literals multilínea para generar HTML; no se insertan comentarios dentro de la literal para no romper la salida HTML
  tagsEl.innerHTML = arr.map(t => `
    <label class="tag-checkbox"><input type="checkbox" value="${escapeHtml(t)}" data-tag /> ${escapeHtml(t)}</label>
  `).join(''); // Inserta checkbox por cada tag
  tagsEl.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.addEventListener('change', applyFilters)); // Añade listener para cambios
}

// Función central que aplica todos los filtros (texto, métricas y tags)
function applyFilters(e) {
  try {
    const q = (document.getElementById('search')?.value || '').trim().toLowerCase(); // Texto de búsqueda
    const goreMin = Number(document.getElementById('filter-gore')?.value || 0); // Mínimo gore
    const scaresMin = Number(document.getElementById('filter-scares')?.value || 0); // Mínimo scares
    const jumpsMin = Number(document.getElementById('filter-jumps')?.value || 0); // Mínimo jumps
    const suspMin = Number(document.getElementById('filter-suspense')?.value || 0); // Mínimo suspense
    const selectedTags = Array.from(document.querySelectorAll('#tags-list input[type=checkbox]:checked')).map(i => i.value); // Tags seleccionados

    const filtered = allMovies.filter(m => {
      const textMatch = !q || (m.title && m.title.toLowerCase().includes(q)) || (m.synopsis && m.synopsis.toLowerCase().includes(q)); // Coincidencia de texto
      const goreOk = (typeof m.gore === 'number' ? m.gore : 0) >= goreMin; // Comprueba gore
      const scaresOk = (typeof m.scares === 'number' ? m.scares : 0) >= scaresMin; // Comprueba scares
      const jumpsOk = (typeof m.jumpscares === 'number' ? m.jumpscares : 0) >= jumpsMin; // Comprueba jumpscares
      const suspOk = (typeof m.suspense === 'number' ? m.suspense : (typeof m.scares === 'number' ? m.scares : 0)) >= suspMin; // Comprueba suspense
      const tagsOk = !selectedTags.length || (m.tags || []).some(t => selectedTags.includes(String(t))); // Comprueba tags
      return textMatch && goreOk && scaresOk && jumpsOk && suspOk && tagsOk; // Devuelve si pasa todos los filtros
    });

    const countEl = document.getElementById('results-count'); // Elemento donde se muestra la cuenta de resultados

    // determinar si hay filtros activos (texto, métricas o tags)
    const filtersActive = Boolean(q) || goreMin > 0 || scaresMin > 0 || jumpsMin > 0 || suspMin > 0 || selectedTags.length > 0; // Indica si algún filtro está activo

    if (filtersActive) {
      // ocultar carruseles y sus títulos para mostrar solo resultados
      document.querySelectorAll('.carousel-wrapper').forEach(el => {
        el.style.display = 'none'; // Oculta carrusel
        const prev = el.previousElementSibling; // Posible título H2 anterior
        if (prev && prev.tagName === 'H2') prev.style.display = 'none'; // Oculta título si existe
      });

      if (countEl) countEl.innerText = String(filtered.length); // Actualiza número de resultados
      renderAllMovies._overrideList = filtered; // Pasa lista filtrada como override
      renderAllMovies(1); // Renderiza la página 1 de resultados

      // actualizar sección de resultados superior
      const main = document.querySelector('main'); // Elemento main
      const old = document.getElementById('search-results-section'); if (old) old.remove(); // Elimina sección previa si existe
      const sec = document.createElement('section'); // Crea nueva sección
      sec.id = 'search-results-section'; // Asigna id
      // NOTA: el siguiente template literal contiene HTML multilínea para mostrar resultados; no se inserta comentario dentro de la literal
      sec.innerHTML = `<h2>Resultados (${filtered.length})</h2><div class="carousel">${filtered.map(m => `
      <div class="card" onclick="openMovie(${m.id})">
        <img src="${m.poster}" alt="${escapeHtml(m.title)}" />
        <p class="card-title">${escapeHtml(m.title)}</p>
      </div>
    `).join('')}</div>`; // Inserta HTML con las tarjetas de resultados
      main.insertBefore(sec, document.getElementById('all-movies'));

    } else {
      // restaurar carruseles y títulos
      document.querySelectorAll('.carousel-wrapper').forEach(el => {
        el.style.display = 'flex'; // Muestra carruseles
        const prev = el.previousElementSibling; // Posible título
        if (prev && prev.tagName === 'H2') prev.style.display = ''; // Restaura visibilidad del título
      });
      if (countEl) countEl.innerText = String(allMovies.length); // Muestra total de películas
      renderAllMovies._overrideList = null; // Quita override
      const old = document.getElementById('search-results-section'); if (old) old.remove(); // Elimina sección de resultados si existe
      // re-renderizar carruseles originales
      renderCarousel("", (window.G_carousels && window.G_carousels.recommended) || [], "carousel-recommended");
      renderCarousel("Favoritas de Japón", (window.G_carousels && window.G_carousels.favoritesJapan) || [], "carousel-favoritesJapan");
      renderCarousel("Favoritas de España", (window.G_carousels && window.G_carousels.favoritesSpain) || [], "carousel-favoritesSpain");
      renderCarousel("Favoritas de USA", (window.G_carousels && window.G_carousels.favoritesUSA) || [], "carousel-favoritesUSA");
      renderCarousel("Terror Coreano", (window.G_carousels && window.G_carousels.koreanHorror) || [], "carousel-koreanHorror");
      renderCarousel("Cine Extremo Francés", (window.G_carousels && window.G_carousels.frenchExtreme) || [], "carousel-frenchExtreme");
      renderAllMovies(1); // Renderiza lista completa página 1
      setupCarouselButtons(); // Inicializa botones de carrusel
    }
  } catch (err) { console.error('applyFilters error', err); } // Captura errores de applyFilters
}

// Función que limpia todos los filtros y restaura el estado inicial
function clearFilters() {
  // limpiar input de búsqueda
  const s = document.getElementById('search'); if (s) s.value = '';
  // reset selects
  ['filter-gore', 'filter-scares', 'filter-jumps', 'filter-suspense'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '0';
  });
  // desmarcar tags
  document.querySelectorAll('#tags-list input[type=checkbox]').forEach(cb => { cb.checked = false; });
  // cerrar desplegable de tags
  const tagsContainer = document.getElementById('tags-container'); if (tagsContainer) tagsContainer.classList.add('hidden');
  const tagsToggle = document.getElementById('tags-toggle'); if (tagsToggle) tagsToggle.classList.remove('open');
  // restaurar carruseles, títulos y lista completa
  document.querySelectorAll('.carousel-wrapper').forEach(el => el.style.display = 'flex');
  document.querySelectorAll('h2').forEach(h => { /* sólo restaurar si es título de carrusel - se deja en blanco en filters-panel */ if (h.parentElement && h.parentElement.querySelector('.carousel-wrapper')) h.style.display = ''; });
  renderAllMovies._overrideList = null; // Quitar override
  const countEl = document.getElementById('results-count'); if (countEl) countEl.innerText = String(allMovies.length); // Mostrar total
  renderAllMovies(1); // Renderizar de nuevo lista completa
  // re-renderizar carruseles originales
  renderCarousel("", (window.G_carousels && window.G_carousels.recommended) || [], "carousel-recommended");
  renderCarousel("Favoritas de Japón", (window.G_carousels && window.G_carousels.favoritesJapan) || [], "carousel-favoritesJapan");
  renderCarousel("Favoritas de España", (window.G_carousels && window.G_carousels.favoritesSpain) || [], "carousel-favoritesSpain");
  renderCarousel("Favoritas de USA", (window.G_carousels && window.G_carousels.favoritesUSA) || [], "carousel-favoritesUSA");
  renderCarousel("Terror Coreano", (window.G_carousels && window.G_carousels.koreanHorror) || [], "carousel-koreanHorror");
  renderCarousel("Cine Extremo Francés", (window.G_carousels && window.G_carousels.frenchExtreme) || [], "carousel-frenchExtreme");
  setupCarouselButtons(); // Reconfigura botones
}


let allMovies = []; // Array global con todas las películas


async function init() {
  // 🔥 ARREGLO: Ejecutamos openCryptDoor al inicio para asegurar que la animación de la puerta se inicie
  if (typeof window.openCryptDoor === 'function') {
    window.openCryptDoor(); // Llama a la animación si existe
  }

  allMovies = await fetchJSON("/api/movies"); // Carga películas desde la API
  const carousels = await fetchJSON("/api/carousels"); // Carga datos de carousels
  // guardar carousels en variable global para poder re-renderizarlos sin volver a pedir al servidor
  window.G_carousels = carousels; // Guarda en global

  renderCarousel("", carousels.recommended, "carousel-recommended"); // Renderiza cada carrusel
  renderCarousel("Favoritas de Japón", carousels.favoritesJapan, "carousel-favoritesJapan");
  renderCarousel("Favoritas de España", carousels.favoritesSpain, "carousel-favoritesSpain");
  renderCarousel("Favoritas de USA", carousels.favoritesUSA, "carousel-favoritesUSA");
  renderCarousel("Terror Coreano", carousels.koreanHorror, "carousel-koreanHorror");
  renderCarousel("Cine Extremo Francés", carousels.frenchExtreme, "carousel-frenchExtreme");

  // Inicializar filtros y listeners
  renderTagsFilter(); // Crear lista de tags
  document.getElementById("search").addEventListener("input", applyFilters); // Listener búsqueda
  ['filter-gore', 'filter-scares', 'filter-jumps', 'filter-suspense'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', applyFilters); // Listener para selects
  });

  // Listener para el toggle de tags (desplegable)
  const tagsToggle = document.getElementById('tags-toggle');
  const tagsContainer = document.getElementById('tags-container');
  if (tagsToggle && tagsContainer) {
    tagsToggle.addEventListener('click', () => {
      tagsContainer.classList.toggle('hidden'); // Mostrar/ocultar contenedor
      tagsToggle.classList.toggle('open'); // Cambiar estado del toggle
      // forzar foco en primer checkbox al abrir
      if (!tagsContainer.classList.contains('hidden')) {
        const first = tagsContainer.querySelector('input[type=checkbox]');
        if (first) first.focus(); // Pone foco en el primer checkbox
      }
    });
  }

  // Listener para limpiar filtros
  const clearBtn = document.getElementById('clear-filters');
  if (clearBtn) clearBtn.addEventListener('click', clearFilters);

  // Después de renderizar carruseles, inicializar lista paginada y botones
  renderAllMovies(1); // página inicial
  setupCarouselButtons(); // Configura botones
}

const PAGE_SIZE = 15; // películas por página en la lista completa

// Renderiza la lista paginada de todas las películas (solo imagen + título)
function renderAllMovies(page = 1) {
  const grid = document.getElementById('movies-grid'); // Contenedor del grid
  const pagination = document.getElementById('movies-pagination'); // Contenedor de paginación
  if (!grid || !pagination) return; // Si faltan elementos, salir

  // Si existe una lista override (resultado de filtros), usarla
  const list = Array.isArray(renderAllMovies._overrideList) ? renderAllMovies._overrideList : allMovies; // Lista a renderizar
  const total = list.length; // Total de elementos
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE)); // Número de páginas
  const current = Math.min(Math.max(1, page), totalPages); // Página actual válida

  // calcular slice de películas para la página actual
  const start = (current - 1) * PAGE_SIZE; // Índice de inicio
  const pageItems = list.slice(start, start + PAGE_SIZE); // Elementos de la página

  // construir grid: tarjetas pequeñas con imagen y nombre
  grid.innerHTML = pageItems.map(m => `
    <div class="movie-small" onclick="openMovie(${m.id})">
      <img src="${m.poster}" alt="${m.title}" />
      <p class="movie-small-title">${m.title}</p>
    </div>
  `).join(''); // Inserta tarjetas en el grid

  // construir paginación simple: anterior, números y siguiente
  let pagesHtml = '';
  pagesHtml += `<button class="page-btn" data-page="${current - 1}" ${current === 1 ? 'disabled' : ''}>‹</button>`;
  for (let p = 1; p <= totalPages; p++) {
    pagesHtml += `<button class="page-btn ${p === current ? 'active' : ''}" data-page="${p}">${p}</button>`;
  }
  pagesHtml += `<button class="page-btn" data-page="${current + 1}" ${current === totalPages ? 'disabled' : ''}>›</button>`;
  pagination.innerHTML = pagesHtml; // Inserta la paginación

  // enlazar eventos de paginación
  pagination.querySelectorAll('.page-btn').forEach(b => {
    b.addEventListener('click', () => {
      const p = Number(b.dataset.page);
      if (p >= 1 && p <= totalPages) {
        // Al hacer click, llamar a renderAllMovies(p)
        renderAllMovies(p);
      }
    });
  });

  // Lógica de control de visibilidad de carruseles (página 1 vs otras)
  if (typeof window.actualizarVisibilidadCarruseles === 'function') {
    window.actualizarVisibilidadCarruseles(current); // Llama a función externa si existe
  }

  //ARREGLO: Pasamos la página actual a scrollToTop para que sepa dónde ir
  if (typeof window.scrollToTop === 'function') {
    window.scrollToTop(current); // <-- ¡Importante!
  }
}

function renderCarousel(title, ids, containerId) {
  const container = document.getElementById(containerId); // Contenedor del carrusel
  const movies = ids.map(id => allMovies.find(m => m.id === id)).filter(Boolean); // Obtiene objetos de película por id

  // insertar sólo la fila .carousel dentro del contenedor (el título ya está en el HTML)
  container.innerHTML = `<div class="carousel">${movies.map(m => `
    <div class="card" onclick="openMovie(${m.id})">
      <img src="${m.poster}" alt="${m.title}" />
      <p class="card-title">${m.title}</p>
    </div>`).join("")}</div>`; // Genera HTML del carrusel (usa template literal multilínea)
}

function setupCarouselButtons() {
  document.querySelectorAll('.arrow').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.carousel; // 'recommended' or 'favoritesJapan'
      const container = document.getElementById(`carousel-${key}`);
      if (!container) return; // Si no existe, salir
      // el elemento que tiene overflow-x es .carousel-container (el propio container)
      const amount = Math.round(container.clientWidth * 0.8) || 300; // Cantidad a desplazar
      if (btn.classList.contains('left')) {
        container.scrollBy({ left: -amount, behavior: 'smooth' }); // Scroll a izquierda
      } else {
        container.scrollBy({ left: amount, behavior: 'smooth' }); // Scroll a derecha
      }
    });
  });
}

function openMovie(id) {
  window.location.href = `movie.html?id=${id}`; // Redirige a la página de detalle con query param
}

// Búsqueda simple + filtros básicos: soporta "gore:3", "scares:4" o texto
// handleSearch removed - ahora usamos applyFilters que soporta métricas y tags

// --- Formulario de contacto ---
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm"); // Formulario de contacto
  const msg = document.getElementById("contactMessage"); // Elemento para mensajes al usuario

  if (!form || !msg) return; // Si faltan elementos, salir

  form.addEventListener("submit", async (e) => {
    e.preventDefault(); // Evita el submit por defecto

    const data = new FormData(form); // Toma los datos del formulario
    const name = data.get("name");
    const email = data.get("email");
    const message = data.get("message");

    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message })
      });

      if (!r.ok) throw new Error("No se pudo enviar"); // Lanza si la respuesta no es OK

      msg.textContent = "¡Gracias! Tu mensaje ha sido guardado."; // Mensaje de éxito
      form.reset(); // Resetea formulario
    } catch (err) {
      console.error(err); // Muestra error en consola
      msg.textContent = "Ups, hubo un error al enviar."; // Mensaje de fallo
    }

    setTimeout(() => (msg.textContent = ""), 3000); // Limpia el mensaje a los 3s
  });
});

window.openMovie = openMovie; // exponer para onclick inline
init();