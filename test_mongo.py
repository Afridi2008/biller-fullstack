import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv("backend/.env")

uri = os.getenv("MONGODB_URI")

print("URI loaded:", bool(uri))
print("SRV URI:", uri.startswith("mongodb+srv://") if uri else False)

if not uri:
    raise RuntimeError("MONGODB_URI is missing")

print("Creating MongoClient...")

client = MongoClient(
    uri,
    serverSelectionTimeoutMS=10000,
    connectTimeoutMS=10000,
    socketTimeoutMS=10000,
)

print("Pinging Atlas...")

try:
    result = client.admin.command("ping")
    print("SUCCESS:", result)

    print("MongoDB connection is working!")

except Exception as e:
    print("FAILED")
    print("Exception type:", type(e).__name__)
    print("Exception:", str(e))

finally:
    client.close()