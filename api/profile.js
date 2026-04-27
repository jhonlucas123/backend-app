import clientPromise from '../lib/mongodb';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const client = await clientPromise;
    const db = client.db("tienda_zapatillas");

    // GET: cargar perfil
    if (req.method === 'GET') {
      const { username } = req.query;

      if (!username) {
        return res.status(400).json({
          success: false,
          message: 'Falta username'
        });
      }

      const user = await db.collection("users").findOne({ username });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      return res.status(200).json({
        success: true,
        username: user.username,
        email: user.email || "",
        zona: user.zona || "",
        fotoPerfil: user.fotoPerfil || ""
      });
    }

    // POST: editar perfil
    if (req.method === 'POST') {
      const { action } = req.body;

      if (action === "updateProfile") {
        const { oldUsername, newUsername, zona, fotoPerfil } = req.body;

        if (!oldUsername || !newUsername) {
          return res.status(400).json({
            success: false,
            message: 'Faltan datos'
          });
        }

        if (oldUsername !== newUsername) {
          const existeUsuario = await db.collection("users").findOne({
            username: newUsername
          });

          if (existeUsuario) {
            return res.status(409).json({
              success: false,
              message: 'Ese nombre de usuario ya existe'
            });
          }
        }

        const datosActualizar = {
          username: newUsername,
          zona: zona || ""
        };

        if (fotoPerfil && fotoPerfil.trim() !== "") {
          datosActualizar.fotoPerfil = fotoPerfil;
        }

        await db.collection("users").updateOne(
          { username: oldUsername },
          { $set: datosActualizar }
        );

        await db.collection("zapatillas").updateMany(
          { vendedor: oldUsername },
          { $set: { vendedor: newUsername } }
        );

        await db.collection("chats").updateMany(
          { comprador: oldUsername },
          { $set: { comprador: newUsername } }
        );

        await db.collection("chats").updateMany(
          { vendedor: oldUsername },
          { $set: { vendedor: newUsername } }
        );

        await db.collection("mensajes").updateMany(
          { remitente: oldUsername },
          { $set: { remitente: newUsername } }
        );

        return res.status(200).json({
          success: true,
          message: 'Perfil actualizado correctamente'
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Acción no válida'
      });
    }

    return res.status(405).json({
      success: false,
      message: 'Método no permitido'
    });

  } catch (e) {
    return res.status(500).json({
      success: false,
      message: 'Error interno: ' + e.message
    });
  }
}