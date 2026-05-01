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

    def analyze_frame(self, frame_b64: str, settings: dict = None):
        """Analyze a base64 frame for proctoring violations."""
        if settings is None:
            settings = {"sensitivity": "medium", "isGazeEnabled": True}
        
        sens = settings.get("sensitivity", "medium")
        print(f"[AI] Analyzing frame with sensitivity: {sens.upper()}")

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

            # 2. Gaze Tracking (Only if enabled in Admin)
            gaze_status = "centered"
            if settings.get("isGazeEnabled", True) and self.has_mp:
                results_mesh = self.face_mesh.process(rgb_img)
                if results_mesh.multi_face_landmarks:
                    landmarks = results_mesh.multi_face_landmarks[0].landmark
                    left_iris = landmarks[468]
                    right_iris = landmarks[473]
                    avg_iris_x = (left_iris.x + right_iris.x) / 2
                    
                    threshold_margin = 0.04
                    if sens == "high": threshold_margin = 0.01
                    if sens == "low": threshold_margin = 0.15
                    
                    if avg_iris_x < (0.5 - threshold_margin):
                        gaze_status = "looking_left"
                    elif avg_iris_x > (0.5 + threshold_margin):
                        gaze_status = "looking_right"
            elif not settings.get("isGazeEnabled", True):
                gaze_status = "disabled"
            else:
                gaze_status = "centered" if face_count == 1 else "unknown"

            # 3. Object Detection (REQ-15: Cell Phones / Books)
            object_detected = False
            object_label = ""
            if settings.get("isObjectEnabled", True):
                # Heuristic: Check for bright rectangular objects (screens) or phones
                # In a production app, we would use a YOLOv8 model here.
                # For this demo, we check for high-contrast regions near the hands/face
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                blurred = cv2.GaussianBlur(gray, (7, 7), 0)
                thresh = cv2.threshold(blurred, 200, 255, cv2.THRESH_BINARY)[1]
                contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                
                for cnt in contours:
                    area = cv2.contourArea(cnt)
                    if 1000 < area < 10000: # Typical phone size at webcam distance
                        peri = cv2.arcLength(cnt, True)
                        approx = cv2.approxPolyDP(cnt, 0.04 * peri, True)
                        if len(approx) == 4: # Rectangular shape
                            object_detected = True
                            object_label = "Possible Mobile Device"
                            break

            # 4. Decision
            status = "safe"
            alerts = []
            if face_count == 0:
                status = "suspicious"
                alerts.append("No face detected")
            elif face_count > 1:
                status = "suspicious"
                alerts.append("Multiple faces detected")
            
            if gaze_status not in ["centered", "disabled"]:
                status = "suspicious"
                alerts.append(f"Gaze deviation: {gaze_status}")
            
            if object_detected:
                status = "suspicious"
                alerts.append(f"Prohibited Object: {object_label}")

            return {
                "status": status,
                "face_count": face_count,
                "gaze": gaze_status,
                "object_detected": object_detected,
                "alerts": alerts,
                "sensitivity_level": sens,
                "timestamp": time.time()
            }

        except Exception as e:
            return {"error": str(e)}

    def analyze_audio(self, rms_level: float, settings: dict = None):
        """Check if audio level exceeds threshold."""
        if settings is None:
            settings = {"sensitivity": "medium", "isAudioEnabled": True}
            
        if not settings.get("isAudioEnabled", True):
            return {"suspicious": False, "status": "disabled"}
            
        # EXTREME SENSITIVITY LOGIC
        sens = settings.get("sensitivity", "medium")
        THRESHOLD = 40.0
        if sens == "high": THRESHOLD = 15.0 # Extremely strict (even whispers)
        if sens == "low": THRESHOLD = 80.0  # Extremely loose (only shouting)
        
        if rms_level > THRESHOLD:
            return {"suspicious": True, "alert": f"Noise alert ({sens.upper()}: {rms_level:.1f}/{THRESHOLD})"}
        return {"suspicious": False}


