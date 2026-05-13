from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.database import get_db, Message, Guest, Booking, ConversationSignal

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/dashboard")
async def get_dashboard(db: Session = Depends(get_db)):
    total_guests = db.query(Guest).count()
    total_messages = db.query(Message).count()
    pending_replies = db.query(Message).filter(Message.direction == "inbound", Message.is_sent == False).count()
    needs_review = db.query(Message).filter(Message.direction == "inbound", Message.confidence_score < 0.6, Message.is_sent == False).count()
    channel_data = db.query(Message.channel, func.count(Message.id)).filter(Message.direction == "inbound").group_by(Message.channel).all()
    intent_data = db.query(Message.intent, func.count(Message.id)).filter(Message.intent != None).group_by(Message.intent).all()
    sentiment_data = db.query(Message.sentiment, func.count(Message.id)).filter(Message.sentiment != None).group_by(Message.sentiment).all()
    avg_confidence = db.query(func.avg(Message.confidence_score)).filter(Message.confidence_score != None).scalar()
    total_outbound = db.query(Message).filter(Message.direction == "outbound").count()
    agent_edited = db.query(Message).filter(Message.direction == "outbound", Message.agent_edited == True).count()
    complaints = db.query(ConversationSignal).filter(ConversationSignal.signal_type == "complaint").count()
    return {"overview": {"total_guests": total_guests, "total_messages": total_messages, "pending_replies": pending_replies, "needs_human_review": needs_review, "avg_ai_confidence": round(avg_confidence or 0, 2), "total_complaints": complaints, "agent_edit_rate": round((agent_edited / total_outbound * 100) if total_outbound > 0 else 0, 1)}, "channels": [{"channel": c[0], "count": c[1]} for c in channel_data], "intents": [{"intent": i[0], "count": i[1]} for i in intent_data], "sentiments": [{"sentiment": s[0], "count": s[1]} for s in sentiment_data]}
