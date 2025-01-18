from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from transformers import BartTokenizer, BartForConditionalGeneration
from fastapi.middleware.cors import CORSMiddleware

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
model_name = "facebook/bart-large"
tokenizer = BartTokenizer.from_pretrained(model_name)
model = BartForConditionalGeneration.from_pretrained(model_name)

# Pydantic model for request body validation
class SummarizationRequest(BaseModel):
    text: str
    maxWords: int = Field(default=0, ge=0)  
    summaryStyle: str = "neutral"  

@app.post("/summarize")
async def summarize_text(request_body: SummarizationRequest):
    try:
        text = request_body.text
        max_words = request_body.maxWords
        summary_style = request_body.summaryStyle

        inputs = tokenizer(text, return_tensors="pt", max_length=1024, truncation=True)

        # Estimate max_length based on max_lines (this is a simplification)
        max_length = int(max_words * 1.25) if max_words > 0 else 150 # Estimate 1.25 tokens per word

        # Generate summary
        summary_ids = model.generate(
            inputs.input_ids,  # Corrected line
            num_beams=4,
            max_length=max_length,
            early_stopping=True
        )
        summary = tokenizer.decode(summary_ids[0], skip_special_tokens=True)

        # Post-process based on max_lines (if necessary)
        if max_words > 0:
            summary_words = summary.split('\n')
            summary = '\n'.join(summary_words[:max_words])

        return {"summary": summary}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)