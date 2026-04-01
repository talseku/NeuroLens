import asyncio, websockets
import json, base64
import cv2
# from picamera2 import Picamera2

face_detector = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

def detect_faces(frame):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_detector.detectMultiScale(gray, 1.1, 5)
    
    results = []
    for(x, y, w, h) in faces:
        face_crop = frame[y:y+h, x:x+w]
        _, buffer = cv2.imencode('.jpg', face_crop)
        crop_b64 = base64.b64encode(buffer).decode()
        
        results.append({
            "x": int(x), "y": int(y), 
            "w": int(w), "h": int(h),
            "crop": crop_b64
        })
    
    return results

async def stream_video():
    # when we move to raspberry pi, change to computer's IP
    SERVER_IP = "localhost"
    uri = f"ws://{SERVER_IP}:8765"
    
    # open camera
    print("opening camera")
    cap = cv2.VideoCapture(0)
    
    # check if camera is open
    # NOT opened successfully: print error
    if not cap.isOpened():
        print("ERROR: can not open camera")
        return
    
    # opened successfully: set dimensions of video capture; print opened
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    print("SUCCESS: camera opened")

    #picam = Picamera2()
    #config = picam.create_preview_configuration(main={"size": (640, 480), "format": "RGB888"})
    #picam.configure(config)
    #picam.start()
    
    # connect to websocket    
    try:
        print("connecting to server")
        async with websockets.connect(uri) as websocket:
            print("SUCCESS: connected to server")
            
            while True:
                print("capturing frame")
                ret, frame = cap.read()
                if not ret:
                    print("ERROR: can not capture frame")
                    continue

                #frame = picam.capture_array()
                #frame = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
                
                faces = detect_faces(frame)
                message = json.dumps({
                    "type": "faces",
                    "faces": faces
                })
                await websocket.send(message)                    
                await asyncio.sleep(0.1)

    # add retry?
    except Exception as e:
        print("ERROR: can not connect to server")
        print(f"Details: {e}")
        return
                
    finally:
        print("releasing camera")
        cap.release()
        #picam.stop()
        #picam.close()
        print("SUCCESS: camera released")

if __name__ == "__main__":
    asyncio.run(stream_video())
