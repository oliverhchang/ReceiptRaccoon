import os
import discord
import io
import json
import uuid
from discord.ext import commands
from dotenv import load_dotenv
import google.generativeai as genai
from supabase import create_client, Client

# 1. Load Secrets
load_dotenv()
DISCORD_TOKEN = os.getenv('DISCORD_TOKEN')
GEMINI_KEY = os.getenv('GEMINI_API_KEY')
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

# 2. Setup Services
# Using the new 2.5 Flash model for better vision/speed
genai.configure(api_key=GEMINI_KEY)
model = genai.GenerativeModel(
    'gemini-1.5-flash')  # Note: 2.5 is not fully public yet, falling back to 1.5-flash usually safer, but if 2.5 works for you keep it!
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix='!', intents=intents)

# Your Custom Categories
VALID_CATEGORIES = [
    "Fruits", "Vegetables", "Meat / Fish", "Dairy & Eggs",
    "Grains & Staples", "Frozen Foods", "Snacks & Sweets",
    "Condiments & Cooking Ingredients", "Toiletries/Cleaning", "Misc"
]


@bot.event
async def on_message(message):
    if message.author == bot.user: return

    if message.attachments:
        attachment = message.attachments[0]
        if any(attachment.filename.lower().endswith(ext) for ext in ['png', 'jpg', 'jpeg', 'webp']):

            status_msg = await message.channel.send("👀 Processing Receipt (Full Image)...")

            try:
                # A. Download Image
                image_bytes = await attachment.read()

                # B. Upload Image to Supabase Storage
                file_name = f"{uuid.uuid4()}.jpg"
                supabase.storage.from_("receipts").upload(
                    file=image_bytes,
                    path=file_name,
                    file_options={"content-type": "image/jpeg"}
                )
                image_url = supabase.storage.from_("receipts").get_public_url(file_name)

                # C. Analyze with Gemini (Vision)
                prompt = f"""
                Analyze this receipt image. Extract the following data into strict JSON format:
                {{
                    "store": "Name of the store (e.g. Trader Joe's)",
                    "address": "The street address or city",
                    "date": "YYYY-MM-DD",
                    "total": 12.34,
                    "items": [
                        {{"name": "Item Name", "price": 0.00, "category": "Exact Category"}}
                    ]
                }}

                RULES:
                1. For 'category', use EXACTLY one of these: {json.dumps(VALID_CATEGORIES)}
                2. If an item doesn't fit, use "Grains & Staples" or "Snacks & Sweets" as best guess.
                3. If date is missing, leave null.
                4. Return only JSON.
                """

                response = model.generate_content([
                    prompt,
                    {"mime_type": "image/jpeg", "data": image_bytes}
                ])

                # Clean up response
                raw_text = response.text.replace("```json", "").replace("```", "").strip()
                data = json.loads(raw_text)

                if "error" in data:
                    await status_msg.edit(content="❌ I couldn't read that receipt.")
                    return

                # D. Update/Create the User (The "Lazy Update" Strategy)
                # ---------------------------------------------------------
                # This makes sure the user exists in the 'users' table
                # and keeps their avatar/name fresh.
                user_data = {
                    "discord_id": str(message.author.id),
                    "display_name": message.author.display_name,
                    "avatar_url": str(message.author.display_avatar.url),
                    # We don't update 'monthly_budget' here so we don't overwrite your settings
                }

                # .upsert() means: "Insert if new, Update if exists"
                supabase.table("users").upsert(user_data).execute()
                # ---------------------------------------------------------

                # E. Save to Database (Split into 2 steps!)

                # Step 1: Save the Receipt Wrapper
                receipt_entry = {
                    "discord_user_id": str(message.author.id),
                    "store_name": data.get("store", "Unknown Store"),
                    "store_address": data.get("address", None),
                    "purchase_date": data.get("date", None),
                    "total_amount": data.get("total", 0.0),
                    "image_url": image_url
                }

                # Insert and get the new ID back
                response_db = supabase.table("receipts").insert(receipt_entry).execute()
                new_receipt_id = response_db.data[0]['id']

                # Step 2: Save the Items linked to that ID
                items_to_insert = []
                for item in data.get("items", []):
                    items_to_insert.append({
                        "receipt_id": new_receipt_id,
                        "name": item['name'],
                        "price": item['price'],
                        "category": item['category']
                    })

                if items_to_insert:
                    supabase.table("receipt_items").insert(items_to_insert).execute()

                # F. Success Message
                display_date = data.get('date', 'Unknown Date')
                item_count = len(items_to_insert)

                await status_msg.edit(
                    content=f"✅ **Saved!**\n📅 {display_date} • 🏪 {data['store']}\n💰 ${data['total']} • 🧾 {item_count} items categorized!"
                )

            except Exception as e:
                await status_msg.edit(content=f"❌ Error: {str(e)}")
                print(e)

    await bot.process_commands(message)


bot.run(DISCORD_TOKEN)