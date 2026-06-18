from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from agents import data_agent, news_agent, quant_agent, writer_agent
import json
import os

load_dotenv()

app = FastAPI(title="Mosaic API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_origin_regex=r"https://.*\.vercel\.app",
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

    def generate():
        yield f"data: {json.dumps({'agent': 'data', 'status': 'running', 'message': 'Fetching financial data...'})}\n\n"
        data = data_agent(ticker)
        company = data["company_name"]
        yield f"data: {json.dumps({'agent': 'data', 'status': 'done', 'message': 'Loaded data for ' + company})}\n\n"

        yield f"data: {json.dumps({'agent': 'news', 'status': 'running', 'message': 'Searching recent news...'})}\n\n"
        news = news_agent(ticker, data["company_name"])
        article_count = len(news["recent_news"])
        yield f"data: {json.dumps({'agent': 'news', 'status': 'done', 'message': 'Found ' + str(article_count) + ' articles'})}\n\n"

        yield f"data: {json.dumps({'agent': 'quant', 'status': 'running', 'message': 'Running quantitative analysis...'})}\n\n"
        analysis = quant_agent(data)
        overall = analysis["overall"]
        yield f"data: {json.dumps({'agent': 'quant', 'status': 'done', 'message': 'Analysis complete — ' + overall})}\n\n"

        yield f"data: {json.dumps({'agent': 'writer', 'status': 'running', 'message': 'Generating research report...'})}\n\n"
        report = writer_agent(ticker, data, news, analysis)
        yield f"data: {json.dumps({'agent': 'writer', 'status': 'done', 'message': 'Report complete'})}\n\n"

        result = {
            'ticker': ticker,
            'company_name': data['company_name'],
            'current_price': data['current_price'],
            'analyst_rating': data['analyst_rating'],
            'overall': analysis['overall'],
            'data': data,
            'analysis': analysis,
            'report': report
        }
        yield f"data: {json.dumps({'agent': 'complete', 'status': 'done', 'result': result})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
