from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Float, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

SQLALCHEMY_DATABASE_URL = "sqlite:///./nistula.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class Guest(Base):
    __tablename__ = "guests"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True, nullable=True)
    phone = Column(String, nullable=True)
    channel = Column(String)
    total_stays = Column(Integer, default=0)
    total_spent = Column(Float, default=0.0)
    sentiment_score = Column(Float, default=0.5)
    is_repeat = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    messages = relationship("Message", back_populates="guest")
    bookings = relationship("Booking", back_populates="guest")

class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    guest_id = Column(Integer, ForeignKey("guests.id"))
    channel = Column(String)
    direction = Column(String)
    content = Column(Text)
    ai_draft = Column(Text, nullable=True)
    confidence_score = Column(Float, nullable=True)
    intent = Column(String, nullable=True)
    sentiment = Column(String, nullable=True)
    is_sent = Column(Boolean, default=False)
    agent_edited = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    guest = relationship("Guest", back_populates="messages")

class Booking(Base):
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True, index=True)
    guest_id = Column(Integer, ForeignKey("guests.id"))
    channel = Column(String)
    check_in = Column(DateTime)
    check_out = Column(DateTime)
    nights = Column(Integer)
    amount = Column(Float)
    status = Column(String, default="pending")
    property_name = Column(String, default="Nistula Villa")
    created_at = Column(DateTime, default=datetime.utcnow)
    guest = relationship("Guest", back_populates="bookings")

class ConversationSignal(Base):
    __tablename__ = "conversation_signals"
    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("messages.id"))
    signal_type = Column(String)
    signal_value = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

def create_tables():
    Base.metadata.create_all(bind=engine)
