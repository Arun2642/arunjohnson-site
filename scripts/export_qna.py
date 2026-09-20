import argparse
import json
import os
from pathlib import Path

from bson import ObjectId
from pymongo import MongoClient


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = ROOT / "data" / "qna.json"
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.environ.get("MONGO_DB", "arunjohnson_site")


def json_safe(item):
    result = dict(item)
    if isinstance(result.get("_id"), ObjectId):
        result["_id"] = str(result["_id"])
    return result


def export_qna(output_path):
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    settings = db.settings.find_one({"_id": "qna"}) or {}

    nodes = [json_safe(node) for node in db.nodes.find({})]
    edges = [json_safe(edge) for edge in db.edges.find({})]
    layout = [json_safe(item) for item in db.layout.find({})]
    if not nodes:
        raise ValueError(f"No Q&A nodes found in MongoDB database {DB_NAME!r}")

    payload = {
        "rootNodeId": settings.get("rootNodeId"),
        "email": settings.get("email", "arun2642@gmail.com"),
        "formEndpoint": settings.get("formEndpoint", "https://formsubmit.co/ajax/arun2642@gmail.com"),
        "layout": layout,
        "nodes": nodes,
        "edges": edges,
    }
    output_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Exported {len(nodes)} nodes and {len(edges)} edges to {output_path}.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Export the local MongoDB Q&A graph for GitHub Pages.")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    export_qna(args.output)
