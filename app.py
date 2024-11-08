from flask import Flask, request, jsonify, send_file
import cv2
import numpy as np
import matplotlib.pyplot as plt
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from io import BytesIO
from PIL import Image
from insightface.app import FaceAnalysis
from insightface.data import get_image as ins_get_image
from insightface.model_zoo import get_model  # Importar el modelo directamente
import base64

app = Flask(__name__)
CORS(app)

face_app = FaceAnalysis(name='buffalo_l')
face_app.prepare(ctx_id=0, det_size=(640, 640))

@app.route('/detect-faces', methods=['POST'])
def detect_faces():
    file = request.files['image']
    img = Image.open(file.stream).convert("RGB")
    img = np.array(img)

    # Detectar rostros
    faces = face_app.get(img)
    face_data = []
    
    # Extraer la posición y vista previa de cada rostro
    for i, face in enumerate(faces):
        bbox = face['bbox']
        bbox = [int(b) for b in bbox]
        face_img = img[bbox[1]:bbox[3], bbox[0]:bbox[2]]
        
        # Codificar la imagen en base64 para que sea compatible con JSON
        _, buffer = cv2.imencode('.png', face_img)
        face_preview = base64.b64encode(buffer).decode('utf-8')  # Convertir bytes a base64 string

        face_data.append({
            "id": i,
            "bbox": bbox,
            "preview": face_preview
        })

    return jsonify(face_data)

# Ruta para detectar caras en la imagen de destino
@app.route('/detect-faces-target', methods=['POST'])
def detect_faces_target():
    if 'target_image' not in request.files:
        return jsonify({"error": "Se requiere una imagen de destino para detectar caras."}), 400

    target_file = request.files['target_image']
    img = Image.open(target_file.stream).convert("RGB")
    img = np.array(img)

    # Detectar rostros
    faces = face_app.get(img)
    face_data = []
    
    # Extraer la posición y vista previa de cada rostro
    for i, face in enumerate(faces):
        bbox = face['bbox']
        bbox = [int(b) for b in bbox]
        face_img = img[bbox[1]:bbox[3], bbox[0]:bbox[2]]
        
        # Codificar la imagen en base64 para que sea compatible con JSON
        _, buffer = cv2.imencode('.png', face_img)
        face_preview = base64.b64encode(buffer).decode('utf-8')  # Convertir bytes a base64 string

        face_data.append({
            "id": i,
            "bbox": bbox,
            "preview": face_preview
        })

    return jsonify(face_data)

# Ruta para hacer el Face Swap en una cara específica de la imagen de destino
@app.route('/swap-face', methods=['POST'])
def swap_face():
    if 'image' not in request.files:
        return jsonify({"error": "Se requiere una imagen de origen para el intercambio de caras."}), 400

    selected_face_id = request.form.get('selected_face_id')
    target_face_id = request.form.get('target_face_id')

    if selected_face_id is None:
        return jsonify({"error": "Debes seleccionar una cara de origen para realizar el intercambio."}), 400

    selected_face_id = int(selected_face_id)

    file = request.files['image']
    img = Image.open(file.stream).convert("RGB")
    img = np.array(img)
    faces = face_app.get(img)

    # Validar que el ID de cara seleccionado esté dentro del rango de caras detectadas
    if selected_face_id >= len(faces):
        return jsonify({"error": "El ID de cara de origen no es válido."}), 400

    selected_face = faces[selected_face_id]

    # Cargar y detectar caras en la imagen de destino
    target_file = request.files['target_image']
    target_img = Image.open(target_file.stream).convert("RGB")
    target_img = np.array(target_img)
    target_faces = face_app.get(target_img)

    # Cargar el modelo de Face Swapper
    swapper = get_model('inswapper_128.onnx')

    # Aplicar el Face Swap: si no se proporciona `target_face_id`, intercambia en todas las caras detectadas
    if target_face_id is None:
        # Reemplaza en todas las caras detectadas en la imagen de destino
        for face in target_faces:
            target_img = swapper.get(target_img, face, selected_face, paste_back=True)
    else:
        # Solo intercambia en la cara seleccionada en la imagen de destino
        target_face_id = int(target_face_id)
        if target_face_id >= len(target_faces):
            return jsonify({"error": "El ID de cara de destino no es válido."}), 400
        target_face = target_faces[target_face_id]
        target_img = swapper.get(target_img, target_face, selected_face, paste_back=True)

    # Convertir la imagen a formato adecuado para enviar al frontend
    target_img = Image.fromarray(target_img)
    buffered = BytesIO()
    target_img.save(buffered, format="PNG")
    buffered.seek(0)

    return send_file(buffered, mimetype="image/png")

if __name__ == '__main__':
    app.run(debug=True)
