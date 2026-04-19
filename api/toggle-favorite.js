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

  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, message: 'Solo se permite PUT' });
  }

  try {
    const client = await clientPromise;
    const db = client.db("tienda_zapatillas");

    const { username, shoeId } = req.body;

    if (!username || shoeId === undefined || shoeId === null) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos'
      });
    }

    const user = await db.collection("users").findOne({ username });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const favoritos = Array.isArray(user.favoritos) ? user.favoritos : [];
    const shoeIdNumber = Number(shoeId);
    const yaExiste = favoritos.includes(shoeIdNumber);

    let update;

    if (yaExiste) {
      update = { $pull: { favoritos: shoeIdNumber } };
    } else {
      update = { $addToSet: { favoritos: shoeIdNumber } };
    }

    await db.collection("users").updateOne(
      { username },
      update
    );

    return res.status(200).json({
      success: true,
      message: yaExiste ? 'Favorito eliminado' : 'Favorito añadido',
      isFavorite: !yaExiste
    });

  } catch (e) {
    console.error(e);
    return res.status(500).json({
      success: false,
      message: 'Error interno: ' + e.message
    });
  }
}