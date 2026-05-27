from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .data import ARTICLE_CASE
from .models import VikorRequest, VikorResponse
from .vikor import VikorInputError, calculate_vikor

app = FastAPI(
    title="VIKOR SAD API",
    description="API for a VIKOR decision-support MVP based on a published MCDA article.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/api/article-case")
def get_article_case():
    return ARTICLE_CASE


@app.post("/api/vikor", response_model=VikorResponse)
def run_vikor(payload: VikorRequest):
    criteria = [item.model_dump() for item in payload.criteria]
    try:
        return calculate_vikor(
            alternatives=payload.alternatives,
            criteria=criteria,
            scores=payload.scores,
            v=payload.v,
        )
    except VikorInputError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
