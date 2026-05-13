from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.database import get_db, Guest, Message, Booking

router = APIRouter(prefix="/guests", tags=["guests"])

@router.get("/")
async def get_guests(db: Session = Depends(get_db)):
    guests = db.query(Guest).order_by(Guest.created_at.desc()).all()
    result = []
    for g in guests:
        message_count = db.query(Message).filter(Message.guest_id == g.id).count()
        result.append({"id": g.id, "name": g.name, "email": g.email, "phone": g.phone, "channel": g.channel, "total_stays": g.total_stays, "total_spent": g.total_spent, "sentiment_score": g.sentiment_score, "is_repeat": g.is_repeat, "message_count": message_count, "created_at": g.created_at.isoformat()})
    return result

@router.get("/{guest_id}")
async def get_guest(guest_id: int, db: Session = Depends(get_db)):
    guest = db.query(Guest).filter(Guest.id == guest_id).first()
    if not guest:
        raise HTTPException(status_code=404, detail="Guest not found")
    messages = db.query(Message).filter(Message.guest_id == guest_id).order_by(Message.created_at.desc()).limit(20).all()
    bookings = db.query(Booking).filter(Booking.guest_id == guest_id).all()
    return {"id": guest.id, "name": guest.name, "email": guest.email, "phone": guest.phone, "channel": guest.channel, "total_stays": guest.total_stays, "total_spent": guest.total_spent, "sentiment_score": guest.sentiment_score, "is_repeat": guest.is_repeat, "notes": guest.notes, "messages": [{"id": m.id, "direction": m.direction, "content": m.content, "sentiment": m.sentiment, "created_at": m.created_at.isoformat()} for m in messages], "bookings": [{"id": b.id, "check_in": b.check_in.isoformat(), "check_out": b.check_out.isoformat(), "status": b.status, "amount": b.amount} for b in bookings]}
