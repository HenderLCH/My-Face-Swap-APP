import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Container, Row, Col, Button, Form, Card, Alert, Image } from 'react-bootstrap';

function ImageUpload() {
    const [image, setImage] = useState(null);
    const [targetImage, setTargetImage] = useState(null);
    const [faces, setFaces] = useState([]);
    const [targetFaces, setTargetFaces] = useState([]);
    const [selectedFaceId, setSelectedFaceId] = useState(null);
    const [targetFaceId, setTargetFaceId] = useState(null);
    const [processedImage, setProcessedImage] = useState(null);

    const imageInputRef = useRef(null);
    const targetImageInputRef = useRef(null);

    const handleImageChange = (e) => {
        setImage(e.target.files[0]);
        setFaces([]);
        setSelectedFaceId(null);
        setProcessedImage(null);
    };

    const handleTargetImageChange = (e) => {
        setTargetImage(e.target.files[0]);
        setTargetFaces([]);
        setTargetFaceId(null);
    };

    const handleDetectFaces = async () => {
        const formData = new FormData();
        formData.append("image", image);

        try {
            const response = await axios.post("http://localhost:5000/detect-faces", formData);
            setFaces(response.data);
        } catch (error) {
            console.error("Error detecting faces", error);
        }
    };

    const handleDetectTargetFaces = async () => {
        const formData = new FormData();
        formData.append("target_image", targetImage);

        try {
            const response = await axios.post("http://localhost:5000/detect-faces-target", formData);
            setTargetFaces(response.data);
        } catch (error) {
            console.error("Error detecting target faces", error);
        }
    };

    const handleFaceSelection = (id) => {
        setSelectedFaceId(id);
    };

    const handleTargetFaceSelection = (id) => {
        if (targetFaceId === id) {
            setTargetFaceId(null);
        } else {
            setTargetFaceId(id);
        }
    };

    const handleFaceSwap = async () => {
        if (selectedFaceId === null) {
            alert("Debes seleccionar una cara de origen para realizar el intercambio.");
            return;
        }

        const formData = new FormData();
        formData.append("image", image);
        formData.append("selected_face_id", selectedFaceId);

        if (targetImage) {
            formData.append("target_image", targetImage);
        }

        if (targetFaceId !== null) {
            formData.append("target_face_id", targetFaceId);
        }

        try {
            const response = await axios.post("http://localhost:5000/swap-face", formData, {
                responseType: 'blob'
            });
            const imgURL = URL.createObjectURL(response.data);
            setProcessedImage(imgURL);
        } catch (error) {
            console.error("Error swapping face", error);
        }
    };

    const handleReset = () => {
        setImage(null);
        setTargetImage(null);
        setFaces([]);
        setTargetFaces([]);
        setSelectedFaceId(null);
        setTargetFaceId(null);
        setProcessedImage(null);

        if (imageInputRef.current) imageInputRef.current.value = "";
        if (targetImageInputRef.current) targetImageInputRef.current.value = "";
    };

    return (
        <Container className="mt-5">
            <h1 className="text-center mb-5">Face Swap App</h1>

            <Card className="p-4 mb-4">
                <Row className="justify-content-center">
                    <Col md={5} className="text-center">
                        <Form.Group controlId="formFile" className="mb-3">
                            <Form.Label><strong>Selecciona la imagen de origen</strong></Form.Label>
                            <Form.Control type="file" onChange={handleImageChange} ref={imageInputRef} />
                        </Form.Group>
                        <Button variant="primary" onClick={handleDetectFaces} disabled={!image} className="mb-3">
                            Detectar caras en la imagen de origen
                        </Button>
                    </Col>
                    <Col md={5} className="text-center">
                        <Form.Group controlId="formFileTarget" className="mb-3">
                            <Form.Label><strong>Imagen de destino (opcional)</strong></Form.Label>
                            <Form.Control type="file" onChange={handleTargetImageChange} ref={targetImageInputRef} />
                        </Form.Group>
                        <Button variant="secondary" onClick={handleDetectTargetFaces} disabled={!targetImage} className="mb-3">
                            Detectar caras en la imagen de destino
                        </Button>
                    </Col>
                </Row>
            </Card>

            <Row>
                <Col md={6} className="text-center">
                    <h4>Caras de la Imagen de Origen</h4>
                    <Row className="justify-content-center mb-4">
                        {faces.length > 0 ? (
                            faces.map((face, index) => (
                                <Col xs={4} key={index} className="mb-3">
                                    <Card
                                        onClick={() => handleFaceSelection(face.id)}
                                        style={{
                                            cursor: 'pointer',
                                            border: selectedFaceId === face.id ? '3px solid red' : '1px solid #ddd'
                                        }}
                                    >
                                        <Card.Img variant="top" src={`data:image/png;base64,${face.preview}`} />
                                    </Card>
                                </Col>
                            ))
                        ) : (
                            <Alert variant="info" className="text-center w-75 mx-auto">
                                No se han detectado caras en la imagen de origen.
                            </Alert>
                        )}
                    </Row>
                </Col>

                <Col md={6} className="text-center">
                    <h4>Caras de la Imagen de Destino</h4>
                    <Row className="justify-content-center mb-4">
                        {targetFaces.length > 0 ? (
                            targetFaces.map((face, index) => (
                                <Col xs={4} key={index} className="mb-3">
                                    <Card
                                        onClick={() => handleTargetFaceSelection(face.id)}
                                        style={{
                                            cursor: 'pointer',
                                            border: targetFaceId === face.id ? '3px solid blue' : '1px solid #ddd'
                                        }}
                                    >
                                        <Card.Img variant="top" src={`data:image/png;base64,${face.preview}`} />
                                    </Card>
                                </Col>
                            ))
                        ) : (
                            <Alert variant="info" className="text-center w-75 mx-auto">
                                No se han detectado caras en la imagen de destino.
                            </Alert>
                        )}
                    </Row>
                </Col>
            </Row>

            <div className="text-center my-4">
                <Button variant="success" onClick={handleFaceSwap} disabled={selectedFaceId === null} className="me-3">
                    Intercambiar cara
                </Button>
                <Button variant="danger" onClick={handleReset}>
                    Resetear
                </Button>
            </div>

            {processedImage && (
                <Row className="justify-content-center">
                    <Col md={8}>
                        <Card className="p-3">
                            <h4 className="text-center">Imagen Procesada</h4>
                            <Image src={processedImage} alt="Processed" fluid rounded />
                        </Card>
                    </Col>
                </Row>
            )}
        </Container>
    );
}

export default ImageUpload;
