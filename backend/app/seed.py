from app.models.database import SessionLocal, Guest, Message, Booking, create_tables
from datetime import datetime, timedelta
import random

def seed():
    create_tables()
    db = SessionLocal()
    guests_data = [
        {"name": "Arjun Mehta", "email": "arjun@gmail.com", "phone": "+91 98765 43210", "channel": "airbnb", "total_stays": 3, "total_spent": 45000, "is_repeat": True, "sentiment_score": 0.85},
        {"name": "Priya Sharma", "email": "priya@gmail.com", "phone": "+91 87654 32109", "channel": "booking.com", "total_stays": 1, "total_spent": 12000, "is_repeat": False, "sentiment_score": 0.5},
        {"name": "Rahul Kapoor", "email": "rahul@gmail.com", "phone": "+91 76543 21098", "channel": "whatsapp", "total_stays": 0, "total_spent": 0, "is_repeat": False, "sentiment_score": 0.6},
        {"name": "Sarah Johnson", "email": "sarah@gmail.com", "phone": "+1 555 0123", "channel": "instagram", "total_stays": 2, "total_spent": 38000, "is_repeat": True, "sentiment_score": 0.9},
        {"name": "Vikram Singh", "email": "vikram@gmail.com", "phone": "+91 65432 10987", "channel": "makemytrip", "total_stays": 1, "total_spent": 15000, "is_repeat": False, "sentiment_score": 0.3},
    ]
    guests = []
    for g in guests_data:
        existing = db.query(Guest).filter(Guest.email == g["email"]).first()
        if not existing:
            guest = Guest(**g)
            db.add(guest)
            db.commit()
            db.refresh(guest)
            guests.append(guest)
        else:
            guests.append(existing)
    messages_data = [
        (guests[0], "airbnb", "Hi! I'd like to book your villa for 4 nights from June 15th. Is it available? We're a family of 4.", 0.92, "enquiry", "positive"),
        (guests[1], "booking.com", "Hello, we checked in today but the pool area isn't clean. There are leaves everywhere and the water looks green. Can someone fix this?", 0.35, "complaint", "negative"),
        (guests[2], "whatsapp", "Hey I saw your property on Instagram, looks amazing! What's the price for a weekend in July?", 0.88, "enquiry", "positive"),
        (guests[3], "instagram", "We had the most incredible stay last month! The chef was absolutely brilliant. Already planning our next visit!", 0.95, "compliment", "positive"),
        (guests[4], "makemytrip", "I booked 3 nights but I need to cancel. The dates don't work anymore. What's your cancellation policy?", 0.45, "cancellation", "negative"),
    ]
    for guest, channel, content, confidence, intent, sentiment in messages_data:
        existing = db.query(Message).filter(Message.guest_id == guest.id, Message.direction == "inbound").first()
        if not existing:
            msg = Message(guest_id=guest.id, channel=channel, direction="inbound", content=content, confidence_score=confidence, intent=intent, sentiment=sentiment, ai_draft=f"Thank you for reaching out to Nistula! [AI draft for: {intent}]", created_at=datetime.utcnow() - timedelta(minutes=random.randint(5, 120)))
            db.add(msg)
    db.commit()
    db.close()
    print("Seed data loaded successfully")

if __name__ == "__main__":
    seed()
