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
model = genai.GenerativeModel('gemini-2.5-flash')
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix='!', intents=intents)


# --- MAIN EVENT ---
@bot.event
async def on_message(message):
    if message.author == bot.user: return

    if message.attachments:
        attachment = message.attachments[0]
        if any(attachment.filename.lower().endswith(ext) for ext in ['png', 'jpg', 'jpeg', 'webp']):

            status_msg = await message.channel.send("👀 Processing Receipt (Full Image)...")

            try:
                # A. Download Image (No cropping anymore)
                image_bytes = await attachment.read()

                # B. Upload Image to Supabase Storage
                file_name = f"{uuid.uuid4()}.jpg"
                supabase.storage.from_("receipts").upload(
                    file=image_bytes,
                    path=file_name,
                    file_options={"content-type": "image/jpeg"}
                )

                # Get the Public URL
                image_url = supabase.storage.from_("receipts").get_public_url(file_name)

                # C. Analyze with Gemini (UPDATED PROMPT)
                prompt = """
                Analyze this receipt image. Extract the following data into strict JSON format:
                {
                    "store": "Name of the store (e.g. Trader Joe's)",
                    "address": "The street address or city printed on receipt",
                    "date": "YYYY-MM-DD (The date of purchase)",
                    "total": 12.34,
                    "items": [
                        {"name": "Item Name", "price": 0.00, "category": "Food/Home/Alc"}
                    ]
                }
                If the date is missing, estimate it or leave null. 
                If you can't read the receipt, return {"error": "unreadable"}.
                """

                response = model.generate_content([
                    prompt,
                    {"mime_type": "image/jpeg", "data": image_bytes}
                ])

                # Clean up the response
                raw_text = response.text.replace("```json", "").replace("```", "").strip()
                data = json.loads(raw_text)

                if "error" in data:
                    await status_msg.edit(content="❌ I couldn't read that receipt.")
                    return

                # D. Save to Database (Including Date & Address)
                receipt_entry = {
                    "discord_user_id": str(message.author.id),
                    "store_name": data.get("store", "Unknown Store"),
                    "store_address": data.get("address", None),  # Captured Address
                    "purchase_date": data.get("date", None),  # Captured Date
                    "total_amount": data.get("total", 0.0),
                    "items": data.get("items", []),
                    "image_url": image_url
                }

                supabase.table("receipts").insert(receipt_entry).execute()

                # E. Success!
                display_date = data.get('date', 'Unknown Date')
                await status_msg.edit(
                    content=f"✅ **Saved!**\n📅 Date: {display_date}\n🏪 Store: {data['store']}\n💰 Total: ${data['total']}")

            except Exception as e:
                await status_msg.edit(content=f"❌ Error: {str(e)}")
                print(e)

    await bot.process_commands(message)


bot.run(DISCORD_TOKEN)