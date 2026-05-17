import clientPromise from '../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Solo se permite POST'
    });
  }

  try {
    const client = await clientPromise;
    const db = client.db("tienda_zapatillas");

    const action = req.body.action || "createShoe";

    // Crear publicación
    // ===============================
    if (action === "createShoe") {
      const {
        titulo,
        descripcion,
        precio,
        categoria,
        marca,
        calidad,
        talla,
        ubicacion,
        fotoUrl,
        vendedor
      } = req.body;

      if (!titulo || !precio || !categoria || !marca || !calidad || !talla || !ubicacion || !fotoUrl || !vendedor) {
        return res.status(400).json({
          success: false,
          message: 'Faltan datos obligatorios'
        });
      }

      const nuevaZapatilla = {
        titulo: String(titulo).trim(),
        descripcion: descripcion && String(descripcion).trim() !== ""
          ? String(descripcion).trim()
          : "Sin descripción",
        precio: Number(precio),
        categoria: String(categoria).trim(),
        marca: String(marca).trim(),
        calidad: Number(calidad),
        talla: String(talla).trim(),
        ubicacion: String(ubicacion).trim(),
        disponibilidad: "Disponible",
        fotoUrl,
        vendedor,
        fechaPublicacion: new Date()
      };

      const result = await db.collection("zapatillas").insertOne(nuevaZapatilla);

      return res.status(201).json({
        success: true,
        message: 'Zapatilla publicada correctamente',
        shoeId: result.insertedId
      });
    }

    // Editar publicación
    // ===============================
    if (action === "updateShoe") {
      const {
        shoeId,
        vendedor,
        titulo,
        descripcion,
        precio,
        disponibilidad,
        fotoUrl,
        talla,
        ubicacion
      } = req.body;

      if (!shoeId || !vendedor || !titulo || !precio || !disponibilidad || !talla || !ubicacion) {
        return res.status(400).json({
          success: false,
          message: 'Faltan datos obligatorios'
        });
      }

      const disponibilidadesValidas = ["Disponible", "En reserva", "Vendido"];

      if (!disponibilidadesValidas.includes(disponibilidad)) {
        return res.status(400).json({
          success: false,
          message: 'Disponibilidad no válida'
        });
      }

      const zapatilla = await db.collection("zapatillas").findOne({
        _id: new ObjectId(shoeId)
      });

      if (!zapatilla) {
        return res.status(404).json({
          success: false,
          message: 'Publicación no encontrada'
        });
      }

      if (!zapatilla.vendedor || zapatilla.vendedor.toLowerCase() !== vendedor.toLowerCase()) {
        return res.status(403).json({
          success: false,
          message: 'No puedes editar esta publicación'
        });
      }

      const datosActualizar = {
        titulo: String(titulo).trim(),
        descripcion: descripcion && String(descripcion).trim() !== ""
          ? String(descripcion).trim()
          : "Sin descripción",
        precio: Number(precio),
        talla: String(talla).trim(),
        ubicacion: ubicacion && String(ubicacion).trim() !== ""
          ? String(ubicacion).trim()
          : zapatilla.ubicacion || "Ubicación no indicada",
        disponibilidad,
        fechaActualizacion: new Date()
      };

      if (fotoUrl && String(fotoUrl).trim() !== "") {
        datosActualizar.fotoUrl = String(fotoUrl).trim();
      }

      await db.collection("zapatillas").updateOne(
        { _id: new ObjectId(shoeId) },
        { $set: datosActualizar }
      );

      return res.status(200).json({
        success: true,
        message: 'Publicación actualizada correctamente'
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Acción no válida'
    });

  } catch (e) {
    console.error(e);

    return res.status(500).json({
      success: false,
      message: 'Error interno: ' + e.message
    });
  }
}