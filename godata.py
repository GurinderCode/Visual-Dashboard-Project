

# Import libraries
from fastapi import FastAPI
from pymongo import MongoClient
from bson import ObjectId
from fastapi.middleware.cors import CORSMiddleware

# Fast API Setup
app = FastAPI()

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect with Mongo db
client = MongoClient("mongodb://localhost:27017/")
db = client["OilAndGasTrends"]
collection = db["Reports"]

# Get all data using /data endpoint
@app.get("/data")
async def get_data():
    data = list(collection.find())
    for doc in data:
        doc["_id"] = str(doc["_id"])  # Convert ObjectId to string
    return {"data": data}

# Get data by ID
@app.get("/data/{id}")
async def get_data_by_id(id: str):
    obj_id = ObjectId(id)
    data = collection.find_one({"_id": obj_id})
    if data:
        data["_id"] = str(data["_id"])  # Convert ObjectId to string
    return data

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)