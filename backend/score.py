import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

def score_perplexity(text: str) -> dict:
    client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

    prompt = f"""You are an expert at detecting AI-generated text by analyzing word choice predictability and linguistic fingerprints.

Your task is to assign a PERPLEXITY SCORE from 0.0 to 1.0, where:
- 0.0 = very unpredictable, human-like word choices
- 1.0 = highly predictable, AI-like word choices

---

WHAT TO MEASURE:

AI text characteristics (push score toward 1.0):
- Generic transition filler: "It is important to note", "Furthermore", "Moreover", "In conclusion", "It is worth mentioning", "Additionally", "It is essential"
- Buzzword stacking: "paradigm", "transformative", "holistic", "stakeholders", "synergy", "leverage", "multifaceted", "nuanced"
- Abstract claims that apply to any topic without modification: "various sectors", "numerous benefits", "responsible deployment", "wide range of implications"
- Perfectly hedged, risk-free sentences with no personal stake or opinion
- No typos, no contractions in informal contexts, no informal phrasing, no personality
- Evenly spaced "points" that feel like a structured outline rendered as prose

Human text characteristics (push score toward 0.0):
- Typos, informal punctuation (?, !, ...), contractions, slang
- Specific personal details: places, names, prices, dates, personal reactions
- Idiosyncratic or unexpected phrasing ("WAY too much", "honestly?", "unless someone drags me", "nah")
- References to first-hand experience only the writer would know
- Casual hedges: "like", "kind of", "I guess", "sort of", "I think"
- Sentences that trail naturally rather than concluding with a tidy summary

---

SCORING GUIDE (use these as anchors):

0.00–0.15: Clear human voice — casual, personal, specific, irregular. Typos or informal markers present.
0.16–0.35: Mostly human — polished or formal in places but grounded in a real perspective or specific context.
0.36–0.55: Ambiguous — mix of personal markers and generic AI-style phrasing. Neither clearly wins.
0.56–0.75: Leans AI — abstract and generic language dominates, but one or two human markers present (e.g., an "I" statement followed by generic content).
0.76–1.00: Strong AI signal — abstract, hedged, generic, transition-heavy, no personal voice or specific detail.

---

IMPORTANT EDGE CASE RULES:
- Formal human writing (academic papers, economics, legal) can be precise and impersonal — look for DOMAIN-SPECIFIC precision vs. generic AI abstraction. "Central banks face a fundamental tension" is specific; "stakeholders must collaborate" is generic.
- A text that opens with one personal sentence then fills the rest with generic content is still mostly AI.
- Judge the MAJORITY pattern, not the strongest or weakest sentence.
- Do NOT penalize correct grammar or formal vocabulary — only flag patterns that are structurally generic.

---

OUTPUT FORMAT (JSON only, no other text):
{{
  "score": <float 0.0–1.0>,
  "reasoning": "2–3 sentences citing specific phrases or patterns observed in the text"
}}

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

def score_burstiness(text: str) -> dict:
    client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

    prompt = f"""You are an expert at detecting AI-generated text by analyzing writing rhythm and structural variation.

Your task is to assign a BURSTINESS SCORE from 0.0 to 1.0, where:
- 0.0 = high structural variation, human-like rhythm
- 1.0 = low structural variation, AI-like uniformity

---

WHAT TO MEASURE:

1. SENTENCE LENGTH VARIATION (most important signal)
   - Estimate the word count of each sentence.
   - Human writing: dramatic swings — a 3-word sentence next to a 30-word sentence is normal.
   - AI writing: consistently medium-length sentences (roughly 12–22 words each) with little deviation.
   - Score toward 0.0 if the range is wide (e.g., shortest is 3 words, longest is 35+).
   - Score toward 1.0 if all sentences cluster tightly in the same length band.

2. SENTENCE OPENING VARIETY
   - Human writing: openings vary (questions, fragments, "And", "But", "So", mid-thought jumps).
   - AI writing: repetitive openers ("It is...", "This is...", "There are...", subject-verb patterns with no variation).
   - Score toward 0.0 for unpredictable, varied starters; 1.0 for formulaic repetition.

3. RHYTHM AND CADENCE
   - Read the text mentally. Does it feel metronomic (AI) or like natural speech with starts and stops (human)?
   - Human markers: run-on thoughts, mid-sentence corrections, casual digressions.
   - AI markers: smooth, even flow from point to point — no tangents, no roughness.

4. PARAGRAPH STRUCTURE
   - Human: paragraphs vary in length — some are a single sentence, some sprawl.
   - AI: paragraphs tend to have similar sentence counts and similar internal structure (intro → point → close).

---

SCORING GUIDE (use these as anchors):

0.00–0.15: Very bursty — dramatic sentence length swings, irregular rhythm, feels like real speech.
0.16–0.35: Mostly varied — some patterns but clear human irregularity dominates.
0.36–0.55: Mixed — moderate variation alongside some uniform sections.
0.56–0.75: Mostly uniform — repetitive rhythm, similar sentence sizes throughout.
0.76–1.00: Highly uniform — metronomic cadence, near-identical sentence structure across the text.

---

IMPORTANT EDGE CASE RULES:
- Academic or professional writing may use formal style but still show WIDE sentence length variation — prioritize length variance above style.
- Short texts (under 4 sentences) have limited signal; default to 0.45–0.55 unless variation is extreme.
- Do NOT judge topic, quality, grammar, or meaning — ONLY rhythm and structural variation.

---

OUTPUT FORMAT (JSON only, no other text):
{{
  "score": <float 0.0–1.0>,
  "reasoning": "2–3 sentences with specific observations about sentence length range and rhythm"
}}

TEXT:
{text}"""

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0.1,
    )

    result = json.loads(response.choices[0].message.content)
    print(result["reasoning"])

    return {
        "score": float(result["score"]),
        "reason": result["reasoning"],
    }
