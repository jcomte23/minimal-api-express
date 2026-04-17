require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");

const app = express();
const PUERTO = 3000;

app.use(express.json());

// Pool de conexiones a MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  ssl: { rejectUnauthorized: true }, // Azure requiere SSL
  waitForConnections: true,
  connectionLimit: 10,
});

// Crear la tabla si no existe al iniciar
async function inicializarDB() {
  const sql = `
    CREATE TABLE IF NOT EXISTS mascotas (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      raza VARCHAR(100) NOT NULL,
      edad INT NOT NULL,
      foto VARCHAR(500)
    )
  `;
  await pool.execute(sql);
  console.log("✅ Tabla 'mascotas' lista");
}

// GET - Obtener todas las mascotas
app.get("/mascotas", async (req, res) => {
  try {
    const [mascotas] = await pool.execute("SELECT * FROM mascotas");
    res.json(mascotas);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener mascotas", error: error.message });
  }
});

// GET - Obtener una mascota por ID
app.get("/mascotas/:id", async (req, res) => {
  try {
    const [mascotas] = await pool.execute("SELECT * FROM mascotas WHERE id = ?", [req.params.id]);

    if (mascotas.length === 0) {
      return res.status(404).json({ mensaje: "Mascota no encontrada" });
    }

    res.json(mascotas[0]);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener mascota", error: error.message });
  }
});

// POST - Crear una nueva mascota
app.post("/mascotas", async (req, res) => {
  try {
    const { nombre, raza, edad, foto } = req.body;

    if (!nombre || !raza || edad === undefined) {
      return res.status(400).json({ mensaje: "Los campos nombre, raza y edad son obligatorios" });
    }

    const fotoFinal = foto || "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400";

    const [resultado] = await pool.execute(
      "INSERT INTO mascotas (nombre, raza, edad, foto) VALUES (?, ?, ?, ?)",
      [nombre, raza, edad, fotoFinal]
    );

    res.status(201).json({ id: resultado.insertId, nombre, raza, edad, foto: fotoFinal });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al crear mascota", error: error.message });
  }
});

// PUT - Actualizar una mascota completa
app.put("/mascotas/:id", async (req, res) => {
  try {
    const { nombre, raza, edad, foto } = req.body;

    if (!nombre || !raza || edad === undefined) {
      return res.status(400).json({ mensaje: "Los campos nombre, raza y edad son obligatorios" });
    }

    const [resultado] = await pool.execute(
      "UPDATE mascotas SET nombre = ?, raza = ?, edad = ?, foto = ? WHERE id = ?",
      [nombre, raza, edad, foto, req.params.id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensaje: "Mascota no encontrada" });
    }

    res.json({ id: parseInt(req.params.id), nombre, raza, edad, foto });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al actualizar mascota", error: error.message });
  }
});

// PATCH - Actualizar parcialmente una mascota
app.patch("/mascotas/:id", async (req, res) => {
  try {
    // Verificar que la mascota existe
    const [mascotas] = await pool.execute("SELECT * FROM mascotas WHERE id = ?", [req.params.id]);

    if (mascotas.length === 0) {
      return res.status(404).json({ mensaje: "Mascota no encontrada" });
    }

    const mascotaActual = mascotas[0];
    const camposPermitidos = ["nombre", "raza", "edad", "foto"];
    const actualizaciones = {};

    for (const campo of camposPermitidos) {
      actualizaciones[campo] = req.body[campo] !== undefined ? req.body[campo] : mascotaActual[campo];
    }

    await pool.execute(
      "UPDATE mascotas SET nombre = ?, raza = ?, edad = ?, foto = ? WHERE id = ?",
      [actualizaciones.nombre, actualizaciones.raza, actualizaciones.edad, actualizaciones.foto, req.params.id]
    );

    res.json({ id: mascotaActual.id, ...actualizaciones });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al actualizar mascota", error: error.message });
  }
});

// DELETE - Eliminar una mascota
app.delete("/mascotas/:id", async (req, res) => {
  try {
    // Obtener la mascota antes de eliminar
    const [mascotas] = await pool.execute("SELECT * FROM mascotas WHERE id = ?", [req.params.id]);

    if (mascotas.length === 0) {
      return res.status(404).json({ mensaje: "Mascota no encontrada" });
    }

    await pool.execute("DELETE FROM mascotas WHERE id = ?", [req.params.id]);
    res.json({ mensaje: "Mascota eliminada", mascota: mascotas[0] });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al eliminar mascota", error: error.message });
  }
});

// Iniciar servidor
async function iniciar() {
  try {
    await inicializarDB();
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
  } catch (error) {
    console.error("❌ Error al conectar con la base de datos:", error.message);
    process.exit(1);
  }
}

iniciar();
