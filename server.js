// Este es un ejemplo de backend en Node.js usando Express para manejar la subida de archivos.
// Necesitas instalar las dependencias: npm install express multer

// Importamos los módulos necesarios
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Configuración del almacenamiento para Multer
// Esto le dice a Multer dónde y cómo guardar los archivos
const storage = multer.diskStorage({
    // La carpeta de destino para las subidas
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'public', 'imagenes', 'uploads');
        // Aseguramos que la carpeta de subidas exista
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    // El nombre del archivo en el servidor
    filename: (req, file, cb) => {
        // Usamos el nombre original del archivo y le agregamos un timestamp para evitar colisiones
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Inicializamos Multer con la configuración de almacenamiento
const upload = multer({ storage: storage });

// Middleware para servir archivos estáticos (como tus imágenes subidas)
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para manejar CORS (Cross-Origin Resource Sharing)
// Esto es necesario para que el frontend pueda hacer peticiones al backend
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Permite peticiones desde cualquier origen
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// El endpoint para la subida de la imagen
// 'image' debe coincidir con el 'name' del input de tipo 'file' en el frontend
app.post('/upload-image', upload.single('image'), (req, res) => {
    if (!req.file) {
        // Si no se recibió ningún archivo, enviamos un error
        return res.status(400).json({ error: 'No se subió ningún archivo.' });
    }

    // El objeto 'req.file' contiene toda la información del archivo subido
    console.log('Archivo recibido:', req.file);

    // Creamos la URL de la imagen para enviarla de vuelta al frontend
    // Nota: La URL es relativa a la carpeta 'public'
    const imageUrl = `/imagenes/uploads/${req.file.filename}`;

    // Enviamos una respuesta JSON con la URL de la imagen
    res.status(200).json({
        message: 'Imagen subida con éxito!',
        imageUrl: imageUrl
    });
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor de backend escuchando en http://localhost:${port}`);
    console.log('Para subir imágenes, asegúrate de que el frontend apunte a la URL correcta.');
});
