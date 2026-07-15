import os
import json
import re
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

_api_key = os.getenv("GOOGLE_API_KEY", "")
if _api_key:
    genai.configure(api_key=_api_key)

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_FALLBACK_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"]

def _candidate_models() -> list[str]:
    return list(dict.fromkeys([GEMINI_MODEL, *GEMINI_FALLBACK_MODELS]))

def _generate_with_fallback(prompt: str, *, system_instruction: str | None = None) -> str:
    last_error = None
    for model_name in _candidate_models():
        try:
            model = genai.GenerativeModel(
                model_name,
                system_instruction=system_instruction,
            )
            return model.generate_content(prompt).text.strip()
        except Exception as e:
            last_error = e
            print(f"[AI Service] Gemini model {model_name} failed: {e}")
    raise last_error or RuntimeError("No Gemini model available")

def get_ai_suggestion(data: dict) -> dict:
    if not _api_key:
        return _fallback_suggestion(data)
    try:
        rep_qualities = [r.get("quality", "?") for r in data.get("rep_log", [])]
        allowed_exercises = _allowed_exercises(data.get("joint_label", ""))
        prompt = f"""You are an expert rehabilitation AI assistant helping physiotherapists.

Patient session data:
- Joint: {data['joint_label']}
- Exercise: {data['exercise_name']}
- Total Reps: {data['total_reps']}
- Correct Reps: {data['good_reps']}
- Partial Reps: {data['warn_reps']}
- Incorrect Reps: {data['bad_reps']}
- Accuracy: {data['accuracy']}%
- Average Movement Score: {data['avg_score']}
- Rep quality sequence: {rep_qualities}
- Allowed next exercises for this joint: {allowed_exercises}

Based on this rehabilitation session data, provide:
1. Specific, actionable form feedback for this patient (2-3 sentences)
2. Exactly 3 improvement tips tailored to the data
3. Next exercise recommendation with precise rep and set counts based on performance. The next_exercise value must be one of the allowed next exercises above.
4. Whether to increase/maintain/decrease difficulty

Return ONLY valid JSON (no markdown, no code blocks):
{{
  "form_feedback": "Specific feedback paragraph here",
  "tips": ["Tip 1", "Tip 2", "Tip 3"],
  "next_exercise": "Exercise name",
  "next_reps": 12,
  "next_sets": 3,
  "difficulty_adjustment": "maintain"
}}"""

        text = _generate_with_fallback(prompt)
        # Strip markdown code blocks if present
        text = re.sub(r"```json\s*", "", text)
        text = re.sub(r"```\s*", "", text)
        result = json.loads(text)
        # Ensure all fields present
        result.setdefault("tips", [])
        result.setdefault("next_reps", 12)
        result.setdefault("next_sets", 3)
        result.setdefault("difficulty_adjustment", "maintain")
        if result.get("next_exercise") not in allowed_exercises:
            result["next_exercise"] = allowed_exercises[0]
        return result
    except Exception as e:
        print(f"[AI Service] Gemini error: {e}")
        return _fallback_suggestion(data)

def _fallback_suggestion(data: dict) -> dict:
    acc = data.get("accuracy", 0)
    joint = data.get("joint_label", "the joint")
    exercise = data.get("exercise_name", "this exercise")
    good = data.get("good_reps", 0)
    total = data.get("total_reps", 1) or 1

    if acc >= 80:
        feedback = (
            f"Excellent work on {exercise} for {joint}! You achieved {good}/{total} correct reps "
            f"with {acc:.0f}% accuracy. Your form is consistent — consider progressing the difficulty."
        )
        tips = [
            "Maintain current tempo for neuromuscular control.",
            "Focus on full end-range activation at peak contraction.",
            "Add a 2-second hold at the end position to build strength."
        ]
        next_reps, next_sets = data.get("total_reps", 12) + 2, 3
        adj = "increase"
    elif acc >= 50:
        feedback = (
            f"Good effort on {exercise} for {joint}. You completed {good}/{total} correct reps. "
            "Focus on achieving full range of motion before adding more resistance."
        )
        tips = [
            "Slow down the movement to ensure full range.",
            "Check alignment in a mirror or with your therapist.",
            "Perform a warm-up set at 50% effort before your working sets."
        ]
        next_reps, next_sets = data.get("total_reps", 12), 3
        adj = "maintain"
    else:
        feedback = (
            f"Your {exercise} session for {joint} shows room for improvement ({acc:.0f}% accuracy). "
            "Consider reducing the range slightly and focusing on form quality over quantity."
        )
        tips = [
            "Reduce range of motion until form is consistent.",
            "Pause and breathe before each rep.",
            "Consult your physiotherapist about pain or discomfort."
        ]
        next_reps, next_sets = max(data.get("total_reps", 12) - 2, 5), 2
        adj = "decrease"

    return {
        "form_feedback": feedback,
        "tips": tips,
        "next_exercise": exercise if exercise in _allowed_exercises(joint) else _allowed_exercises(joint)[0],
        "next_reps": next_reps,
        "next_sets": next_sets,
        "difficulty_adjustment": adj,
    }

def _allowed_exercises(joint_label: str) -> list[str]:
    label = (joint_label or "").lower()
    if "knee" in label:
        return ["Seated Knee Extension", "Heel Slides"]
    if "elbow" in label:
        return ["Elbow Flexion Curls", "Elbow Extension"]
    if "wrist" in label:
        return ["Wrist Flexion and Extension", "Wrist Extension Lifts"]
    if "ankle" in label:
        return ["Ankle Pumps", "Toe Raises"]
    return ["Seated Knee Extension", "Heel Slides"]

def _clean_chat_history(history: list) -> list:
    cleaned = []
    expected = "user"
    for item in history or []:
        role = item.get("role")
        parts = item.get("parts") or []
        text = " ".join(str(p.get("text", "")).strip() for p in parts if isinstance(p, dict)).strip()
        if role not in {"user", "model"} or not text:
            continue
        if role != expected:
            continue
        cleaned.append({"role": role, "parts": [{"text": text}]})
        expected = "model" if expected == "user" else "user"
    return cleaned

def _fallback_chat_response(message: str) -> str:
    msg = message.lower()
    if "elbow" in msg:
        return (
            "For an elbow injury, start gently and avoid painful loading. Try pain-free elbow flexion curls and elbow extension movements: 1-2 sets of 8-10 slow reps, stopping if pain increases. "
            "Use ice for swelling, keep the wrist and shoulder relaxed, and avoid lifting heavy objects until a physiotherapist checks the injury. Seek medical care urgently if you have deformity, severe swelling, numbness, or cannot move the elbow."
        )
    return (
        "Start with gentle, pain-free range-of-motion work and avoid exercises that increase pain. Tell me which joint is injured, when it happened, and what movements hurt, and I can suggest safer RehabSense exercises. "
        "Please consult a physiotherapist or doctor for a personal diagnosis."
    )

def _plain_text_reply(text: str) -> str:
    text = re.sub(r"\*\*(.*?)\*\*", r"\1", text)
    text = re.sub(r"^\s*#{1,6}\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"^\s*[-*]\s+", "- ", text, flags=re.MULTILINE)
    return text.strip()

def get_chat_response(message: str, history: list) -> str:
    """Multi-turn chat for exercise recommendations."""
    if not _api_key:
        return _fallback_chat_response(message)
    try:
        system_instruction = (
            "You are RehabSense AI, a friendly rehabilitation exercise advisor. "
            "Help patients understand their condition, suggest appropriate simple "
            "physiotherapy exercises that can be monitored with MediaPipe Pose where possible. "
            "For elbows, prefer elbow flexion curls and elbow extension. For knees, prefer seated knee extension and heel slides. "
            "For wrists, prefer wrist flexion and extension or wrist extension lifts. For ankles, prefer ankle pumps and toe raises. "
            "Be concise, safe, and empathetic. Always tell users to consult a physiotherapist or doctor for personalised medical advice. "
            "Use plain text, no markdown headers."
        )
        cleaned_history = _clean_chat_history(history)
        last_error = None
        for model_name in _candidate_models():
            try:
                model = genai.GenerativeModel(model_name, system_instruction=system_instruction)
                chat = model.start_chat(history=cleaned_history)
                response = chat.send_message(message)
                return _plain_text_reply(response.text)
            except Exception as e:
                last_error = e
                print(f"[AI Chat] Gemini model {model_name} failed: {e}")
        raise last_error or RuntimeError("No Gemini chat model available")
    except Exception as e:
        print(f"[AI Chat] Error: {e}")
        return _fallback_chat_response(message)
