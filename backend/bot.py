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

# Force JSON output for receipt extraction
model = genai.GenerativeModel(
    'gemini-1.5-flash',  # Corrected model name from 2.5 (typo) to 1.5
    generation_config={"response_mime_type": "application/json"}
)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

intents = discord.Intents.default()
intents.message_content = True
intents.members = True
bot = commands.Bot(command_prefix='!', intents=intents)

VALID_CATEGORIES = [
    "Fruits", "Vegetables", "Meat / Fish", "Dairy & Eggs",
    "Grains & Staples", "Frozen Foods", "Snacks & Sweets",
    "Condiments & Cooking Ingredients", "Toiletries", "Misc"
]


@bot.event
async def on_ready():
    print(f'Logged in as {bot.user}!')
    # Start tasks safely
    if not scheduled_sync.is_running():
        scheduled_sync.start()
    if not heartbeat.is_running():
        heartbeat.start()


@bot.command(name='sync')
async def sync_profile(ctx):
    """Manually updates the user's profile immediately"""
    msg = await ctx.send("🔄 Syncing profile...")
    try:
        user_data = {
            "discord_id": str(ctx.author.id),
            "display_name": ctx.author.display_name,
            "handle": ctx.author.name,
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

    if message.attachments:
        attachment = message.attachments[0]
        if attachment.content_type and attachment.content_type.startswith('image/'):

            status_msg = await message.channel.send("👀 Processing Receipt...")

            try:
                # A. Download Image
                image_bytes = await attachment.read()

                # B. Upload to Storage
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
                Use EXACTLY one category: {json.dumps(VALID_CATEGORIES)}
                """

                response = await asyncio.to_thread(
                    model.generate_content,
                    [prompt, {"mime_type": attachment.content_type, "data": image_bytes}]
                )
                data = json.loads(response.text)

                # D. Update User
                user_data = {
                    "discord_id": str(message.author.id),
                    "display_name": message.author.display_name,
                    "handle": message.author.name,
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
                new_receipt_id = response_db.data[0]['id']

                # F. Save Items
                items_to_insert = [
                    {
                        "receipt_id": new_receipt_id,
                        "name": item['name'],
                        "price": item['price'],
                        "category": item['category']
                    } for item in data.get("items", [])
                ]
                if items_to_insert:
                    supabase.table("receipt_items").insert(items_to_insert).execute()

                # --- G. NEW: FETCH CUSTOM BOT RESPONSE ---
                user_id = str(message.author.id)
                user_query = supabase.table("users").select("bot_response_template").eq("discord_id",
                                                                                        user_id).single().execute()

                # Use custom template if exists, otherwise use a default fallback
                custom_template = user_query.data.get("bot_response_template") if user_query.data else None
                success_intro = custom_template if custom_template else "✅ **Saved!**"

                display_date = data.get('date', 'Unknown Date')
                await status_msg.edit(
                    content=f"{success_intro}\n📅 {display_date} • 🏪 {data.get('store', 'Unknown')}\n💰 ${data.get('total', 0)} • 🧾 {len(items_to_insert)} items categorized!"
                )

            except Exception as e:
                await status_msg.edit(content=f"❌ Error: {str(e)}")
                print(f"Error: {e}")

    await bot.process_commands(message)


# --- TASKS ---
@tasks.loop(hours=24)
async def scheduled_sync():
    print("⏰ Running daily profile sync...")
    for guild in bot.guilds:
        for member in guild.members:
            if not member.bot:
                user_data = {
                    "discord_id": str(member.id),
                    "display_name": member.display_name,
                    "handle": member.name,
                    "avatar_url": str(member.display_avatar.url)
                }
                try:
                    supabase.table("users").upsert(user_data).execute()
                except:
                    continue


@tasks.loop(seconds=60)
async def heartbeat():
    try:
        current_time = datetime.datetime.now(datetime.timezone.utc).isoformat()
        supabase.table("system_status").upsert({
            "service_name": "discord_bot",
            "last_heartbeat": current_time
        }).execute()
    except Exception as e:
        print(f"❌ Heartbeat failed: {e}")


bot.run(DISCORD_TOKEN)