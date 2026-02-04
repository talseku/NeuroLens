import cv2
import sys
import os

# Load OpenCV's pre-trained face detection model
def load_face_detector():
    return cv2.CascadeClassifier(
        cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    )

# Load and image and verify
def load_image(image_path):
    image = cv2.imread(image_path)
    if image is None:
        print(f"ERROR: Could not load image at '{image_path}'")
        sys.exit(1)
    return image


# Locate faces and return boundaries
def detect_faces(image, face_detector):
    gray_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    faces = face_detector.detectMultiScale(
        gray_image,
        scaleFactor=1.1,
        minNeighbors=5
    )
    return faces

# Draw rectangles around detected faces
def draw_face_boxes(image, faces):
    for (x, y, width, height) in faces:
        top_left = (x, y)
        bottom_right = (x + width, y + height)
        cv2.rectangle(image, top_left, bottom_right, (255, 0, 0), 2)

# Crop and save each detected face
def save_face_crops(image, faces, output_dir="detected_faces"):
    os.makedirs(output_dir, exist_ok=True)

    for i, (x, y, width, height) in enumerate(faces):
        face_crop = image[y:y + height, x:x + width]
        filename = os.path.join(output_dir, f"face_{i}.jpg")
        cv2.imwrite(filename, face_crop)

# Display image
def display_image(window_name, image):
    cv2.imshow(window_name, image)
    cv2.waitKey(0)
    cv2.destroyAllWindows()


def main():
    image_path = "squad.jpg"

    face_detector = load_face_detector()
    image = load_image(image_path)

    faces = detect_faces(image, face_detector)
    draw_face_boxes(image, faces)
    display_image("Detected Faces", image)
    save_face_crops(image, faces)


if __name__ == "__main__":
    main()