import json
import os
from datetime import datetime, timezone
from pathlib import Path

from pymongo import MongoClient


ROOT = Path(__file__).resolve().parents[1]
DATA_FILE = ROOT / "data" / "qna.json"
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.environ.get("MONGO_DB", "arunjohnson_site")


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def with_timestamps(item):
    timestamp = now_iso()
    result = dict(item)
    result.setdefault("createdAt", timestamp)
    result.setdefault("updatedAt", timestamp)
    return result


def seed():
    with DATA_FILE.open("r", encoding="utf-8") as handle:
        data = json.load(handle)

    if not isinstance(data.get("nodes"), list) or not isinstance(data.get("edges"), list):
        raise ValueError("data/qna.json must contain nodes and edges arrays")
    if not data.get("rootNodeId"):
        raise ValueError("data/qna.json must define rootNodeId")

    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]

    nodes = [with_timestamps(node) for node in data["nodes"]]
    edges = [with_timestamps(edge) for edge in data["edges"]]
    layout = [dict(item) for item in data.get("layout", [])]

    db.nodes.delete_many({})
    db.edges.delete_many({})
    db.layout.delete_many({})
    db.settings.delete_many({"_id": "qna"})

    if nodes:
        db.nodes.insert_many(nodes)
    if edges:
        db.edges.insert_many(edges)
    if layout:
        db.layout.insert_many(layout)
    db.settings.insert_one(
        {
            "_id": "qna",
            "rootNodeId": data["rootNodeId"],
            "email": data.get("email", "arun2642@gmail.com"),
            "formEndpoint": data.get("formEndpoint", "https://formsubmit.co/ajax/arun2642@gmail.com"),
            "updatedAt": now_iso(),
        }
    )

    print(f"Seeded {len(nodes)} nodes and {len(edges)} edges into {DB_NAME}.")


if __name__ == "__main__":
    seed()
