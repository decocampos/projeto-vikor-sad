from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.data import ARTICLE_CASE
from app.vikor import calculate_vikor


def test_generic_vikor_ranking():
    response = calculate_vikor(
        alternatives=["A1", "A2", "A3"],
        criteria=[
            {"code": "cost", "weight": 0.4, "type": "cost"},
            {"code": "quality", "weight": 0.6, "type": "benefit"},
        ],
        scores={
            "A1": {"cost": 100, "quality": 70},
            "A2": {"cost": 120, "quality": 90},
            "A3": {"cost": 80, "quality": 75},
        },
        v=0.5,
    )

    assert response["ranking"][0] == "A2"
    assert response["weights_sum_after_normalization"] == 1


def test_article_case_reference_ranking():
    assert ARTICLE_CASE["vikor"]["ranking"] == ["X4", "X1", "X3", "X2"]
    assert ARTICLE_CASE["published_results"][0]["alternative"] == "X4"


if __name__ == "__main__":
    test_generic_vikor_ranking()
    test_article_case_reference_ranking()
    print("backend tests passed")
