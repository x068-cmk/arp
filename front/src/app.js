// src/app.js
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cloudinary = require('cloudinary').v2;
require('dotenv').config({ path: path.join(__dirname, '..', '.env') }); 

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de Cloudinary
// Cloudinary ahora leerá directamente de las variables de entorno
cloudinary.config({
    secure: true
});

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Conectado a la base de datos de MongoDB'))
    .catch(err => console.error('Error de conexión a la base de datos:', err));

// Middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Rutas de la API
const postRoutes = require('./routes/postRoutes'); 

// Usar una ruta dinámica para todos los foros
app.use('/api/posts', postRoutes);

// Ruta para servir los archivos HTML desde la raíz
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});