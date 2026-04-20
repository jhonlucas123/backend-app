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

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Solo se permite POST'
    });
  }

  try {
    const client = await clientPromise;
    const db = client.db("tienda_zapatillas");

    const {
      titulo,
      descripcion,
      precio,
      categoria,
      marca,
      fotoUrl,
      vendedor
    } = req.body;

    if (!titulo || !descripcion || !precio || !categoria || !marca || !fotoUrl || !vendedor) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos'
      });
    }

    const nuevaZapatilla = {
      titulo,
      descripcion,
      precio: Number(precio),
      categoria,
      marca,
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

  } catch (e) {
    console.error(e);
    return res.status(500).json({
      success: false,
      message: 'Error interno: ' + e.message
    });
  }
}