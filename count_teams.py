
import os
import pymongo
from dotenv import load_dotenv

# Load env safely
load_dotenv(".env.local")
load_dotenv(".env")

MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    print("No MONGO_URI found in environment variables.")
    # Fallback/Hardcode if needed for this specific env context (judging from previous context)
    # But best to rely on env file
    exit(1)

try:
    client = pymongo.MongoClient(MONGO_URI)
    db = client.get_default_database()
    
    # Count distinct home team IDs
    unique_ids = db.fixtures.distinct("fixture.teams.home.id")
    count = len(unique_ids)
    
    print(f"Total Unique Teams in Fixtures DB: {count}")
    
    # Also check active leagues if possible (saved leagues)
    leagues = db.leagues.count_documents({})
    print(f"Total Saved Leagues: {leagues}")
    
except Exception as e:
    print(f"Error: {e}")
