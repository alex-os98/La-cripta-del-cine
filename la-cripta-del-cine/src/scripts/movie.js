async function fetchJSON(url) {
  const r = await fetch(url);
  return r.json();
}

const params = new URLSearchParams(location.search);
const id = params.get("id");

async function load() {
  const movie = await fetchJSON(`/api/movie/${id}`);
  if (!movie) {
    document.getElementById("movie-container").innerHTML = "<p>Película no encontrada</p>";
    return;
  }

  document.getElementById("movie-container").innerHTML = `
    <h1>${movie.title} (${movie.year})</h1>
    <video controls width="720" src="${movie.video}"></video>
    <p class="synopsis">${movie.synopsis}</p>
    <p><strong>Tags:</strong> ${movie.tags.map(t => `<span class="tag">${t}</span>`).join(" ")}</p>

    <h3>Comentarios</h3>
    <div id="comments">
      ${movie.comments.map(c => `<div class="comment"><b>${c.user}</b> <small>${c.date}</small><p>${c.text}</p></div>`).join("")}
    </div>

    <h4>Añadir comentario</h4>
    <input id="user" placeholder="Tu nombre" />
    <textarea id="text" placeholder="Tu comentario"></textarea>
    <button id="send">Enviar</button>
  `;

  document.getElementById("send").addEventListener("click", addComment);
}

async function addComment() {
  const user = document.getElementById("user").value.trim();
  const text = document.getElementById("text").value.trim();
  if (!user || !text) { alert("Completa nombre y comentario"); return; }

  const res = await fetch(`/api/movie/${id}/comment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user, text })
  });

  if (!res.ok) {
    alert("Error al enviar el comentario");
    return;
  }
  // recargar el detalle para mostrar comentarios actualizados
  load();
}

load();
