from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from transformers import BartTokenizer, BartForConditionalGeneration
from fastapi.middleware.cors import CORSMiddleware
from sklearn.feature_extraction.text import TfidfVectorizer
from nltk.tokenize import sent_tokenize, word_tokenize
import nltk
import logging

# Download the sentence tokenizer data (if you haven't already)
nltk.download('punkt')
# Download english stop words (if you haven't already)
nltk.download('stopwords')

app = FastAPI()

origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load pre-trained BART model and tokenizer
model_name = "facebook/bart-large-cnn" # Using a model fine tuned for summarization
tokenizer = BartTokenizer.from_pretrained(model_name)
model = BartForConditionalGeneration.from_pretrained(model_name)

# Pydantic model for request body validation
class SummarizationRequest(BaseModel):
    text: str
    maxWords: int = Field(default=0, ge=0)
    summaryStyle: str = "neutral"

def score_sentences_tfidf(text, max_words):
    """Scores sentences using TF-IDF and selects the top sentences up to max_words."""

    sentences = sent_tokenize(text)
    if not sentences:
        return ""

    # Calculate TF-IDF scores
    vectorizer = TfidfVectorizer(tokenizer=word_tokenize, stop_words='english')
    tfidf_matrix = vectorizer.fit_transform(sentences)

    # Calculate sentence scores (sum of TF-IDF scores for words in each sentence)
    sentence_scores = tfidf_matrix.sum(axis=1)

    # Create a list of (score, sentence) tuples
    scored_sentences = list(zip(sentence_scores, sentences))

    # Sort sentences by score in descending order
    scored_sentences.sort(reverse=True)

    # Select sentences until word limit is reached
    summary = ""
    word_count = 0
    for _, sentence in scored_sentences:  # Remove 'score'
        words = word_tokenize(sentence)
        sentence_word_count = len(words)
        if word_count + sentence_word_count <= max_words:
            summary += sentence + " "
            word_count += sentence_word_count
        else:
            break  # Exit the loop if adding the next sentence exceeds the limit

    return summary.strip()

@app.post("/summarize")
async def summarize_text(request_body: SummarizationRequest):
    try:
        text = request_body.text
        max_words = request_body.maxWords
        summary_style = request_body.summaryStyle

        inputs = tokenizer(text, return_tensors="pt", max_length=1024, truncation=True)
        logging.info(f"Tokenized inputs: {inputs}")

        # Estimate max_length based on max_words 
        max_length = int(max_words * 1.25) if max_words > 0 else 150

        # Generate summary
        summary_ids = model.generate(
            inputs.input_ids,
            num_beams=4,
            max_length=max_length,
            early_stopping=True
        )
        summary = tokenizer.decode(summary_ids[0], skip_special_tokens=True)

        # Post-process using TF-IDF sentence scoring if max_words is set
        if max_words > 0:
            summary = score_sentences_tfidf(summary, max_words)

        return {"summary": summary}

    except Exception as e:
        logging.error(f"An error occurred: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)