import os
import discord
import io
import json
import uuid
from discord.ext import commands
from dotenv import load_dotenv
import google.generativeai as genai
from PIL import Image
from supabase import create_client, Client

# 1. Load Secrets
load_dotenv()
DISCORD_TOKEN = os.getenv('DISCORD_TOKEN')
GEMINI_KEY = os.getenv('GEMINI_API_KEY')
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

# 2. Setup Services
genai.configure(api_key=GEMINI_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix='!', intents=intents)


# --- HELPER: PRIVACY CROP ---
def privacy_crop(image_bytes):
    try:
        img = Image.open(io.BytesIO(image_bytes))
        width, height = img.size
        new_height = int(height * 0.75)  # Keep top 75%
        cropped_img = img.crop((0, 0, width, new_height))
        output_buffer = io.BytesIO()
        cropped_img.save(output_buffer, format=img.format)
        return output_buffer.getvalue()
    except:
        return image_bytes


# --- MAIN EVENT ---
@bot.event
async def on_message(message):
    if message.author == bot.user: return

    if message.attachments:
        attachment = message.attachments[0]
        if any(attachment.filename.lower().endswith(ext) for ext in ['png', 'jpg', 'jpeg', 'webp']):

            status_msg = await message.channel.send("👀 Processing Receipt...")

            try:
                # A. Download & Crop
                image_bytes = await attachment.read()
                safe_bytes = privacy_crop(image_bytes)

                # B. Upload Image to Supabase Storage
                # We give it a random name so it doesn't overwrite others
                file_name = f"{uuid.uuid4()}.jpg"
                supabase.storage.from_("receipts").upload(
                    file=safe_bytes,
                    path=file_name,
                    file_options={"content-type": "image/jpeg"}
                )

                # Get the Public URL so the website can see it
                image_url = supabase.storage.from_("receipts").get_public_url(file_name)

                # C. Analyze with Gemini
                # We ask for VERY specific JSON so it's easy to save
                prompt = """
                Analyze this receipt. Extract data into this exact JSON format:
                {
                    "store": "Store Name",
                    "total": 12.34,
                    "items": [
                        {"name": "Milk", "price": 4.00, "category": "Dairy"},
                        {"name": "Bread", "price": 2.50, "category": "Bakery"}
                    ]
                }
                If you can't read it, return {"error": "unreadable"}.
                """

                response = model.generate_content([
                    prompt,
                    {"mime_type": "image/jpeg", "data": safe_bytes}
                ])

                # Clean up the response (remove ```json marks)
                raw_text = response.text.replace("```json", "").replace("```", "").strip()
                data = json.loads(raw_text)  # Turn text into Python Dictionary

                if "error" in data:
                    await status_msg.edit(content="❌ I couldn't read that receipt.")
                    return

                # D. Save to Database
                receipt_entry = {
                    "discord_user_id": str(message.author.id),
                    "store_name": data.get("store", "Unknown"),
                    "total_amount": data.get("total", 0.0),
                    "items": data.get("items", []),
                    "image_url": image_url
                }

                supabase.table("receipts").insert(receipt_entry).execute()

                # E. Success!
                await status_msg.edit(
                    content=f"✅ **Saved!**\nStore: {data['store']}\nTotal: ${data['total']}\n*Items archived in Supabase.*")

            except Exception as e:
                await status_msg.edit(content=f"❌ Error: {str(e)}")
                print(e)

    await bot.process_commands(message)


bot.run(DISCORD_TOKEN)