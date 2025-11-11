import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// 👇 Aquí está el cambio importante
app.use(express.static(path.join(__dirname, "src")));

// Rutas API
app.get("/api/movies", (req, res) => {
  const data = JSON.parse(fs.readFileSync("./data/movies.json"));
  res.json(data);
});

app.get("/api/carousels", (req, res) => {
  const data = JSON.parse(fs.readFileSync("./data/carousels.json"));
  res.json(data);
});

// Ruta para obtener una película específica
app.get("/api/movies/:id", (req, res) => {
  const data = JSON.parse(fs.readFileSync("./data/movies.json"));
  const movie = data.find(m => m.id === parseInt(req.params.id));
  if (movie) res.json(movie);
  else res.status(404).json({ error: "Película no encontrada" });
});

// Ruta raíz: servir index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "src", "index.html"));
});

// Servir página de detalle de película
app.get("/movie.html", (req, res) => {
  res.sendFile(path.join(__dirname, "src", "movie.html"));
});

// Iniciar servidor
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));

// Servir archivos estáticos adicionales (imágenes, videos)
app.use("/images", express.static(path.join(__dirname, "public", "images")));
app.use("/videos", express.static(path.join(__dirname, "public", "videos")));