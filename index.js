const express = require("express");
const app = express();
const PUERTO = 3000;

// Middleware para parsear JSON
app.use(express.json());

// "Base de datos" en memoria
let mascotas = [
  {
    id: 1,
    nombre: "Firulais",
    raza: "Labrador",
    edad: 3,
    foto: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=400",
  },
  {
    id: 2,
    nombre: "Michi",
    raza: "Siamés",
    edad: 2,
    foto: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400",
  },
  {
    id: 3,
    nombre: "Rocky",
    raza: "Bulldog",
    edad: 5,
    foto: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400",
  },
];

let siguienteId = 4;

// GET - Obtener todas las mascotas
app.get("/mascotas", (req, res) => {
  res.json(mascotas);
});

// GET - Obtener una mascota por ID
app.get("/mascotas/:id", (req, res) => {
  const mascota = mascotas.find((m) => m.id === parseInt(req.params.id));

  if (!mascota) {
    return res.status(404).json({ mensaje: "Mascota no encontrada" });
  }

  res.json(mascota);
});

// POST - Crear una nueva mascota
app.post("/mascotas", (req, res) => {
  const { nombre, raza, edad, foto } = req.body;

  // Validación básica
  if (!nombre || !raza || edad === undefined) {
    return res
      .status(400)
      .json({ mensaje: "Los campos nombre, raza y edad son obligatorios" });
  }

  const nuevaMascota = {
    id: siguienteId++,
    nombre,
    raza,
    edad,
    foto: foto || "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400",
  };

  mascotas.push(nuevaMascota);
  res.status(201).json(nuevaMascota);
});

// PUT - Actualizar una mascota completa
app.put("/mascotas/:id", (req, res) => {
  const indice = mascotas.findIndex((m) => m.id === parseInt(req.params.id));

  if (indice === -1) {
    return res.status(404).json({ mensaje: "Mascota no encontrada" });
  }

  const { nombre, raza, edad, foto } = req.body;

  if (!nombre || !raza || edad === undefined) {
    return res
      .status(400)
      .json({ mensaje: "Los campos nombre, raza y edad son obligatorios" });
  }

  // Reemplaza todo el objeto manteniendo el ID
  mascotas[indice] = { id: mascotas[indice].id, nombre, raza, edad, foto };
  res.json(mascotas[indice]);
});

// PATCH - Actualizar parcialmente una mascota
app.patch("/mascotas/:id", (req, res) => {
  const indice = mascotas.findIndex((m) => m.id === parseInt(req.params.id));

  if (indice === -1) {
    return res.status(404).json({ mensaje: "Mascota no encontrada" });
  }

  // Solo actualiza los campos que vengan en el body
  const camposPermitidos = ["nombre", "raza", "edad", "foto"];
  const actualizaciones = {};

  for (const campo of camposPermitidos) {
    if (req.body[campo] !== undefined) {
      actualizaciones[campo] = req.body[campo];
    }
  }

  mascotas[indice] = { ...mascotas[indice], ...actualizaciones };
  res.json(mascotas[indice]);
});

// DELETE - Eliminar una mascota
app.delete("/mascotas/:id", (req, res) => {
  const indice = mascotas.findIndex((m) => m.id === parseInt(req.params.id));

  if (indice === -1) {
    return res.status(404).json({ mensaje: "Mascota no encontrada" });
  }

  const eliminada = mascotas.splice(indice, 1)[0];
  res.json({ mensaje: "Mascota eliminada", mascota: eliminada });
});

// Iniciar servidor
app.listen(PUERTO, () => {
  console.log(`🐾 API de Mascotas corriendo en http://localhost:${PUERTO}`);
  console.log(`📋 Endpoints disponibles:`);
  console.log(`   GET    http://localhost:${PUERTO}/mascotas`);
  console.log(`   GET    http://localhost:${PUERTO}/mascotas/:id`);
  console.log(`   POST   http://localhost:${PUERTO}/mascotas`);
  console.log(`   PUT    http://localhost:${PUERTO}/mascotas/:id`);
  console.log(`   PATCH  http://localhost:${PUERTO}/mascotas/:id`);
  console.log(`   DELETE http://localhost:${PUERTO}/mascotas/:id`);
});
