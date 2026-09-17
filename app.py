import json
import os
import uuid
from datetime import datetime, timezone
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from bson import ObjectId
from flask import Flask, jsonify, request, send_from_directory
from pymongo import MongoClient


MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.environ.get("MONGO_DB", "arunjohnson_site")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
OPENAI_API_BASE = os.environ.get("OPENAI_API_BASE", "https://api.openai.com/v1").rstrip("/")
OPENAI_TRANSCRIBE_MODEL = os.environ.get("OPENAI_TRANSCRIBE_MODEL", "gpt-transcribe")
OPENAI_POLISH_MODEL = os.environ.get("OPENAI_POLISH_MODEL", "gpt-5.6-luna")

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
ADMIN_DIST = os.path.join(ROOT_DIR, "admin", "dist")
CEV_DIR = os.path.join(ROOT_DIR, "cev")

app = Flask(__name__, static_folder=ROOT_DIR, static_url_path="")
app.config["MAX_CONTENT_LENGTH"] = 25 * 1024 * 1024
client = MongoClient(MONGO_URI)
db = client[DB_NAME]


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def serialize_doc(doc):
    if not doc:
        return doc

    serialized = dict(doc)
    serialized["_id"] = str(serialized["_id"])
    return serialized


def require_admin():
    supplied = request.headers.get("X-Admin-Password", "")
    return supplied == ADMIN_PASSWORD


class OpenAIRequestError(RuntimeError):
    pass


def openai_request(path, payload):
    body = json.dumps(payload).encode("utf-8")
    req = Request(
        f"{OPENAI_API_BASE}/{path.lstrip('/')}",
        data=body,
        headers={
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urlopen(req, timeout=120) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        try:
            details = json.loads(error.read().decode("utf-8"))
            message = details.get("error", {}).get("message") or str(details)
        except (json.JSONDecodeError, UnicodeDecodeError):
            message = error.reason
        raise OpenAIRequestError(message) from error
    except URLError as error:
        raise OpenAIRequestError(f"OpenAI request failed: {error.reason}") from error


def multipart_body(fields, file_field, filename, content_type, file_bytes):
    boundary = f"----ArunQna{uuid.uuid4().hex}"
    chunks = []
    for name, value in fields.items():
        chunks.extend([
            f"--{boundary}\r\n".encode("utf-8"),
            f'Content-Disposition: form-data; name="{name}"\r\n\r\n'.encode("utf-8"),
            str(value).encode("utf-8"),
            b"\r\n",
        ])
    chunks.extend([
        f"--{boundary}\r\n".encode("utf-8"),
        f'Content-Disposition: form-data; name="{file_field}"; filename="{filename}"\r\n'.encode("utf-8"),
        f"Content-Type: {content_type}\r\n\r\n".encode("utf-8"),
        file_bytes,
        b"\r\n",
        f"--{boundary}--\r\n".encode("utf-8"),
    ])
    return boundary, b"".join(chunks)


def transcribe_audio(audio_file):
    audio_bytes = audio_file.read()
    if not audio_bytes:
        raise OpenAIRequestError("The recording was empty.")

    filename = os.path.basename(audio_file.filename or "dictation.webm")
    content_type = audio_file.mimetype or "audio/webm"
    boundary, body = multipart_body(
        {
            "model": OPENAI_TRANSCRIBE_MODEL,
            "response_format": "json",
            "prompt": "Chemical engineering, green hydrogen, water electrolysis, Climate Energy Ventures, capital cost, carbon dioxide.",
        },
        "file",
        filename,
        content_type,
        audio_bytes,
    )
    req = Request(
        f"{OPENAI_API_BASE}/audio/transcriptions",
        data=body,
        headers={
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
        method="POST",
    )
    try:
        with urlopen(req, timeout=120) as response:
            result = json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        try:
            details = json.loads(error.read().decode("utf-8"))
            message = details.get("error", {}).get("message") or str(details)
        except (json.JSONDecodeError, UnicodeDecodeError):
            message = error.reason
        raise OpenAIRequestError(message) from error
    except URLError as error:
        raise OpenAIRequestError(f"OpenAI transcription failed: {error.reason}") from error

    transcript = result.get("text", "").strip()
    if not transcript:
        raise OpenAIRequestError("The transcription was empty.")
    return transcript


def response_text(response):
    if response.get("output_text"):
        return response["output_text"].strip()

    parts = []
    for item in response.get("output", []):
        for content in item.get("content", []):
            if content.get("type") in {"output_text", "text"} and content.get("text"):
                parts.append(content["text"])
    return "\n".join(parts).strip()


def polish_transcript(transcript):
    response = openai_request(
        "/responses",
        {
            "model": OPENAI_POLISH_MODEL,
            "instructions": (
                "You are polishing a dictated answer for Arun Johnson's public green-hydrogen Q&A. "
                "Preserve the speaker's facts, uncertainty, first-person voice, and intended meaning. "
                "Fix transcription errors, grammar, structure, and repetition, but do not invent claims or citations. "
                "Return only an HTML fragment using safe tags: p, strong, em, h3, ul, ol, li, and blockquote. "
                "Do not include Markdown, a title, a preamble, or a code fence."
            ),
            "input": transcript,
            "max_output_tokens": 1800,
            "store": False,
        },
    )
    html = response_text(response)
    if not html:
        raise OpenAIRequestError("Codex Luna returned an empty polished answer.")
    return html


def graph_payload(include_layout=False):
    settings = db.settings.find_one({"_id": "qna"}) or {}
    nodes = [serialize_doc(node) for node in db.nodes.find({})]
    edges = [serialize_doc(edge) for edge in db.edges.find({})]
    payload = {
        "rootNodeId": settings.get("rootNodeId"),
        "email": settings.get("email", "arun2642@gmail.com"),
        "formEndpoint": settings.get("formEndpoint", "https://formsubmit.co/ajax/arun2642@gmail.com"),
        "nodes": nodes,
        "edges": edges,
    }

    if include_layout:
        payload["layout"] = [serialize_doc(item) for item in db.layout.find({})]

    return payload


@app.get("/api/qna/public")
def public_qna():
    return jsonify(graph_payload(include_layout=False))


@app.post("/api/admin/polish-dictation")
def polish_dictation():
    if not require_admin():
        return jsonify({"error": "Unauthorized"}), 401
    if not OPENAI_API_KEY:
        return jsonify({"error": "Set OPENAI_API_KEY before using dictation polish."}), 503

    audio_file = request.files.get("audio")
    if not audio_file:
        return jsonify({"error": "No audio recording received."}), 400

    try:
        transcript = transcribe_audio(audio_file)
        html = polish_transcript(transcript)
        return jsonify({
            "transcript": transcript,
            "html": html,
            "model": OPENAI_POLISH_MODEL,
        })
    except OpenAIRequestError as error:
        return jsonify({"error": str(error)}), 502


@app.get("/api/admin/graph")
def admin_graph():
    if not require_admin():
        return jsonify({"error": "Unauthorized"}), 401

    return jsonify(graph_payload(include_layout=True))


@app.post("/api/admin/nodes")
def create_node():
    if not require_admin():
        return jsonify({"error": "Unauthorized"}), 401

    body = request.get_json(force=True)
    node_type = body.get("type")
    if node_type not in {"blurb", "question"}:
        return jsonify({"error": "Node type must be blurb or question"}), 400

    node = {
        "_id": body.get("_id") or str(ObjectId()),
        "type": node_type,
        "text": body.get("text", "").strip(),
        "paragraphs": body.get("paragraphs") or [],
        "html": body.get("html", ""),
        "label": body.get("label", "").strip(),
        "createdAt": now_iso(),
        "updatedAt": now_iso(),
    }
    if not isinstance(node["html"], str):
        return jsonify({"error": "html must be a string"}), 400
    db.nodes.insert_one(node)

    x = body.get("x")
    y = body.get("y")
    if isinstance(x, (int, float)) and isinstance(y, (int, float)):
        db.layout.update_one(
            {"nodeId": node["_id"]},
            {"$set": {"nodeId": node["_id"], "x": x, "y": y}},
            upsert=True,
        )

    return jsonify(serialize_doc(node)), 201


@app.patch("/api/admin/nodes/<node_id>")
def update_node(node_id):
    if not require_admin():
        return jsonify({"error": "Unauthorized"}), 401

    body = request.get_json(force=True)
    allowed = {}
    for key in ("text", "paragraphs", "html", "label"):
        if key in body:
            allowed[key] = body[key]

    if "text" in allowed and isinstance(allowed["text"], str):
        allowed["text"] = allowed["text"].strip()
    if "label" in allowed and isinstance(allowed["label"], str):
        allowed["label"] = allowed["label"].strip()
    if "paragraphs" in allowed and not isinstance(allowed["paragraphs"], list):
        return jsonify({"error": "paragraphs must be a list"}), 400
    if "html" in allowed and not isinstance(allowed["html"], str):
        return jsonify({"error": "html must be a string"}), 400

    allowed["updatedAt"] = now_iso()
    result = db.nodes.update_one({"_id": node_id}, {"$set": allowed})
    if result.matched_count == 0:
        return jsonify({"error": "Node not found"}), 404

    return jsonify(serialize_doc(db.nodes.find_one({"_id": node_id})))


@app.delete("/api/admin/nodes/<node_id>")
def delete_node(node_id):
    if not require_admin():
        return jsonify({"error": "Unauthorized"}), 401

    result = db.nodes.delete_one({"_id": node_id})
    if result.deleted_count == 0:
        return jsonify({"error": "Node not found"}), 404

    db.edges.delete_many({"$or": [{"fromNodeId": node_id}, {"toNodeId": node_id}]})
    db.layout.delete_one({"nodeId": node_id})
    return jsonify({"ok": True})


@app.post("/api/admin/edges")
def create_edge():
    if not require_admin():
        return jsonify({"error": "Unauthorized"}), 401

    body = request.get_json(force=True)
    from_node_id = body.get("fromNodeId")
    to_node_id = body.get("toNodeId")
    kind = body.get("kind")
    if kind not in {"shows_question", "answers_with"}:
        return jsonify({"error": "Invalid edge kind"}), 400
    if not db.nodes.find_one({"_id": from_node_id}) or not db.nodes.find_one({"_id": to_node_id}):
        return jsonify({"error": "Both nodes must exist"}), 400

    existing = db.edges.find_one({"fromNodeId": from_node_id, "toNodeId": to_node_id, "kind": kind})
    if existing:
        return jsonify(serialize_doc(existing)), 200

    edge = {
        "_id": body.get("_id") or str(ObjectId()),
        "fromNodeId": from_node_id,
        "toNodeId": to_node_id,
        "kind": kind,
        "order": body.get("order", db.edges.count_documents({"fromNodeId": from_node_id, "kind": kind})),
        "createdAt": now_iso(),
        "updatedAt": now_iso(),
    }
    db.edges.insert_one(edge)
    return jsonify(serialize_doc(edge)), 201


@app.delete("/api/admin/edges/<edge_id>")
def delete_edge(edge_id):
    if not require_admin():
        return jsonify({"error": "Unauthorized"}), 401

    result = db.edges.delete_one({"_id": edge_id})
    if result.deleted_count == 0:
        return jsonify({"error": "Edge not found"}), 404

    return jsonify({"ok": True})


@app.put("/api/admin/layout")
def save_layout():
    if not require_admin():
        return jsonify({"error": "Unauthorized"}), 401

    body = request.get_json(force=True)
    positions = body.get("positions", [])
    if not isinstance(positions, list):
        return jsonify({"error": "positions must be a list"}), 400

    for position in positions:
        node_id = position.get("nodeId")
        x = position.get("x")
        y = position.get("y")
        if not node_id or not isinstance(x, (int, float)) or not isinstance(y, (int, float)):
            continue
        db.layout.update_one(
            {"nodeId": node_id},
            {"$set": {"nodeId": node_id, "x": x, "y": y, "updatedAt": now_iso()}},
            upsert=True,
        )

    return jsonify({"ok": True})


@app.get("/admin")
@app.get("/admin/")
def admin_index():
    return send_from_directory(ADMIN_DIST, "index.html")


@app.get("/admin/<path:path>")
def admin_asset(path):
    return send_from_directory(ADMIN_DIST, path)


@app.get("/cev")
@app.get("/cev/")
def cev_index():
    return send_from_directory(CEV_DIR, "index.html")


@app.get("/cev/<path:path>")
def cev_asset(path):
    return send_from_directory(CEV_DIR, path)


@app.get("/")
def root():
    return send_from_directory(ROOT_DIR, "index.html")


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.environ.get("PORT", 5000)), debug=True)
