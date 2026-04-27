from app.services.ollama_service import analyze_sentiment


def analyze_text(text: str) -> dict:
    """Return sentiment, anger, and genuineness scores for a complaint text."""
    return analyze_sentiment(text)
