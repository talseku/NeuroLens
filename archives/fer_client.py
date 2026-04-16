import asyncio
import websockets
import json
import cv2
import numpy as np
from picamera2 import Picamera2


# FER+ emotion labels
EMOTIONS = ["neutral", "happiness", "surprise", "sadness",
            "anger", "disgust", "fear", "contempt"]


# Load models
print("Loading models...")
face_cascade = cv2.CascadeClassifier('/home/neurolens/emotion/haarcascade_frontalface_default.xml')
emotion_net = cv2.dnn.readNetFromONNX('/home/neurolens/emotion/emotion-ferplus-8.onnx')
print("Models loaded.")


# Camera setup
picam2 = Picamera2()
config = picam2.create_preview_configuration(
    main={"size": (640, 480), "format": "RGB888"},
    controls={"AeEnable": True, "AwbEnable": True}
)
picam2.configure(config)
picam2.start()
print("Camera started.")


connected_clients = set()


def softmax(x):
    e_x = np.exp(x - np.max(x))
    return e_x / e_x.sum()


def detect_emotions(frame_bgr):
    gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(
        gray, scaleFactor=1.1, minNeighbors=5, minSize=(48, 48)
    )


    results = []
    for (x, y, w, h) in faces:
        # Add padding around face for better context
        pad = int(0.2 * w)
        x1 = max(x - pad, 0)
        y1 = max(y - pad, 0)
        x2 = min(x + w + pad, frame_bgr.shape[1])
        y2 = min(y + h + pad, frame_bgr.shape[0])
        face_gray = gray[y1:y2, x1:x2]


        # CLAHE equalization to improve contrast
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        face_gray = clahe.apply(face_gray)


        resized = cv2.resize(face_gray, (64, 64))
        normalized = (resized.astype(np.float32) / 128.0) - 1.0
        blob = cv2.dnn.blobFromImage(normalized, size=(64, 64))


        emotion_net.setInput(blob)
        scores = emotion_net.forward()[0]
        probs = softmax(scores)
        dominant = EMOTIONS[np.argmax(probs)]


        results.append({
            "emotion": dominant,
            "scores": {EMOTIONS[i]: round(float(probs[i]) * 100, 1) for i in range(len(EMOTIONS))},
            "region": {"x": int(x), "y": int(y), "w": int(w), "h": int(h)}
        })
    return results


async def broadcast(message):
    if connected_clients:
        await asyncio.gather(*[c.send(message) for c in connected_clients])


async def handler(websocket):
    connected_clients.add(websocket)
    print(f"Client connected: {websocket.remote_address}")
    try:
        await websocket.wait_closed()
    finally:
        connected_clients.discard(websocket)
        print("Client disconnected.")


async def detection_loop():
    loop = asyncio.get_event_loop()
    while True:
        frame = picam2.capture_array()
        frame_bgr = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)


        faces = await loop.run_in_executor(None, detect_emotions, frame_bgr)
        payload = json.dumps({"faces": faces})
        await broadcast(payload)


        if faces:
            print(payload)


        await asyncio.sleep(0.25)  # 4 FPS


async def main():
    print("WebSocket server running on ws://0.0.0.0:8765")
    async with websockets.serve(handler, "0.0.0.0", 8765):
        await detection_loop()


asyncio.run(main())
