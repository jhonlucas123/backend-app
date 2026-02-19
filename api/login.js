import clientPromise from '../lib/mongodb';

export default async function handler(req, res) {
  // 1. CABECERAS PARA EVITAR ERRORES DE PERMISOS (CORS)
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

  // 2. Solo aceptamos POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Solo se permite POST' });
  }

  try {
    const client = await clientPromise;
    const db = client.db("tienda_zapatillas");

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Faltan datos' });
    }

    // 3. BUSCAR AL USUARIO EN MONGODB
    // Buscamos alguien que tenga ESE usuario y ESA contraseña
    const user = await db.collection("users").findOne({
      username: username,
      password: password
    });

    // 4. RESPONDER A LA APP
    if (user) {
      // ¡Encontrado!
      return res.status(200).json({
        success: true,
        message: "Login correcto",
        username: user.username, // Enviamos el nombre
        email: user.email,       // Enviamos el email guardado
        fecha: user.fechaRegistro, // Enviamos la fecha
        userId: user._id
      });
    } else {
      // No existe o contraseña mal
      return res.status(200).json({
        success: false,
        message: "Usuario o contraseña incorrectos"
      });
    }

  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, message: 'Error interno: ' + e.message });
  }
}