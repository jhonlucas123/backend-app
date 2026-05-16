import clientPromise from '../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE');
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

    const { action } = req.body;

    if (!action) {
      return res.status(400).json({
        success: false,
        message: 'Falta action'
      });
    }

    // =====================================================
    // 1. OBTENER TODOS LOS USUARIOS
    // =====================================================
    if (action === "getUsers") {
      const users = await db.collection("users")
        .find({})
        .project({
          password: 0
        })
        .toArray();

      const usersFormateados = users.map(user => ({
        id: user._id.toString(),
        username: user.username || "",
        email: user.email || "",
        rol: user.rol || user.role || "user",
        zona: user.zona || "",
        fotoPerfil: user.fotoPerfil || "",
        fechaRegistro: user.fechaRegistro || null
      }));

      return res.status(200).json({
        success: true,
        users: usersFormateados
      });
    }

    // =====================================================
    // 2. OBTENER TODAS LAS PUBLICACIONES
    // =====================================================
    if (action === "getShoes") {
      const shoes = await db.collection("zapatillas")
        .find({})
        .sort({ fechaPublicacion: -1 })
        .toArray();

      const shoesFormateadas = shoes.map(shoe => ({
        id: shoe._id.toString(),
        titulo: shoe.titulo || "",
        descripcion: shoe.descripcion || "",
        precio: shoe.precio || 0,
        categoria: shoe.categoria || "",
        marca: shoe.marca || "",
        calidad: shoe.calidad || 0,
        talla: shoe.talla || "",
        disponibilidad: shoe.disponibilidad || "Disponible",
        fotoUrl: shoe.fotoUrl || "",
        vendedor: shoe.vendedor || "",
        fechaPublicacion: shoe.fechaPublicacion || null
      }));

      return res.status(200).json({
        success: true,
        zapatillas: shoesFormateadas
      });
    }

    // =====================================================
    // 3. ELIMINAR PUBLICACIÓN
    // =====================================================
    if (action === "deleteShoe") {
      const { shoeId, motivo, adminUsername } = req.body;

      if (!shoeId || !motivo) {
        return res.status(400).json({
          success: false,
          message: 'Faltan datos para eliminar la publicación'
        });
      }

      const shoe = await db.collection("zapatillas").findOne({
        _id: new ObjectId(shoeId)
      });

      if (!shoe) {
        return res.status(404).json({
          success: false,
          message: 'Publicación no encontrada'
        });
      }

      await db.collection("zapatillas").deleteOne({
        _id: new ObjectId(shoeId)
      });

      // Eliminar la publicación de los favoritos de todos los usuarios
      await db.collection("users").updateMany(
        {},
        { $pull: { favoritos: shoeId } }
      );

      // Guardar registro administrativo
      await db.collection("admin_logs").insertOne({
        action: "deleteShoe",
        shoeId,
        titulo: shoe.titulo || "",
        vendedor: shoe.vendedor || "",
        motivo,
        adminUsername: adminUsername || "",
        fecha: new Date()
      });

      return res.status(200).json({
        success: true,
        message: 'Publicación eliminada correctamente'
      });
    }

    // =====================================================
    // 4. ELIMINAR USUARIO
    // =====================================================
    if (action === "deleteUser") {
      const { userId, username, motivo, adminUsername } = req.body;

      if (!userId || !username || !motivo) {
        return res.status(400).json({
          success: false,
          message: 'Faltan datos para eliminar el usuario'
        });
      }

      const user = await db.collection("users").findOne({
        _id: new ObjectId(userId)
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      const rolUsuario = user.rol || user.role || "";

      if (rolUsuario.toLowerCase() === "admin") {
        return res.status(403).json({
          success: false,
          message: 'No se puede eliminar un usuario administrador'
        });
      }

      // Eliminar usuario
      await db.collection("users").deleteOne({
        _id: new ObjectId(userId)
      });

      // Eliminar publicaciones del usuario
      await db.collection("zapatillas").deleteMany({
        vendedor: username
      });

      // Eliminar chats donde participa
      await db.collection("chats").deleteMany({
        $or: [
          { comprador: username },
          { vendedor: username }
        ]
      });

      // Eliminar mensajes enviados por el usuario
      await db.collection("mensajes").deleteMany({
        remitente: username
      });

      // Quitar de favoritos cualquier referencia antigua si hiciera falta
      await db.collection("users").updateMany(
        {},
        { $pull: { favoritos: { $exists: true } } }
      );

      // Guardar registro administrativo
      await db.collection("admin_logs").insertOne({
        action: "deleteUser",
        userId,
        username,
        email: user.email || "",
        motivo,
        adminUsername: adminUsername || "",
        fecha: new Date()
      });

      return res.status(200).json({
        success: true,
        message: 'Usuario eliminado correctamente'
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