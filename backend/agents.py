
from dotenv import load_dotenv
load_dotenv()
import yfinance as yf
from typing import Dict
from tavily import TavilyClient
import os
import anthropic
import json

def data_agent(ticker: str) -> Dict:
    """
    Pulls real financial data for a given stock ticker.
    Returns key metrics used by the Quant and Writer agents.
    """
    print(f"[Data Agent] Fetching data for {ticker}...")
    
    stock = yf.Ticker(ticker)
    info = stock.info
    
    # Current price and basic info
    data = {
        "ticker": ticker.upper(),
        "company_name": info.get("longName", "N/A"),
        "sector": info.get("sector", "N/A"),
        "industry": info.get("industry", "N/A"),
        "country": info.get("country", "N/A"),
        "summary": info.get("longBusinessSummary", "N/A"),
        
        # Price data
        "current_price": info.get("currentPrice", "N/A"),
        "52_week_high": info.get("fiftyTwoWeekHigh", "N/A"),
        "52_week_low": info.get("fiftyTwoWeekLow", "N/A"),
        
        # Valuation metrics
        "market_cap": info.get("marketCap", "N/A"),
        "pe_ratio": info.get("trailingPE", "N/A"),
        "forward_pe": info.get("forwardPE", "N/A"),
        "price_to_book": info.get("priceToBook", "N/A"),
        "enterprise_value": info.get("enterpriseValue", "N/A"),
        
        # Financial performance
        "revenue": info.get("totalRevenue", "N/A"),
        "revenue_growth": info.get("revenueGrowth", "N/A"),
        "gross_margins": info.get("grossMargins", "N/A"),
        "profit_margins": info.get("profitMargins", "N/A"),
        "ebitda": info.get("ebitda", "N/A"),
        
        # Balance sheet
        "total_cash": info.get("totalCash", "N/A"),
        "total_debt": info.get("totalDebt", "N/A"),
        "debt_to_equity": info.get("debtToEquity", "N/A"),
        
        # Analyst data
        "analyst_rating": info.get("recommendationKey", "N/A"),
        "target_price": info.get("targetMeanPrice", "N/A"),
        "number_of_analysts": info.get("numberOfAnalystOpinions", "N/A"),
    }
    
    print(f"[Data Agent] Successfully fetched data for {data['company_name']}")
    return data



def news_agent(ticker: str, company_name: str) -> Dict:
    """
    Searches for recent news and analyst opinions about the stock.
    """
    print(f"[News Agent] Searching news for {company_name}...")
    
    client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))
    
    # Search for recent news
    news_results = client.search(
        query=f"{company_name} {ticker} stock news analyst opinion 2025",
        max_results=5,
        search_depth="advanced"
    )
    
    # Search for recent earnings
    earnings_results = client.search(
        query=f"{company_name} earnings revenue quarterly results 2025",
        max_results=3,
        search_depth="advanced"
    )
    
    news = {
        "recent_news": [
            {
                "title": r.get("title"),
                "summary": r.get("content"),
                "url": r.get("url")
            }
            for r in news_results.get("results", [])
        ],
        "earnings_news": [
            {
                "title": r.get("title"),
                "summary": r.get("content"),
                "url": r.get("url")
            }
            for r in earnings_results.get("results", [])
        ]
    }
    
    print(f"[News Agent] Found {len(news['recent_news'])} news articles")
    return news

def quant_agent(data: Dict) -> Dict:
    """
    Analyzes the financial data and produces quantitative insights.
    """
    print(f"[Quant Agent] Analyzing {data['ticker']}...")
    
    analysis = {}
    
    # Valuation assessment
    pe = data.get("pe_ratio")
    if pe != "N/A" and pe:
        if pe < 15:
            analysis["valuation"] = "Undervalued — P/E below market average"
        elif pe < 25:
            analysis["valuation"] = "Fairly valued — P/E in normal range"
        elif pe < 40:
            analysis["valuation"] = "Slightly overvalued — P/E above average"
        else:
            analysis["valuation"] = "Significantly overvalued — high P/E ratio"
    
    # Growth assessment
    revenue_growth = data.get("revenue_growth")
    if revenue_growth != "N/A" and revenue_growth:
        growth_pct = round(revenue_growth * 100, 2)
        if growth_pct > 20:
            analysis["growth"] = f"Strong growth — {growth_pct}% revenue increase"
        elif growth_pct > 10:
            analysis["growth"] = f"Moderate growth — {growth_pct}% revenue increase"
        elif growth_pct > 0:
            analysis["growth"] = f"Slow growth — {growth_pct}% revenue increase"
        else:
            analysis["growth"] = f"Declining revenue — {growth_pct}% change"
    
    # Profitability assessment
    margins = data.get("profit_margins")
    if margins != "N/A" and margins:
        margin_pct = round(margins * 100, 2)
        if margin_pct > 20:
            analysis["profitability"] = f"Highly profitable — {margin_pct}% profit margin"
        elif margin_pct > 10:
            analysis["profitability"] = f"Profitable — {margin_pct}% profit margin"
        elif margin_pct > 0:
            analysis["profitability"] = f"Low margins — {margin_pct}% profit margin"
        else:
            analysis["profitability"] = f"Unprofitable — {margin_pct}% profit margin"
    
    # Debt assessment
    dte = data.get("debt_to_equity")
    if dte != "N/A" and dte:
        if dte < 30:
            analysis["debt"] = f"Low debt risk — D/E ratio of {dte}"
        elif dte < 80:
            analysis["debt"] = f"Moderate debt — D/E ratio of {dte}"
        else:
            analysis["debt"] = f"High debt load — D/E ratio of {dte}"
    
    # Price vs target
    current = data.get("current_price")
    target = data.get("target_price")
    if current != "N/A" and target != "N/A" and current and target:
        upside = round(((target - current) / current) * 100, 2)
        if upside > 0:
            analysis["price_target"] = f"Analyst upside of {upside}% — target ${target}"
        else:
            analysis["price_target"] = f"Analyst downside of {abs(upside)}% — target ${target}"
    
    # Overall recommendation
    bullish_signals = sum([
        1 if "Strong growth" in analysis.get("growth", "") else 0,
        1 if "Highly profitable" in analysis.get("profitability", "") else 0,
        1 if "Low debt" in analysis.get("debt", "") else 0,
        1 if "upside" in analysis.get("price_target", "") else 0,
        1 if data.get("analyst_rating") == "buy" else 0,
    ])
    
    if bullish_signals >= 4:
        analysis["overall"] = "STRONG BUY"
    elif bullish_signals >= 3:
        analysis["overall"] = "BUY"
    elif bullish_signals >= 2:
        analysis["overall"] = "HOLD"
    else:
        analysis["overall"] = "SELL"
    
    print(f"[Quant Agent] Analysis complete — {analysis.get('overall')}")
    return analysis



def writer_agent(ticker: str, data: Dict, news: Dict, analysis: Dict) -> str:
    """
    Uses Claude to write a professional equity research report.
    """
    print(f"[Writer Agent] Writing research report for {ticker}...")
    
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    
    prompt = f"""
You are a senior equity research analyst at a top Wall Street firm. 
Write a professional equity research report for {data['company_name']} ({ticker}).

Use the following data:

FINANCIAL DATA:
{json.dumps(data, indent=2)}

QUANTITATIVE ANALYSIS:
{json.dumps(analysis, indent=2)}

RECENT NEWS:
{json.dumps(news['recent_news'][:3], indent=2)}

EARNINGS NEWS:
{json.dumps(news['earnings_news'][:2], indent=2)}

Write a structured report with these exact sections:
1. EXECUTIVE SUMMARY — 2-3 sentences, overall recommendation and key thesis
2. COMPANY OVERVIEW — brief description of what the company does
3. FINANCIAL ANALYSIS — analyze the key metrics, what they mean, how the company is performing
4. RECENT DEVELOPMENTS — summarize the most important recent news
5. RISK FACTORS — 3-4 key risks an investor should consider
6. VALUATION — is the stock fairly valued? overvalued? undervalued? why?
7. INVESTMENT RECOMMENDATION — clear BUY/HOLD/SELL with price target and reasoning

Write in a professional, confident tone. Use specific numbers from the data provided.
Do not make up any numbers not provided in the data.
"""

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=8000,
        messages=[{"role": "user", "content": prompt}]
    )
    
    report = message.content[0].text
    print(f"[Writer Agent] Report complete — {len(report)} characters")
    return report