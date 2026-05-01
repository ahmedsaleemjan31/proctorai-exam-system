import cv2
import numpy as np
import base64
import time
import math

HAS_MEDIAPIPE = False
try:
    import mediapipe as mp
    # Check if the specific solutions are available
    if hasattr(mp, 'solutions'):
        mp_face_mesh = mp.solutions.face_mesh
        mp_face_detection = mp.solutions.face_detection
        HAS_MEDIAPIPE = True
except Exception as e:
    print(f"MediaPipe load error: {e}. Falling back to OpenCV.")

class AIProctor:
    def __init__(self):
        self.has_mp = HAS_MEDIAPIPE
        if self.has_mp:
            try:
                self.face_mesh = mp_face_mesh.FaceMesh(
                    max_num_faces=3,
                    refine_landmarks=True,
                    min_detection_confidence=0.5,
                    min_tracking_confidence=0.5
                )
                self.face_detection = mp_face_detection.FaceDetection(model_selection=0, min_detection_confidence=0.5)
            except Exception as e:
                print(f"MediaPipe initialization failed: {e}")
                self.has_mp = False
        
        if not self.has_mp:
            # Fallback: Haar Cascades
            self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

    def analyze_frame(self, frame_b64: str):
        """Analyze a base64 frame for proctoring violations."""
        try:
            # Decode image
            if "," in frame_b64:
                _, encoded = frame_b64.split(",", 1)
            else:
                encoded = frame_b64
            
            nparr = np.frombuffer(base64.b64decode(encoded), np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None:
                return {"error": "Invalid image"}

            h, w, _ = img.shape
            rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

            # 1. Face Detection (Count)
            face_count = 0
            if self.has_mp:
                results_detection = self.face_detection.process(rgb_img)
                if results_detection.detections:
                    face_count = len(results_detection.detections)
            else:
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                faces = self.face_cascade.detectMultiScale(gray, 1.1, 4)
                face_count = len(faces)

            # 2. Gaze Tracking & Head Pose
            gaze_status = "centered"
            if self.has_mp:
                results_mesh = self.face_mesh.process(rgb_img)
                if results_mesh.multi_face_landmarks:
                    landmarks = results_mesh.multi_face_landmarks[0].landmark
                    left_iris = landmarks[468]
                    right_iris = landmarks[473]
                    avg_iris_x = (left_iris.x + right_iris.x) / 2
                    if avg_iris_x < 0.45:
                        gaze_status = "looking_left"
                    elif avg_iris_x > 0.55:
                        gaze_status = "looking_right"
            else:
                gaze_status = "unknown (fallback mode)"

            # 3. Decision
            status = "safe"
            alerts = []
            if face_count == 0:
                status = "suspicious"
                alerts.append("No face detected")
            elif face_count > 1:
                status = "suspicious"
                alerts.append("Multiple faces detected")
            
            if gaze_status != "centered":
                status = "suspicious"
                alerts.append(f"Gaze deviation: {gaze_status}")

            return {
                "status": status,
                "face_count": face_count,
                "gaze": gaze_status,
                "alerts": alerts,
                "timestamp": time.time()
            }
        except Exception as e:
            return {"error": str(e)}

    def analyze_audio(self, rms_level: float):
        """Check if audio level exceeds threshold."""
        THRESHOLD = 40.0 # Adjust based on testing
        if rms_level > THRESHOLD:
            return {"suspicious": True, "alert": "High noise level detected"}
        return {"suspicious": False}
