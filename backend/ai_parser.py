import os
import json
import google.generativeai as genai

# (Or 'from openai import OpenAI' if you stuck with OpenAI)

# Load the key once when this file is imported
genai.configure(api_key=os.environ["GEMINI_API_KEY"])
model = genai.GenerativeModel('gemini-1.5-flash')

YOUR_CATEGORIES = [
    "Fruits", "Vegetables", "Meat / Fish", "Dairy & Eggs",
    "Grains & Staples", "Frozen Foods", "Snacks & Sweets",
    "Condiments & Cooking Ingredients", "Toiletries/Cleaning"
]


def parse_receipt(ocr_text):
    """
    Takes raw OCR text string, returns a list of dictionaries
    with name, price, and category.
    """
    prompt = f"""
    You are a receipt parser. 
    1. Extract every purchased item and its price from this raw OCR text.
    2. Categorize each item into EXACTLY one of these categories: {YOUR_CATEGORIES}.
    3. Ignore tax, subtotal, and payment lines.
    4. Return ONLY a valid JSON list.

    Raw Text:
    {ocr_text}
    """

    response = model.generate_content(
        prompt,
        generation_config={"response_mime_type": "application/json"}
    )

    # Clean up the response to ensure it's just the list
    return json.loads(response.text)