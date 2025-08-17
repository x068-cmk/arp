# Importaciones necesarias para Flask, PyMongo (MongoDB) y CORS
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson.objectid import ObjectId # Para manejar los IDs de MongoDB

app = Flask(__name__)
# Configura CORS para permitir solicitudes desde tu frontend (cualquier origen en este ejemplo)
# En un entorno de producción, deberías restringir esto a la URL específica de tu frontend.
CORS(app) 

# --- Configuración de MongoDB ---
# Reemplaza 'mongodb://localhost:27017/' con la URI de tu instancia de MongoDB
# Si usas MongoDB Atlas, la URI será diferente (ej: 'mongodb+srv://user:password@cluster.mongodb.net/...')
MONGO_URI = 'mongodb://localhost:27017/'
DATABASE_NAME = 'emociones_foro' # Nombre de tu base de datos
COLLECTION_NAME = 'posts' # Nombre de la colección principal para las publicaciones

try:
    # Intenta conectar al cliente de MongoDB
    client = MongoClient(MONGO_URI)
    db = client[DATABASE_NAME]
    posts_collection = db[COLLECTION_NAME]
    print("Conexión a MongoDB establecida con éxito.")
except Exception as e:
    print(f"Error al conectar a MongoDB: {e}")
    # En un entorno real, manejarías este error de forma más robusta,
    # quizás terminando la aplicación o reintentando.

# --- Rutas de la API ---

@app.route('/api/posts', methods=['GET'])
def get_posts():
    """
    Obtiene todas las publicaciones del foro desde MongoDB.
    Las ordena por marca de tiempo de forma descendente (más recientes primero).
    """
    try:
        # Busca todas las publicaciones, las ordena por timestamp y las convierte a lista
        # El .sort([('timestamp', -1)]) ordena de forma descendente.
        posts = list(posts_collection.find().sort([('timestamp', -1)]))
        
        # Para cada publicación, convertimos el ObjectId de MongoDB a un string
        # y también manejamos los comentarios si existen.
        for post in posts:
            post['id'] = str(post['_id'])
            del post['_id'] # Eliminamos el campo _id original de MongoDB
            
            # Si la publicación tiene comentarios, también procesamos sus IDs si es necesario
            if 'comments' in post and isinstance(post['comments'], list):
                for comment in post['comments']:
                    if '_id' in comment:
                        comment['id'] = str(comment['_id'])
                        del comment['_id']
        
        return jsonify(posts), 200
    except Exception as e:
        print(f"Error al obtener publicaciones: {e}")
        return jsonify({"message": "Error interno del servidor al obtener publicaciones"}), 500

@app.route('/api/posts', methods=['POST'])
def create_post():
    """
    Crea una nueva publicación en el foro.
    Requiere que el cuerpo de la solicitud contenga 'content'.
    """
    try:
        data = request.get_json()
        if not data or 'content' not in data:
            return jsonify({"message": "Falta el contenido de la publicación"}), 400

        new_post = {
            "content": data['content'],
            "timestamp": request.json.get('timestamp', None) or datetime.datetime.now(), # Usar el timestamp del cliente o el del servidor
            "comments": [] # Inicializa una lista vacía para los comentarios
        }
        
        # Inserta la nueva publicación en la colección
        result = posts_collection.insert_one(new_post)
        
        # Retorna el ID de la nueva publicación
        return jsonify({"message": "Publicación creada con éxito", "id": str(result.inserted_id)}), 201
    except Exception as e:
        print(f"Error al crear publicación: {e}")
        return jsonify({"message": "Error interno del servidor al crear publicación"}), 500

@app.route('/api/posts/<string:post_id>/comments', methods=['POST'])
def add_comment(post_id):
    """
    Añade un comentario a una publicación específica.
    Requiere que el cuerpo de la solicitud contenga 'content'.
    """
    try:
        data = request.get_json()
        if not data or 'content' not in data:
            return jsonify({"message": "Falta el contenido del comentario"}), 400

        # Crea un nuevo ID para el comentario (opcional, MongoDB lo puede generar)
        # Aquí lo generamos como ObjectId para que sea consistente si luego lo necesitamos
        comment_id = ObjectId() 
        new_comment = {
            "_id": comment_id, # Usamos _id para consistencia con MongoDB
            "content": data['content'],
            "timestamp": request.json.get('timestamp', None) or datetime.datetime.now() # Usar el timestamp del cliente o el del servidor
        }

        # Actualiza la publicación añadiendo el nuevo comentario al array 'comments'
        result = posts_collection.update_one(
            {"_id": ObjectId(post_id)}, # Busca la publicación por su ID de MongoDB
            {"$push": {"comments": new_comment}} # Añade el comentario al array 'comments'
        )

        if result.matched_count == 0:
            return jsonify({"message": "Publicación no encontrada"}), 404

        return jsonify({"message": "Comentario añadido con éxito", "comment_id": str(comment_id)}), 201
    except Exception as e:
        print(f"Error al añadir comentario: {e}")
        return jsonify({"message": "Error interno del servidor al añadir comentario"}), 500

# Añadir importación de datetime para los timestamps
import datetime 

if __name__ == '__main__':
    # Inicia el servidor Flask
    # debug=True es útil para desarrollo (recarga el servidor automáticamente)
    # host='0.0.0.0' hace que el servidor sea accesible desde otras máquinas en la red local
    # port=5000 es el puerto por defecto de Flask
    app.run(debug=True, host='0.0.0.0', port=5000)
