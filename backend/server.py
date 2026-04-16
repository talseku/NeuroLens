# working server to go on pi
import asyncio
import os
import websockets
import json
import cv2
import numpy as np
from picamera2 import Picamera2

EMOTIONS = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']

print("Loading model weights...")
WEIGHTS_FILE = 'emotion_weights.npy'
weights = np.load(os.path.join(os.path.dirname(__file__), WEIGHTS_FILE), allow_pickle=True).item()

# Retrieve weights list [kernel, bias] or [gamma, beta, mean, var] for a layer by partial name match
def get_weights(layer_name):
    for k, v in weights.items():
        if layer_name in k:
            return v
    return None

def relu(x):
    return np.maximum(0, x)

def softmax(x):
    e_x = np.exp(x - np.max(x))
    return e_x / e_x.sum()

def batch_norm(x, w):
    gamma, beta, mean, var = w
    return gamma * (x - mean) / np.sqrt(var + 1e-5) + beta

def conv2d(x, w):
    kernel, bias = w
    from numpy.lib.stride_tricks import sliding_window_view
    kh, kw, cin, cout = kernel.shape
    h, w_dim, _ = x.shape
    pad = kh // 2
    x_pad = np.pad(x, ((pad,pad),(pad,pad),(0,0)))
    out = np.zeros((h, w_dim, cout))
    for i in range(cout):
        for j in range(cin):
            k = kernel[:,:,j,i]
            windows = sliding_window_view(x_pad[:,:,j], (kh,kw))
            out[:,:,i] += np.sum(windows * k, axis=(-2,-1))
        out[:,:,i] += bias[i]
    return out

def maxpool2d(x):
    h, w, c = x.shape
    nh, nw = h//2, w//2
    out = np.zeros((nh, nw, c))
    for i in range(nh):
        for j in range(nw):
            out[i,j,:] = np.max(x[i*2:i*2+2, j*2:j*2+2, :], axis=(0,1))
    return out

def predict(img):
    x = img.astype(np.float32) / 255.0
    x = x[:,:,np.newaxis]

    x = conv2d(x, get_weights('conv2d'))
    x = batch_norm(x, get_weights('batch_normalization'))
    x = relu(x)
    x = maxpool2d(x)

    x = conv2d(x, get_weights('conv2d_1'))
    x = batch_norm(x, get_weights('batch_normalization_1'))
    x = relu(x)
    x = maxpool2d(x)

    x = conv2d(x, get_weights('conv2d_2'))
    x = batch_norm(x, get_weights('batch_normalization_2'))
    x = relu(x)
    x = maxpool2d(x)

    x = x.flatten()
    w, b = get_weights('dense')
    x = relu(np.dot(x, w) + b)
    w, b = get_weights('dense_1')
    x = softmax(np.dot(x, w) + b)
    return x


connected_clients = set()
picam2 = Picamera2()
# cap = cv2.VideoCapture(0)

def detect_emotions(frame_bgr):
    small = cv2.resize(frame_bgr, (320, 240))
    gray_small = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
    face_cascade = cv2.CascadeClassifier(os.path.join(os.path.dirname(__file__), 'haarcascade_frontalface_default.xml'))
    faces = face_cascade.detectMultiScale(gray_small, 1.1, 5, minSize=(24,24))
    results = []
    gray_full = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
    for (x, y, w, h) in faces:
        x, y, w, h = x*2, y*2, w*2, h*2  # scale coords back to 640x480

        pad = int(0.2 * w)
        x1, y1 = max(x-pad, 0), max(y-pad, 0)
        x2, y2 = min(x+w+pad, 640), min(y+h+pad, 480)
        face_img = gray_full[y1:y2, x1:x2]

        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        face_img = clahe.apply(face_img)
        face_img = cv2.resize(face_img, (48, 48))
        probs = predict(face_img)
        dominant = EMOTIONS[np.argmax(probs)]
        results.append({
            "emotion": dominant,
            "scores": {EMOTIONS[i]: round(float(probs[i])*100, 1) for i in range(7)},
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
        # ret, frame_bgr = cap.read()
        # if not ret:
        #     await asyncio.sleep(0.1)
        #     continue
        faces = await loop.run_in_executor(None, detect_emotions, frame_bgr)
        payload = json.dumps({"faces": faces})
        await broadcast(payload)
        if faces:
            print(payload)
        await asyncio.sleep(0.25)

async def main():
    print("Testing model...")
    test = np.random.randint(0, 255, (48, 48), dtype=np.uint8)
    result = predict(test)
    print(f"Model OK - output shape: {result.shape}")

    config = picam2.create_preview_configuration(
        main={"size": (640, 480), "format": "RGB888"},
        controls={"AeEnable": True, "AwbEnable": True}
    )
    picam2.configure(config)
    picam2.start()
    # cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    # cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    print("Camera started.")
    print("WebSocket server running on ws://0.0.0.0:8765")
    async with websockets.serve(handler, "0.0.0.0", 8765):
        await detection_loop()

asyncio.run(main())