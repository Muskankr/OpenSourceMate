# Skill-to-Issue Matching: Baseline Experiment Findings

## Objective

Compare two baseline approaches for matching developer profiles to open-source issues:

1. Keyword overlap
2. TF-IDF with cosine similarity

The experiment uses four handmade developer profiles and eight sample issues.

## Evaluation

Both approaches were evaluated using the same manually assigned relevance labels.

| Metric | Keyword overlap | TF-IDF cosine |
|---|---:|---:|
| Average Precision@3 | 0.667 | 0.667 |
| Average MRR | 1.000 | 1.000 |

## Observations

- Both approaches achieved identical results on this dataset.
- Both ranked a relevant issue first for every developer profile.
- Both returned two relevant issues in the top three for each profile.
- TF-IDF provides term-weighted similarity, while keyword overlap is simpler to interpret.

## Recommendation

Implement keyword overlap as the first baseline because it is easier to understand and implement.

This recommendation is based on implementation simplicity, not superior measured accuracy. TF-IDF achieved the same evaluation metrics and remains a useful comparison baseline.

## Limitations

- The dataset contains only four profiles and eight issues.
- Relevance labels were assigned manually.
- Results may not generalize to real GitHub issues.
- Neither baseline reliably understands technical context or synonyms.
- Larger datasets with independently reviewed relevance labels are needed for meaningful performance comparisons.

## Reproducibility

Install dependencies using:

`pip install -r notebooks/requirements.txt`

Run the notebook:

`notebooks/matching_baselines.ipynb`
