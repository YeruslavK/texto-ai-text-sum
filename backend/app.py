from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, validator
from transformers import BartTokenizer, BartForConditionalGeneration
from fastapi.middleware.cors import CORSMiddleware
import nltk
import logging
import torch
import random

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI()

# Expanded CORS configuration
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Global variables for model and tokenizer
model = None
tokenizer = None

# Initialize model with error handling
def initialize_model():
    global model, tokenizer
    try:
        model_name = "facebook/bart-large-cnn"
        tokenizer = BartTokenizer.from_pretrained(model_name)
        model = BartForConditionalGeneration.from_pretrained(model_name)

        # Move model to GPU if available
        if torch.cuda.is_available():
            model = model.to('cpu')
            logger.info("Model loaded on GPU")
        else:
            logger.info("Model loaded on CPU")

    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        raise RuntimeError(f"Model initialization failed: {e}")

# Initialize model at startup
initialize_model()

class SummarizationRequest(BaseModel):
    text: str
    length: str = Field(default="medium")
    temperature: float = Field(default=1.0, ge=0.0, le=2.0)

    @validator('text')
    def validate_text(cls, v):
        if not v.strip():
            raise ValueError("Text cannot be empty")
        if len(v) > 50000:
            raise ValueError("Text is too long (max 50000 characters)")
        return v

@app.post("/summarize")
async def summarize_text(request_body: SummarizationRequest):
    try:
        if not model or not tokenizer:
            raise HTTPException(status_code=500, detail="Model not properly initialized")

        text = request_body.text
        length = request_body.length
        temperature = request_body.temperature

        logger.info(f"Processing text of length: {len(text)}, length setting: {length}, temperature: {temperature}")

        # --- Prompt Engineering ---
        prompt_prefix = "Summarize the following text, focusing on the main ideas and using only information found in the text. Do not add any external information or make up details: "
        text_with_prompt = prompt_prefix + text

        # --- Dynamic max_length calculation ---
        tokens_per_word = 1.3

        # Define length presets
        if length == "short":
            min_length = 30
            max_length = int(70 * tokens_per_word)
        elif length == "medium":
            min_length = 70
            max_length = int(150 * tokens_per_word)
        elif length == "long":
            min_length = 150
            max_length = int(250 * tokens_per_word)
        else:
            min_length = 70
            max_length = int(150 * tokens_per_word)  # Default

        inputs = tokenizer(text_with_prompt, return_tensors="pt", max_length=1024, truncation=True)
        if torch.cuda.is_available():
            inputs = {k: v.to('cuda') for k, v in inputs.items()}

        # --- Introduce Randomness ---
        # 1. Top-k Sampling
        top_k = random.randint(40, 60)

        # 2. Temperature Scaling (using value from the request)
        # Now using temperature from the request

        # 3. Nucleus (Top-p) Sampling
        top_p = random.uniform(0.8, 0.95)

        # 4. Randomly adjust length penalty within a narrower range
        length_penalty = random.uniform(1.0, 2.0)

        # 5. num_beams - Reduce to limit resource usage
        num_beams = random.randint(2, 4)

        # 6. Set seed for varied outputs
        random.seed()

        summary_ids = model.generate(
            inputs.input_ids,
            num_beams=num_beams,
            min_length=min_length,
            max_length=max_length,
            early_stopping=True,
            no_repeat_ngram_size=3,
            length_penalty=length_penalty,
            top_k=top_k,
            temperature=temperature,  # Use temperature here
            top_p=top_p,
            do_sample=True
        )

        summary = tokenizer.decode(summary_ids[0], skip_special_tokens=True)
        logger.info("Summary generated by BART model")

        return {"summary": summary}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during summarization: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
