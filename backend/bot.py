import os
import discord
import json
import uuid
import asyncio
from discord.ext import commands, tasks
from dotenv import load_dotenv
import google.generativeai as genai
from supabase import create_client, Client
import datetime

# 1. Load Secrets
load_dotenv()
DISCORD_TOKEN = os.getenv('DISCORD_TOKEN')
GEMINI_KEY = os.getenv('GEMINI_API_KEY')
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

# 2. Setup Services
genai.configure(api_key=GEMINI_KEY)

# Using generation_config to force JSON output
model = genai.GenerativeModel(
    'gemini-2.5-flash',
    generation_config={"response_mime_type": "application/json"}
)

# Ensure your SUPABASE_KEY is the "service_role" key if you want to bypass RLS,
# otherwise ensure RLS policies allow anon inserts.
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

intents = discord.Intents.default()
intents.message_content = True
intents.members = True # REQUIRED to loop through guild.members
bot = commands.Bot(command_prefix='!', intents=intents)

# Your Custom Categories
VALID_CATEGORIES = [
    "Fruits", "Vegetables", "Meat / Fish", "Dairy & Eggs",
    "Grains & Staples", "Frozen Foods", "Snacks & Sweets",
    "Condiments & Cooking Ingredients", "Toiletries", "Misc"
]

@bot.event
async def on_ready():
    print(f'Logged in as {bot.user}!')
    # Start the daily loop if it isn't already running
    if not scheduled_sync.is_running():
        scheduled_sync.start()

# --- NEW: Manual Sync Command ---
@bot.command(name='sync')
async def sync_profile(ctx):
    """Manually updates the user's profile immediately"""
    msg = await ctx.send("🔄 Syncing profile...")
    try:
        user_data = {
            "discord_id": str(ctx.author.id),
            "display_name": ctx.author.display_name,
            "handle": ctx.author.name, # Syncs real username
            "avatar_url": str(ctx.author.display_avatar.url)
        }
        supabase.table("users").upsert(user_data).execute()
        await msg.edit(content=f"✅ **Synced!** Handle updated to: @{ctx.author.name}")
    except Exception as e:
        await msg.edit(content=f"❌ Error: {e}")

@bot.event
async def on_message(message):
    if message.author == bot.user:
        return

    # Check for image attachments
    if message.attachments:
        attachment = message.attachments[0]
        # Basic check for image types
        if attachment.content_type and attachment.content_type.startswith('image/'):

            status_msg = await message.channel.send("👀 Processing Receipt (Full Image)...")

            try:
                # A. Download Image
                image_bytes = await attachment.read()

                # B. Upload Image to Supabase Storage
                file_ext = attachment.filename.split('.')[-1]
                file_name = f"{uuid.uuid4()}.{file_ext}"

                supabase.storage.from_("receipts").upload(
                    file=image_bytes,
                    path=file_name,
                    file_options={"content-type": attachment.content_type}
                )

                image_url = supabase.storage.from_("receipts").get_public_url(file_name)

                # C. Analyze with Gemini
                prompt = f"""
                Analyze this receipt image. Extract data into this JSON schema:
                {{
                    "store": str,
                    "address": str,
                    "date": "YYYY-MM-DD",
                    "total": float,
                    "items": [
                        {{"name": str, "price": float, "category": str}}
                    ]
                }}

                RULES:
                1. For 'category', use EXACTLY one of: {json.dumps(VALID_CATEGORIES)}
                2. If an item doesn't fit, use "Grains & Staples" or "Snacks & Sweets".
                3. If date is missing, use null.
                """

                response = await asyncio.to_thread(
                    model.generate_content,
                    [prompt, {"mime_type": attachment.content_type, "data": image_bytes}]
                )

                data = json.loads(response.text)

                # D. Update User (Lazy Update)
                # UPDATED: Now includes 'handle'
                user_data = {
                    "discord_id": str(message.author.id),
                    "display_name": message.author.display_name,
                    "handle": message.author.name, # <--- NEW
                    "avatar_url": str(message.author.display_avatar.url)
                }

                supabase.table("users").upsert(user_data).execute()

                # E. Save Receipt
                receipt_entry = {
                    "discord_user_id": str(message.author.id),
                    "store_name": data.get("store", "Unknown Store"),
                    "store_address": data.get("address"),
                    "purchase_date": data.get("date"),
                    "total_amount": data.get("total", 0.0),
                    "image_url": image_url
                }

                response_db = supabase.table("receipts").insert(receipt_entry).execute()

                if not response_db.data:
                    raise Exception("Database Insert failed or returned no ID.")

                new_receipt_id = response_db.data[0]['id']

                # F. Save Items
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

                # G. Success Message
                display_date = data.get('date', 'Unknown Date')
                item_count = len(items_to_insert)

                await status_msg.edit(
                    content=f"✅ **Saved!**\n📅 {display_date} • 🏪 {data.get('store', 'Unknown')}\n💰 ${data.get('total', 0)} • 🧾 {item_count} items categorized!"
                )

            except json.JSONDecodeError:
                await status_msg.edit(content="❌ AI Error: The model failed to generate valid JSON.")
            except Exception as e:
                await status_msg.edit(content=f"❌ System Error: {str(e)}")
                print(f"Error processing receipt: {e}")

    await bot.process_commands(message)

# --- DAILY BACKGROUND TASK ---
@tasks.loop(hours=24)
async def scheduled_sync():
    """Runs once a day to update everyone's profiles"""
    print("⏰ Running daily profile sync...")
    if bot.guilds:
        # Assuming single server for now, or loop through all guilds
        for guild in bot.guilds:
            for member in guild.members:
                if not member.bot:
                    user_data = {
                        "discord_id": str(member.id),
                        "display_name": member.display_name,
                        "handle": member.name, # <--- NEW: Saves 'oliverhchang'
                        "avatar_url": str(member.display_avatar.url)
                    }
                    try:
                        supabase.table("users").upsert(user_data).execute()
                    except Exception as e:
                        print(f"Failed to sync {member.name}: {e}")
        print("✅ Daily sync complete.")

@tasks.loop(seconds=60)
async def heartbeat():
    """Pings Supabase every minute to say 'I am alive'"""
    try:
        current_time = datetime.datetime.now(datetime.timezone.utc).isoformat()
        supabase.table("system_status").upsert({
            "service_name": "discord_bot",
            "last_heartbeat": current_time
        }).execute()
        print(f"💓 Heartbeat sent: {current_time}")
    except Exception as e:
        print(f"❌ Heartbeat failed: {e}")

# Don't forget to start it in on_ready!
@bot.event
async def on_ready():
    print(f'Logged in as {bot.user}!')
    if not scheduled_sync.is_running():
        scheduled_sync.start()
    if not heartbeat.is_running():  # <--- NEW LINE
        heartbeat.start()           # <--- NEW LINE
bot.run(DISCORD_TOKEN)