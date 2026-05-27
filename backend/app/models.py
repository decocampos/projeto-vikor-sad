from typing import Literal

from pydantic import BaseModel, Field


class CriterionInput(BaseModel):
    code: str
    name: str | None = None
    weight: float = Field(gt=0)
    type: Literal["benefit", "cost"] = "benefit"


class VikorRequest(BaseModel):
    alternatives: list[str] = Field(min_length=2)
    criteria: list[CriterionInput] = Field(min_length=1)
    scores: dict[str, dict[str, float]]
    v: float = Field(default=0.5, ge=0, le=1)


class VikorResult(BaseModel):
    alternative: str
    rank: int
    s: float
    r: float
    q: float


class VikorResponse(BaseModel):
    v: float
    results: list[VikorResult]
    ranking: list[str]
    acceptable_advantage: bool
    acceptable_stability: bool
    acceptable_advantage_threshold: float
    weights_sum_after_normalization: float
