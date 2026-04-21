import clientPromise from '../lib/mongodb';
import { ObjectId } from 'mongodb';

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

    const { chatId, remitente, texto } = req.body;

    if (!chatId || !remitente || !texto) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos'
      });
    }

    const nuevoMensaje = {
      chatId,
      remitente,
      texto,
      fecha: new Date()
    };

    await db.collection("mensajes").insertOne(nuevoMensaje);

    await db.collection("chats").updateOne(
      { _id: new ObjectId(chatId) },
      {
        $set: {
          ultimoMensaje: texto,
          actualizadoEn: new Date()
        }
      }
    );

    return res.status(201).json({
      success: true,
      message: 'Mensaje enviado correctamente'
    });

  } catch (e) {
    console.error(e);
    return res.status(500).json({
      success: false,
      message: 'Error interno: ' + e.message
    });
  }
}