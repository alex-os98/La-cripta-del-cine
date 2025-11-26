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

// Añadir comentario a una película (persistente en data/movies.json)
app.post("/api/movies/:id/comment", (req, res) => {
  try {
    const dataPath = path.join(__dirname, "data", "movies.json");
    const data = JSON.parse(fs.readFileSync(dataPath));
    const movie = data.find(m => m.id === parseInt(req.params.id));
    if (!movie) return res.status(404).json({ error: "Película no encontrada" });

    const { user, text } = req.body;
    if (!user || !text) return res.status(400).json({ error: "Faltan campos" });

    const comment = {
      user: String(user).substring(0, 100),
      text: String(text).substring(0, 1000),
      date: new Date().toISOString()
    };

    movie.comments = movie.comments || [];
    movie.comments.push(comment);

    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

    return res.status(201).json({ success: true, comment });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error al guardar el comentario' });
  }
});

// Ruta raíz: servir index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "src", "index.html"));
});

// Servir página de detalle de película
app.get("/movie.html", (req, res) => {
  res.sendFile(path.join(__dirname, "src", "movie.html"));
});

// CONTACTO (guardar mensajes)
const contactsPath = path.join(__dirname, "data", "contacts.json");

// Si no existe contacts.json, lo creamos
if (!fs.existsSync(contactsPath)) {
  fs.writeFileSync(contactsPath, JSON.stringify([], null, 2));
}

// Guardar mensaje de contacto
app.post("/api/contact", (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: "Faltan campos" });
    }

    const prev = JSON.parse(fs.readFileSync(contactsPath));

    const newMsg = {
      name: String(name).substring(0, 100),
      email: String(email).substring(0, 150),
      message: String(message).substring(0, 2000),
      date: new Date().toISOString()
    };

    prev.push(newMsg);
    fs.writeFileSync(contactsPath, JSON.stringify(prev, null, 2));

    return res.status(201).json({ success: true, contact: newMsg });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al guardar el mensaje" });
  }
});

// Ver todos los mensajes guardados
app.get("/api/contact-list", (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(contactsPath));
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al leer mensajes" });
  }
});


// Iniciar servidor
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));

// Servir archivos estáticos adicionales (imágenes, videos)
app.use("/images", express.static(path.join(__dirname, "public", "images")));
app.use("/videos", express.static(path.join(__dirname, "public", "videos")));