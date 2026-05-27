from math import isfinite


class VikorInputError(ValueError):
    """Raised when a VIKOR request cannot be calculated."""


def normalize_weights(criteria):
    total = sum(item["weight"] for item in criteria)
    if total <= 0:
        raise VikorInputError("At least one criterion must have a positive weight.")

    return [
        {
            **item,
            "weight": item["weight"] / total,
            "type": item.get("type", "benefit"),
        }
        for item in criteria
    ]


def calculate_vikor(alternatives, criteria, scores, v=0.5):
    if not 0 <= v <= 1:
        raise VikorInputError("The VIKOR parameter v must be between 0 and 1.")
    if len(alternatives) < 2:
        raise VikorInputError("At least two alternatives are required.")
    if not criteria:
        raise VikorInputError("At least one criterion is required.")

    normalized_criteria = normalize_weights(criteria)
    terms_by_alternative = {alternative: [] for alternative in alternatives}

    for criterion in normalized_criteria:
        code = criterion["code"]
        criterion_type = criterion.get("type", "benefit")
        values = []

        for alternative in alternatives:
            try:
                value = float(scores[alternative][code])
            except KeyError as exc:
                raise VikorInputError(f"Missing score for {alternative}/{code}.") from exc
            if not isfinite(value):
                raise VikorInputError(f"Score for {alternative}/{code} must be finite.")
            values.append(value)

        best = max(values) if criterion_type == "benefit" else min(values)
        worst = min(values) if criterion_type == "benefit" else max(values)
        denominator = abs(best - worst)

        for alternative, value in zip(alternatives, values):
            if denominator == 0:
                regret_term = 0
            elif criterion_type == "benefit":
                regret_term = criterion["weight"] * (best - value) / denominator
            else:
                regret_term = criterion["weight"] * (value - best) / denominator
            terms_by_alternative[alternative].append(regret_term)

    s_values = {
        alternative: sum(terms)
        for alternative, terms in terms_by_alternative.items()
    }
    r_values = {
        alternative: max(terms) if terms else 0
        for alternative, terms in terms_by_alternative.items()
    }

    s_min, s_max = min(s_values.values()), max(s_values.values())
    r_min, r_max = min(r_values.values()), max(r_values.values())

    results = []
    for alternative in alternatives:
        s_component = 0 if s_max == s_min else (s_values[alternative] - s_min) / (s_max - s_min)
        r_component = 0 if r_max == r_min else (r_values[alternative] - r_min) / (r_max - r_min)
        q_value = v * s_component + (1 - v) * r_component
        results.append(
            {
                "alternative": alternative,
                "s": round(s_values[alternative], 6),
                "r": round(r_values[alternative], 6),
                "q": round(q_value, 6),
            }
        )

    ranked = sorted(results, key=lambda item: (item["q"], item["s"], item["r"], item["alternative"]))
    for index, item in enumerate(ranked, start=1):
        item["rank"] = index

    threshold = 1 / (len(alternatives) - 1)
    acceptable_advantage = False
    if len(ranked) > 1:
        acceptable_advantage = (ranked[1]["q"] - ranked[0]["q"]) >= threshold

    best = ranked[0]["alternative"]
    best_by_s = min(s_values, key=s_values.get)
    best_by_r = min(r_values, key=r_values.get)

    return {
        "v": v,
        "results": ranked,
        "ranking": [item["alternative"] for item in ranked],
        "acceptable_advantage": acceptable_advantage,
        "acceptable_stability": best in {best_by_s, best_by_r},
        "acceptable_advantage_threshold": round(threshold, 6),
        "weights_sum_after_normalization": round(sum(item["weight"] for item in normalized_criteria), 6),
    }
