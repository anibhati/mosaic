from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from agents import data_agent, news_agent, quant_agent, writer_agent
import os

load_dotenv()

app = FastAPI(title="Mosaic API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ResearchRequest(BaseModel):
    ticker: str

@app.get("/")
def root():
    return {"message": "Mosaic API is running"}

@app.post("/research")
def run_research(request: ResearchRequest):
    ticker = request.ticker.upper().strip()
    
    # Run all agents in sequence
    data = data_agent(ticker)
    news = news_agent(ticker, data["company_name"])
    analysis = quant_agent(data)
    report = writer_agent(ticker, data, news, analysis)
    
    return {
        "ticker": ticker,
        "company_name": data["company_name"],
        "current_price": data["current_price"],
        "analyst_rating": data["analyst_rating"],
        "overall": analysis["overall"],
        "data": data,
        "analysis": analysis,
        "report": report
    }