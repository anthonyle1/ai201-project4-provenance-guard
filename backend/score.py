import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

def score_perplexity(text: str) -> dict:
    client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

    prompt = f"""Analyze the following text and estimate how likely it is to be AI-generated versus human-written.

You are NOT evaluating writing quality. Do NOT judge correctness, grammar, or vocabulary richness as indicators of human vs AI.

You are ONLY evaluating structural and stylistic signals of generation style.

---

STEP 1: CLASSIFY THE TEXT
First classify the text into ONE category:
- HUMAN
- MIXED
- AI

Definitions:

HUMAN:
- personal voice or perspective
- informal or irregular phrasing
- natural inconsistency in style or flow
- specific lived or situational detail

MIXED:
- partially polished or edited human writing
- formal but still grounded in perspective or context
- combination of natural and generic phrasing

AI:
- generic, abstract, or encyclopedic statements
- evenly structured sentences with no personal voice
- “list of benefits / definitions / explanations” style
- can be applied broadly to many topics without specificity

---

STEP 2: ASSIGN SCORE (STRICT MAPPING)

Map classification to score:

HUMAN → 0.0 to 0.30
MIXED → 0.30 to 0.69
AI → 0.70 to 1.00


DO NOT default to 0.2 or 0.3 unless truly uncertain.

---

IMPORTANT RULES:
- Do NOT treat grammar correctness as evidence of AI writing.
- Do NOT treat vocabulary diversity as evidence of human writing.
- Focus only on abstraction level, specificity, and presence of personal voice.
- If uncertain, choose MIXED and avoid extreme scores.

---

OUTPUT FORMAT (JSON ONLY):

  "score": float 0.0–1.0,
  "reasoning": "Brief explanation referencing abstraction level, specificity, and voice"


---

TEXT:
{text}"""

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0.1,
    )

    result = json.loads(response.choices[0].message.content)
    return {
        "score": float(result["score"]),
        "reason": result["reasoning"],
    }