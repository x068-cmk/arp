// src/routes/postRoutes.js

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Post = require('../models/Post');
const cloudinary = require('cloudinary').v2;
const upload = require('../uploadMiddleware');

// Middleware para seleccionar el modelo correcto
// Esto permite que el mismo código funcione para múltiples foros
router.use('/:collectionName', async (req, res, next) => {
    const { collectionName } = req.params;
    try {
        req.PostModel = mongoose.model(collectionName, Post.schema);
        next();
    } catch (error) {
        // Si el modelo ya existe, lo usamos
        req.PostModel = mongoose.model(collectionName);
        next();
    }
});

// Ruta GET para obtener posts de una colección específica
router.get('/:collectionName', async (req, res) => {
    try {
        const posts = await req.PostModel.find().sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Ruta POST para crear un post (con o sin imagen) en una colección específica
router.post('/:collectionName', upload.single('image'), async (req, res) => {
    const postData = {
        content: req.body.content,
        author: 'Anónimo',
        // Asegúrate de que tu modelo de Mongoose tenga un campo para la fecha
        createdAt: new Date() 
    };

    if (req.file) {
        try {
            const b64 = Buffer.from(req.file.buffer).toString("base64");
            let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
            const result = await cloudinary.uploader.upload(dataURI, {
                folder: 'foro-app' // Opcional, pero recomendado
            });
            postData.imageUrl = result.secure_url;
        } catch (error) {
            console.error("Cloudinary error:", error);
            return res.status(500).json({ message: 'Error al subir la imagen' });
        }
    }

    const post = new req.PostModel(postData);

    try {
        const newPost = await post.save();
        res.status(201).json(newPost);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


// NUEVA RUTA: Ruta POST para agregar un comentario a un post existente
// Espera un POST request a /api/posts/<nombre_del_foro>/<id_del_post>/comment
router.post('/:collectionName/:postId/comment', async (req, res) => {
    try {
        const { collectionName, postId } = req.params;
        const { author, text } = req.body;

        if (!author || !text) {
            return res.status(400).json({ message: 'El autor y el texto del comentario son requeridos.' });
        }

        // Buscamos el post por ID y lo actualizamos
        const updatedPost = await mongoose.model(collectionName).findByIdAndUpdate(
            postId,
            { $push: { comments: { author, text, date: new Date() } } },
            { new: true, runValidators: true } // 'new: true' devuelve el documento actualizado
        );

        if (!updatedPost) {
            return res.status(404).json({ message: 'Post no encontrado.' });
        }

        res.status(200).json(updatedPost);

    } catch (error) {
        console.error('Error al agregar comentario:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});


module.exports = router;
