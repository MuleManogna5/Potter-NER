from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import spacy
import uvicorn

app = FastAPI(title="NER API")

# Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load spaCy model
try:
    nlp = spacy.load("en_core_web_sm")
except Exception:
    raise RuntimeError("Run: python -m spacy download en_core_web_sm")

class PredictIn(BaseModel):
    text: str
    tokens: Optional[List[str]] = None
    domain: Optional[str] = None

@app.post("/predict")
async def predict(payload: PredictIn):
    text = (payload.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")

    doc = nlp(text)
    entities = [
        {"start": ent.start_char, "end": ent.end_char, "label": ent.label_, "text": ent.text}
        for ent in doc.ents
    ]
    tokens = payload.tokens if payload.tokens else [t.text for t in doc]

    return {"text": text, "entities": entities, "tokens": tokens, "domain": payload.domain or ""}

@app.get("/health")
def health():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
