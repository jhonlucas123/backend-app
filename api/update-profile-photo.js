import clientPromise from '../lib/mongodb';

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

  // Aceptamos PUT
  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, message: 'Solo se permite PUT' });
  }

  try {
    const client = await clientPromise;
    const db = client.db("tienda_zapatillas");

    const { username, fotoPerfil } = req.body;

    if (!username || !fotoPerfil) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos'
      });
    }

    const usuarioActualizado = await db.collection("users").findOneAndUpdate(
      { username: username },
      { $set: { fotoPerfil: fotoPerfil } },
      { returnDocument: 'after' }
    );

    if (!usuarioActualizado.value) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Foto actualizada correctamente'
    });

  } catch (e) {
    console.error(e);
    return res.status(500).json({
      success: false,
      message: 'Error interno: ' + e.message
    });
  }
}