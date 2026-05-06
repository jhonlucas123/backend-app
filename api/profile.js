if (action === "updateProfile") {
  const { oldUsername, newUsername, zona, fotoPerfil, newPassword } = req.body;

  if (!oldUsername || !newUsername) {
    return res.status(400).json({
      success: false,
      message: 'Faltan datos'
    });
  }

  if (oldUsername !== newUsername) {
    const existeUsuario = await db.collection("users").findOne({
      username: newUsername
    });

    if (existeUsuario) {
      return res.status(409).json({
        success: false,
        message: 'Ese nombre de usuario ya existe'
      });
    }
  }

  const datosActualizar = {
    username: newUsername,
    zona: zona || ""
  };

  if (fotoPerfil && fotoPerfil.trim() !== "") {
    datosActualizar.fotoPerfil = fotoPerfil;
  }

  // NUEVO: solo actualiza contraseña si el usuario escribe una nueva
  if (newPassword && newPassword.trim() !== "") {
    datosActualizar.password = newPassword.trim();
  }

  await db.collection("users").updateOne(
    { username: oldUsername },
    { $set: datosActualizar }
  );

  await db.collection("zapatillas").updateMany(
    { vendedor: oldUsername },
    { $set: { vendedor: newUsername } }
  );

  await db.collection("chats").updateMany(
    { comprador: oldUsername },
    { $set: { comprador: newUsername } }
  );

  await db.collection("chats").updateMany(
    { vendedor: oldUsername },
    { $set: { vendedor: newUsername } }
  );

  await db.collection("mensajes").updateMany(
    { remitente: oldUsername },
    { $set: { remitente: newUsername } }
  );

  return res.status(200).json({
    success: true,
    message: 'Perfil actualizado correctamente'
  });
}