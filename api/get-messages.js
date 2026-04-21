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

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Solo se permite GET'
    });
  }

  try {
    const client = await clientPromise;
    const db = client.db("tienda_zapatillas");

    const { chatId } = req.query;

    if (!chatId) {
      return res.status(400).json({
        success: false,
        message: 'Falta el chatId'
      });
    }

    const mensajes = await db.collection("mensajes")
      .find({ chatId: chatId })
      .sort({ fecha: 1 })
      .toArray();

    return res.status(200).json({
      success: true,
      mensajes
    });

  } catch (e) {
    console.error(e);
    return res.status(500).json({
      success: false,
      message: 'Error interno: ' + e.message
    });
  }
}