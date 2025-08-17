// src/models/Post.js

const mongoose = require('mongoose');

// Define el esquema para los comentarios
const CommentSchema = new mongoose.Schema({
    author: {
        type: String,
        required: true,
        default: 'Anónimo'
    },
    text: {
        type: String,
        required: true,
        trim: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

// Define el esquema principal del Post
const PostSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
        trim: true
    },
    author: {
        type: String,
        required: true,
        default: 'Anónimo'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    imageUrl: {
        type: String,
        required: false
    },
    // Campo para guardar los comentarios del post
    comments: [CommentSchema]
});

module.exports = mongoose.model('Post', PostSchema);
