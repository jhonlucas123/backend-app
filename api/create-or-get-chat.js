import clientPromise from '../lib/mongodb';

export default async function handler(req, res) {
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
      zapatillaId,
      tituloZapatilla,
      fotoUrl,
      comprador,
      vendedor
    } = req.body;

    if (!zapatillaId || !tituloZapatilla || !fotoUrl || !comprador || !vendedor) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos'
      });
    }

    const chatExistente = await db.collection("chats").findOne({
      zapatillaId,
      comprador,
      vendedor
    });

    if (chatExistente) {
      return res.status(200).json({
        success: true,
        chatId: chatExistente._id,
        message: 'Chat existente'
      });
    }

    const nuevoChat = {
      zapatillaId,
      tituloZapatilla,
      fotoUrl,
      comprador,
      vendedor,
      ultimoMensaje: "",
      actualizadoEn: new Date(),
      creadoEn: new Date()
    };

    const result = await db.collection("chats").insertOne(nuevoChat);

    return res.status(201).json({
      success: true,
      chatId: result.insertedId,
      message: 'Chat creado correctamente'
    });

  } catch (e) {
    console.error(e);
    return res.status(500).json({
      success: false,
      message: 'Error interno: ' + e.message
    });
  }
}