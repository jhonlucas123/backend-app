import clientPromise from '../lib/mongodb';

export default async function handler(req, res) {
  // 1. AÑADE ESTO AL PRINCIPIO PARA EVITAR PROBLEMAS DE PERMISOS (CORS)
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
  // -----------------------------------------------------------

  // 2. Solo aceptamos peticiones POST (enviar datos)
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }


  try {
    const client = await clientPromise;
    const db = client.db("tienda_zapatillas"); // Tu base de datos

    const { username, password, email } = req.body; // 1. Recibimos el email del cuerpo de la petición

    // 3. Validamos que lleguen datos
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Faltan datos' });
    }
    // 2. Validamos que el email no venga vacío
    if (!username || !password || !email) {
      return res.status(400).json({ success: false, message: 'Faltan datos' });
    }
    // 3. Comprobar si el email ya está registrado
    const emailExiste = await db.collection("users").findOne({ email });
    if (emailExiste) {
      return res.status(409).json({ success: false, message: 'El email ya está en uso' });
    }

    // 4. Comprobamos si el usuario ya existe
    const existingUser = await db.collection("users").findOne({ username });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'El usuario ya existe' });
    }

    // 5. Guardamos el nuevo usuario
    const newUser = {
      username,
      password,
      email, // 4. Guardamos el email en el documento
      rol: "cliente", // Si quieres mantener lo de los roles [cite: 2026-01-22]
      fechaRegistro: new Date()
    };

    const result = await db.collection("users").insertOne(newUser);

    return res.status(201).json({ success: true, message: 'Usuario creado', userId: result.insertedId });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, message: 'Error en el servidor: ' + e.message });
  }
}