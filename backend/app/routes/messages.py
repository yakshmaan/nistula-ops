from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.database import get_db, Message, Guest, ConversationSignal
from app.services.ai_service import generate_reply, analyze_conversation

router = APIRouter(prefix="/messages", tags=["messages"])

class InboundMessage(BaseModel):
    guest_name: str
    channel: str
    content: str
    email: Optional[str] = None
    phone: Optional[str] = None

class SendMessage(BaseModel):
    message_id: int
    final_content: str
    agent_edited: bool = False

@router.post("/inbound")
async def receive_message(msg: InboundMessage, db: Session = Depends(get_db)):
    guest = None
    if msg.email:
        guest = db.query(Guest).filter(Guest.email == msg.email).first()
    if not guest:
        guest = db.query(Guest).filter(Guest.name == msg.guest_name, Guest.channel == msg.channel).first()
    if not guest:
        guest = Guest(name=msg.guest_name, email=msg.email, phone=msg.phone, channel=msg.channel)
        db.add(guest)
        db.commit()
        db.refresh(guest)
    message = Message(guest_id=guest.id, channel=msg.channel, direction="inbound", content=msg.content)
    db.add(message)
    db.commit()
    db.refresh(message)
    guest_context = {"name": guest.name, "channel": guest.channel, "total_stays": guest.total_stays, "is_repeat": guest.is_repeat}
    ai_result = await generate_reply(msg.content, guest_context)
    message.ai_draft = ai_result.get("reply")
    message.confidence_score = ai_result.get("confidence")
    message.intent = ai_result.get("intent")
    message.sentiment = ai_result.get("sentiment")
    db.commit()
    db.refresh(message)
    if ai_result.get("intent") == "complaint":
        db.add(ConversationSignal(message_id=message.id, signal_type="complaint", signal_value=msg.content[:200]))
    sentiment_map = {"positive": 0.8, "neutral": 0.5, "negative": 0.2}
    guest.sentiment_score = sentiment_map.get(ai_result.get("sentiment", "neutral"), 0.5)
    db.commit()
    return {"message_id": message.id, "guest_id": guest.id, "guest_name": guest.name, "ai_draft": message.ai_draft, "confidence_score": message.confidence_score, "intent": message.intent, "sentiment": message.sentiment, "needs_human_review": message.confidence_score < 0.6}

@router.post("/send")
async def send_message(payload: SendMessage, db: Session = Depends(get_db)):
    message = db.query(Message).filter(Message.id == payload.message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    outbound = Message(guest_id=message.guest_id, channel=message.channel, direction="outbound", content=payload.final_content, is_sent=True, agent_edited=payload.agent_edited)
    db.add(outbound)
    if payload.agent_edited:
        db.add(ConversationSignal(message_id=message.id, signal_type="agent_edit", signal_value=payload.final_content[:200]))
    db.commit()
    return {"status": "sent", "message_id": outbound.id}

@router.get("/inbox")
async def get_inbox(db: Session = Depends(get_db)):
    messages = db.query(Message).filter(Message.direction == "inbound", Message.is_sent == False).order_by(Message.created_at.desc()).all()
    result = []
    for m in messages:
        guest = db.query(Guest).filter(Guest.id == m.guest_id).first()
        result.append({"id": m.id, "guest_name": guest.name if guest else "Unknown", "guest_id": m.guest_id, "channel": m.channel, "content": m.content, "ai_draft": m.ai_draft, "confidence_score": m.confidence_score, "intent": m.intent, "sentiment": m.sentiment, "needs_human_review": (m.confidence_score or 0) < 0.6, "created_at": m.created_at.isoformat()})
    return result

@router.get("/guest/{guest_id}/conversation")
async def get_conversation(guest_id: int, db: Session = Depends(get_db)):
    messages = db.query(Message).filter(Message.guest_id == guest_id).order_by(Message.created_at.asc()).all()
    msgs_list = [{"direction": m.direction, "content": m.content, "created_at": m.created_at.isoformat()} for m in messages]
    analysis = {}
    if len(msgs_list) > 1:
        analysis = await analyze_conversation(msgs_list)
    return {"messages": msgs_list, "analysis": analysis}
