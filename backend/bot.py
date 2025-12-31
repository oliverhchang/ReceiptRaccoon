import os
import discord
import json
import uuid
import asyncio
import datetime
from discord.ext import commands, tasks
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
genai.configure(api_key=GEMINI_KEY)
model = genai.GenerativeModel(
    'gemini-2.5-flash',
    generation_config={"response_mime_type": "application/json"}
)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# 3. Bot Configuration
intents = discord.Intents.default()
intents.message_content = True
intents.members = True
bot = commands.Bot(command_prefix='!', intents=intents)

VALID_EXPENSE_CATEGORIES = [
    "Home & Utilities", "Transportation", "Groceries",
    "Personal & Family Care", "Health", "Insurance",
    "Restaurants & Dining", "Shopping & Entertainment",
    "Travel", "Cash, Checks & Misc", "Giving",
    "Business Expenses", "Education", "Finance", "Uncategorized"
]

# Emoji Mapping for feedback
CATEGORY_EMOJIS = {
    "Home & Utilities": "🏠",
    "Transportation": "🚗",
    "Groceries": "🛒",
    "Personal & Family Care": "🧴",
    "Health": "🏥",
    "Insurance": "🛡️",
    "Restaurants & Dining": "🍔",
    "Shopping & Entertainment": "🛍️",
    "Travel": "✈️",
    "Cash, Checks & Misc": "💵",
    "Giving": "🎁",
    "Business Expenses": "💼",
    "Education": "📚",
    "Finance": "💰",
    "Uncategorized": "❓"
}


# 4. Events
@bot.event
async def on_ready():
    print(f'🦝 Receipt Raccoon is online as {bot.user}!')
    if not scheduled_sync.is_running():
        scheduled_sync.start()
    if not heartbeat.is_running():
        heartbeat.start()


@bot.listen('on_message')
async def handle_receipts(message):
    if message.author == bot.user or not message.attachments:
        return

    attachment = message.attachments[0]
    if attachment.content_type and attachment.content_type.startswith('image/'):
        status_msg = await message.channel.send("👀 Processing Receipt...")

        try:
            # A. Download Image
            image_bytes = await attachment.read()

            # B. Upload to Supabase Storage
            file_ext = attachment.filename.split('.')[-1]
            file_name = f"{uuid.uuid4()}.{file_ext}"
            supabase.storage.from_("receipts").upload(
                file=image_bytes,
                path=file_name,
                file_options={"content-type": attachment.content_type}
            )
            image_url = supabase.storage.from_("receipts").get_public_url(file_name)

            # C. AI Extraction (Updated to ask for Address)
            prompt = f"""
            Analyze this receipt. 1. Categorize into one of: {json.dumps(VALID_EXPENSE_CATEGORIES)}.
            For Gas/Fuel receipts: You must extract the volume (Gallons or Liters) and output it to the quantity field. Do NOT default quantity to 1. If the receipt shows 'Price/Gal', calculate the quantity as Total Item Price / Price Per Gallon
            
            2. Extract into JSON:
            {{
                "overall_category": str,
                "store": str,
                "address": str, 
                "date": "YYYY-MM-DD",
                "total": float,
                "items": [
                    {{"name": str, "quantity": int, "total_price": float}}
                ]
            }}
            """
            response = await asyncio.to_thread(
                model.generate_content,
                [prompt, {"mime_type": attachment.content_type, "data": image_bytes}]
            )
            data = json.loads(response.text)

            # D. Save Main Receipt Row (Updated to save Address)
            receipt_entry = {
                "discord_user_id": str(message.author.id),
                "store_name": data.get("store", "Unknown Store"),
                "store_address": data.get("address"),  # <--- Now capturing address
                "purchase_date": data.get("date"),
                "total_amount": data.get("total", 0.0),
                "image_url": image_url,
                "receipt_type": data.get("overall_category", "Uncategorized")
            }
            res_db = supabase.table("receipts").insert(receipt_entry).execute()
            new_id = res_db.data[0]['id']

            # E. Save Items with Quantities
            items_to_save = [
                {
                    "receipt_id": new_id,
                    "name": item.get('name', 'Unknown'),
                    "price": item.get('total_price', 0.0),
                    "quantity": item.get('quantity', 1)
                } for item in data.get("items", [])
            ]
            if items_to_save:
                supabase.table("receipt_items").insert(items_to_save).execute()

            # F. Feedback Formatting
            user_q = supabase.table("users").select("bot_response_template").eq("discord_id",
                                                                                str(message.author.id)).single().execute()
            intro = user_q.data.get("bot_response_template") if user_q.data else "Receipt processed! ✅"

            current_cat = data.get('overall_category', 'Uncategorized')
            cat_emoji = CATEGORY_EMOJIS.get(current_cat, "📄")

            formatted_content = (
                f"{intro}\n"
                f"📅 **Date:** {data.get('date', 'Unknown')}\n"
                f"{cat_emoji} **Category:** {current_cat}\n"
                f"🏪 **Store:** {data.get('store', 'Unknown')}\n"
                f"💰 **Cost:** ${data.get('total', 0.0):.2f}\n"
                f"🧾 **Items Categorized:** {len(items_to_save)}"
            )

            await status_msg.edit(content=formatted_content)

        except Exception as e:
            await status_msg.edit(content=f"❌ Error: {str(e)}")
            print(f"Error: {e}")


# 5. Commands
@bot.command(name='sync')
async def sync_profile(ctx):
    user_data = {
        "discord_id": str(ctx.author.id),
        "display_name": ctx.author.display_name,
        "handle": ctx.author.name,
        "avatar_url": str(ctx.author.display_avatar.url)
    }
    supabase.table("users").upsert(user_data).execute()
    await ctx.send(f"✅ Profile synced for @{ctx.author.name}")


# 6. Heartbeat Task
@tasks.loop(seconds=60)
async def heartbeat():
    try:
        supabase.table("system_status").upsert({
            "service_name": "discord_bot",
            "last_heartbeat": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }).execute()
    except Exception as e:
        print(f"Heartbeat Error: {e}")


@tasks.loop(hours=24)
async def scheduled_sync():
    print("Running daily sync...")


bot.run(DISCORD_TOKEN)