export default function handler(request, response) {
    // 1. Solo permitimos peticiones POST (enviar datos)
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Método no permitido' });
    }

    // 2. Recibimos los datos que envía Android
    const { username, password } = request.body;

    // 3. Simulación de base de datos (luego pondremos MongoDB aquí)
    const usuariosRegistrados = [
        { username: "juan", password: "1234" },
        { username: "maria", password: "abcd" },
        { username: "admin", password: "admin" }
    ];

    // 4. Comprobamos si existe
    const usuarioEncontrado = usuariosRegistrados.find(
        user => user.username === username && user.password === password
    );

    if (usuarioEncontrado) {
        // ÉXITO: Devolvemos un JSON diciendo que todo ok
        return response.status(200).json({ 
            success: true, 
            message: "Login correcto",
            user: usuarioEncontrado.username 
        });
    } else {
        // ERROR: Credenciales malas
        return response.status(401).json({ 
            success: false, 
            message: "Usuario o contraseña incorrectos" 
        });
    }
}