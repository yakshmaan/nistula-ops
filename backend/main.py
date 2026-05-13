from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.models.database import create_tables
from app.routes import messages, guests, analytics

app = FastAPI(title="Nistula Ops API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(messages.router)
app.include_router(guests.router)
app.include_router(analytics.router)

@app.on_event("startup")
async def startup():
    create_tables()

@app.get("/")
async def root():
    return {"status": "Nistula Ops API running", "version": "1.0.0"}
