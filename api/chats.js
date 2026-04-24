import clientPromise from '../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
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

    // 1) Crear o recuperar chat
    if (action === "createOrGetChat") {
      const {
        zapatillaId,
        tituloZapatilla,
        fotoUrl,
        comprador,
        vendedor
      } = req.body;

      if (!zapatillaId || !tituloZapatilla || !comprador || !vendedor) {
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
          chatId: chatExistente._id.toString(),
          message: 'Chat existente'
        });
      }

      const nuevoChat = {
        zapatillaId,
        tituloZapatilla,
        fotoUrl: fotoUrl || "",
        comprador,
        vendedor,
        ultimoMensaje: "",
        actualizadoEn: new Date(),
        creadoEn: new Date()
      };

      const result = await db.collection("chats").insertOne(nuevoChat);

      return res.status(201).json({
        success: true,
        chatId: result.insertedId.toString(),
        message: 'Chat creado correctamente'
      });
    }

    // 2) Obtener chats del usuario
    if (action === "getUserChats") {
      const { username } = req.body;

      if (!username) {
        return res.status(400).json({
          success: false,
          message: 'Falta el username'
        });
      }

      const chats = await db.collection("chats")
        .find({
          $or: [
            { comprador: username },
            { vendedor: username }
          ]
        })
        .sort({ actualizadoEn: -1 })
        .toArray();

      const chatsFormateados = chats.map(chat => ({
        ...chat,
        _id: chat._id.toString()
      }));

      return res.status(200).json({
        success: true,
        chats: chatsFormateados
      });
    }

    // 3) Obtener mensajes de un chat
    if (action === "getMessages") {
      const { chatId } = req.body;

      if (!chatId) {
        return res.status(400).json({
          success: false,
          message: 'Falta el chatId'
        });
      }

      const mensajes = await db.collection("mensajes")
        .find({ chatId })
        .sort({ fecha: 1 })
        .toArray();

      const mensajesFormateados = mensajes.map(mensaje => ({
        ...mensaje,
        _id: mensaje._id.toString()
      }));

      return res.status(200).json({
        success: true,
        mensajes: mensajesFormateados
      });
    }

    // 4) Enviar mensaje
    if (action === "sendMessage") {
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