import os
from groq import Groq
from dotenv import load_dotenv
import json

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

SYSTEM_PROMPT = """You are an AI assistant for Nistula, a luxury villa hospitality brand in Assagao, North Goa.
You help draft professional, warm, and personalized replies to guest messages.

Nistula offers private pool villas, chef on call, caretaker always available, complete freedom and privacy.

Your replies should be warm but professional, specific, action-oriented, and concise (under 150 words).

Always respond in JSON format:
{
  "reply": "your drafted reply here",
  "confidence": 0.0 to 1.0,
  "intent": "enquiry|complaint|booking|compliment|cancellation|other",
  "sentiment": "positive|neutral|negative",
  "reasoning": "brief explanation of confidence score"
}

Confidence rules:
- 0.9+ : Standard enquiry, clear context
- 0.7-0.9: Mostly clear, some ambiguity
- 0.5-0.7: Complex, human should review
- Below 0.5: Complaint or sensitive, needs human"""

async def generate_reply(guest_message: str, guest_context: dict = None) -> dict:
    context_str = ""
    if guest_context:
        context_str = f"""
Guest Context:
- Name: {guest_context.get('name', 'Unknown')}
- Channel: {guest_context.get('channel', 'Unknown')}
- Previous stays: {guest_context.get('total_stays', 0)}
- Is repeat guest: {guest_context.get('is_repeat', False)}
"""
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"{context_str}\nGuest message: {guest_message}"}
            ],
            temperature=0.7,
            max_tokens=500
        )
        raw = response.choices[0].message.content.strip()
        if "```json" in raw:
            raw = raw.split("```json")[1].split("```")[0].strip()
        elif "```" in raw:
            raw = raw.split("```")[1].split("```")[0].strip()
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"reply": response.choices[0].message.content, "confidence": 0.5, "intent": "other", "sentiment": "neutral", "reasoning": "Could not parse"}
    except Exception as e:
        return {"reply": "I apologize, having trouble processing this right now.", "confidence": 0.0, "intent": "other", "sentiment": "neutral", "reasoning": str(e)}

async def analyze_conversation(messages: list) -> dict:
    conversation_text = "\n".join([f"{m['direction'].upper()}: {m['content']}" for m in messages])
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": """Analyze this hospitality conversation and return JSON only:
{
  "overall_sentiment": "positive|neutral|negative",
  "key_issues": ["issue1"],
  "conversion_likelihood": 0.0 to 1.0,
  "recommended_action": "brief action",
  "drop_off_risk": "high|medium|low"
}"""},
                {"role": "user", "content": conversation_text}
            ],
            max_tokens=300
        )
        raw = response.choices[0].message.content.strip()
        if "```json" in raw:
            raw = raw.split("```json")[1].split("```")[0].strip()
        return json.loads(raw)
    except:
        return {"overall_sentiment": "neutral", "key_issues": [], "conversion_likelihood": 0.5, "recommended_action": "Review manually", "drop_off_risk": "medium"}
