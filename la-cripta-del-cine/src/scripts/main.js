// src/scripts/main.js
async function fetchJSON(url) {
  const r = await fetch(url);
  return r.json();
}

let allMovies = [];

async function init() {
  allMovies = await fetchJSON("/api/movies");
  const carousels = await fetchJSON("/api/carousels");

  renderCarousel("", carousels.recommended, "carousel-recommended");
  renderCarousel("Favoritas de Japón", carousels.favoritesJapan, "carousel-favoritesJapan");

  document.getElementById("search").addEventListener("input", handleSearch);
}

function renderCarousel(title, ids, containerId) {
  const container = document.getElementById(containerId);
  const movies = ids.map(id => allMovies.find(m => m.id === id)).filter(Boolean);

  // insertar sólo la fila .carousel dentro del contenedor (el título ya está en el HTML)
  container.innerHTML = `<div class="carousel">${movies.map(m => `
    <div class="card" onclick="openMovie(${m.id})">
      <img src="${m.poster}" alt="${m.title}" />
      <p class="card-title">${m.title}</p>
    </div>`).join("")}</div>`;
}

function setupCarouselButtons() {
  document.querySelectorAll('.arrow').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.carousel; // 'recommended' or 'favoritesJapan'
      const container = document.getElementById(`carousel-${key}`);
      if (!container) return;
      // el elemento que tiene overflow-x es .carousel-container (el propio container)
      const amount = Math.round(container.clientWidth * 0.8) || 300;
      if (btn.classList.contains('left')) {
        container.scrollBy({ left: -amount, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: amount, behavior: 'smooth' });
      }
    });
  });
}

function openMovie(id) {
  window.location.href = `movie.html?id=${id}`;
}

// Búsqueda simple + filtros básicos: soporta "gore:3", "scares:4" o texto
function handleSearch(e) {
  const q = e.target.value.trim().toLowerCase();
  if (!q) {
    // restaurar carruseles originales
    init();
    return;
  }

  // parse gore:#
  const goreMatch = q.match(/gore:(\d+)/);
  const scaresMatch = q.match(/scares:(\d+)/);
  const gore = goreMatch ? Number(goreMatch[1]) : null;
  const scares = scaresMatch ? Number(scaresMatch[1]) : null;

  // filtrar por texto y/o valores
  const filtered = allMovies.filter(m => {
    const textMatch = m.title.toLowerCase().includes(q) || m.synopsis.toLowerCase().includes(q);
    const goreMatch = gore === null ? true : m.gore >= gore;
    const scaresMatch = scares === null ? true : m.scares >= scares;
    return (gore !== null || scares !== null) ? (goreMatch && scaresMatch) : textMatch;
  });

  // mostrar los resultados en una sección única
  const main = document.querySelector("main");
  main.innerHTML = `<section><h2>Resultados</h2><div class="carousel">${filtered.map(m => `
      <div class="card" onclick="openMovie(${m.id})">
        <img src="${m.poster}" alt="${m.title}" />
        <p class="card-title">${m.title}</p>
      </div>`).join("")}</div></section>`;
}

window.openMovie = openMovie; // exponer para onclick inline
init();
// configurar flechas (si el DOM cambia, llamar de nuevo)
setupCarouselButtons();
