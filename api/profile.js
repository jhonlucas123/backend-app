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

  // Aceptamos GET
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Solo se permite GET' });
  }

  try {
    const client = await clientPromise;
    const db = client.db("tienda_zapatillas");

    const { username } = req.query;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Falta el username'
      });
    }

    const user = await db.collection("users").findOne({ username: username });

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
      role: user.rol || "cliente",
      fotoPerfil: user.fotoPerfil || "",
      zona: user.zona || ""
    });

  } catch (e) {
    console.error(e);
    return res.status(500).json({
      success: false,
      message: 'Error interno: ' + e.message
    });
  }
}