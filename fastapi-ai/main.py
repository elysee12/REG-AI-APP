from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import base64
import numpy as np
import cv2
from deepface import DeepFace
import os
from typing import List, Optional

app = FastAPI()

@app.get("/")
async def root():
    return {"status": "GRIDGuard AI Service Running", "port": 8001}

class ImageRequest(BaseModel):
    image: str  # Base64 encoded image

class CompareRequest(BaseModel):
    incidentToken: List[float]
    technicianTokens: List[dict]  # List of {"token": [...], "id": "..."}

@app.post("/generate-face-token")
async def generate_face_token(request: ImageRequest):
    try:
        print(f"Received request to generate face token. Image length: {len(request.image)}")
        
        # Decode base64 image
        if "," in request.image:
            header, encoded = request.image.split(",", 1)
        else:
            encoded = request.image
            
        data = base64.b64decode(encoded)
        
        # Save temp image
        temp_filename = f"temp_{os.getpid()}.jpg"
        with open(temp_filename, "wb") as f:
            f.write(data)
        
        print(f"Temporary image saved: {temp_filename}")
        
        # Generate embedding using DeepFace
        # We use VGG-Face as it's stable and common
        try:
            embeddings = DeepFace.represent(
                img_path=temp_filename, 
                model_name="VGG-Face", 
                enforce_detection=True,
                detector_backend='opencv' # More robust for general use
            )
            print(f"DeepFace processing complete. Embeddings found: {len(embeddings) if embeddings else 0}")
        except Exception as df_error:
            print(f"DeepFace error: {str(df_error)}")
            if "Face could not be detected" in str(df_error):
                raise HTTPException(status_code=400, detail="No face detected. Please ensure your face is clearly visible and well-lit.")
            raise df_error
        
        # Cleanup
        if os.path.exists(temp_filename):
            os.remove(temp_filename)
            
        if not embeddings:
            raise HTTPException(status_code=400, detail="No face detected in image")
            
        return {"faceToken": embeddings[0]["embedding"]}
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"General error in generate_face_token: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/compare-faces")
async def compare_faces(request: CompareRequest):
    try:
        incident_embedding = np.array(request.incidentToken)
        
        best_match_id = None
        min_distance = 1.0  # Threshold for VGG-Face cosine distance is usually around 0.4
        threshold = 0.4
        
        for tech in request.technicianTokens:
            if not tech.get("token"):
                continue
                
            tech_embedding = np.array(tech["token"])
            
            # Calculate cosine distance
            dot_product = np.dot(incident_embedding, tech_embedding)
            norm_a = np.linalg.norm(incident_embedding)
            norm_b = np.linalg.norm(tech_embedding)
            cosine_similarity = dot_product / (norm_a * norm_b)
            distance = 1 - cosine_similarity
            
            if distance < min_distance:
                min_distance = distance
                if distance < threshold:
                    best_match_id = tech.get("id")
        
        if best_match_id:
            return {"match": True, "technicianId": best_match_id, "distance": float(min_distance)}
        else:
            return {"match": False, "distance": float(min_distance)}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
