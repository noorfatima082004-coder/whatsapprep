import hashlib
import hmac
import json
import os
from datetime import datetime, timezone

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, PlainTextResponse
from pydantic import BaseModel

load_dotenv()

app = FastAPI(title="WhatsRep Backend")

# Allow the Next.js merchant dashboard (and local tooling) to call inbox APIs.
_cors_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Meta WhatsApp Cloud API credentials from .env
# (variable names kept the same as before, only the source values changed)
API_URL = os.getenv("META_API_URL", "https://graph.facebook.com/v23.0").rstrip("/")
INSTANCE_ID = os.getenv("META_PHONE_NUMBER_ID")   # Phone number ID (not the phone number itself)
API_TOKEN = os.getenv("META_ACCESS_TOKEN")        # Access token
VERIFY_TOKEN = os.getenv("META_VERIFY_TOKEN")     # Any secret string you choose
APP_SECRET = os.getenv("META_APP_SECRET", "")     # Optional: enables webhook signature check


# Temporary in-memory storage for received messages.
# Messages will be lost when the server restarts.
received_messages = []


def green_api_endpoint(method: str) -> str:
    """Build the Meta Graph API URL (function name kept for minimal changes)."""
    if not API_URL or not INSTANCE_ID or not API_TOKEN:
        raise HTTPException(
            status_code=500,
            detail="Meta API credentials are missing in .env",
        )

    if method:
        return f"{API_URL}/{INSTANCE_ID}/{method}"
    return f"{API_URL}/{INSTANCE_ID}"


def meta_headers() -> dict:
    return {"Authorization": f"Bearer {API_TOKEN}"}


class MessageRequest(BaseModel):
    phone: str
    message: str


@app.get("/")
def home():
    return {"message": "WhatsRep backend is running"}


@app.get("/status")
async def check_status():
    url = green_api_endpoint("")

    async with httpx.AsyncClient(timeout=20) as client:
        try:
            response = await client.get(
                url,
                headers=meta_headers(),
                params={"fields": "display_phone_number,verified_name,quality_rating"},
            )
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise HTTPException(
                status_code=502,
                detail=exc.response.text,
            ) from exc
        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=502,
                detail=f"Could not connect to Meta API: {exc}",
            ) from exc

    return response.json()


@app.post("/send-message")
async def send_message(data: MessageRequest):
    phone = "".join(
        char for char in data.phone if char.isdigit()
    )

    if len(phone) < 10:
        raise HTTPException(
            status_code=400,
            detail="Enter a valid phone number with country code",
        )

    if not data.message.strip():
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty",
        )

    url = green_api_endpoint("messages")

    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": phone,
        "type": "text",
        "text": {"body": data.message.strip()},
    }

    async with httpx.AsyncClient(timeout=30) as client:
        try:
            response = await client.post(url, json=payload, headers=meta_headers())
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise HTTPException(
                status_code=502,
                detail=exc.response.text,
            ) from exc
        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=502,
                detail=f"Could not connect to Meta API: {exc}",
            ) from exc

    result = response.json()

    sent_id = None
    if isinstance(result, dict):
        sent_list = result.get("messages") or [{}]
        sent_id = sent_list[0].get("id")

    # Keep a copy of every sent reply so the dashboard can show both sides of a chat.
    received_messages.append(
        {
            "id": sent_id,
            "sender_name": "You",
            "chat_id": f"{phone}@c.us",
            "message_type": "textMessage",
            "message": data.message.strip(),
            "direction": "out",
            "received_at": datetime.now(timezone.utc).isoformat(),
        }
    )

    return result


@app.get("/webhook/meta")
async def verify_meta_webhook(request: Request):
    """Meta calls this once when you click 'Verify and save'."""
    params = request.query_params
    mode = params.get("hub.mode")
    token = params.get("hub.verify_token")
    challenge = params.get("hub.challenge", "")

    if mode == "subscribe" and VERIFY_TOKEN and token == VERIFY_TOKEN:
        return PlainTextResponse(challenge)

    raise HTTPException(status_code=403, detail="Webhook verification failed")


# Meta message types -> the type names the dashboard already understands.
META_TYPE_MAP = {
    "text": "textMessage",
    "image": "imageMessage",
    "video": "videoMessage",
    "audio": "audioMessage",
    "voice": "audioMessage",
    "document": "documentMessage",
    "sticker": "stickerMessage",
    "location": "locationMessage",
    "contacts": "contactMessage",
}


def extract_meta_text(msg: dict) -> str:
    msg_type = msg.get("type", "")

    if msg_type == "text":
        return (msg.get("text") or {}).get("body", "")

    if msg_type in ("image", "video", "document"):
        return (msg.get(msg_type) or {}).get("caption", "")

    if msg_type == "button":
        return (msg.get("button") or {}).get("text", "")

    if msg_type == "interactive":
        interactive = msg.get("interactive") or {}
        reply = interactive.get("button_reply") or interactive.get("list_reply") or {}
        return reply.get("title", "")

    return ""


@app.post("/webhook/meta")
async def receive_whatsapp_message(request: Request):
    """Receive incoming WhatsApp notifications from Meta Cloud API."""

    raw_body = await request.body()

    # Optional security check: confirms the request really came from Meta.
    if APP_SECRET:
        signature = request.headers.get("X-Hub-Signature-256", "")
        expected = "sha256=" + hmac.new(
            APP_SECRET.encode(), raw_body, hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(signature, expected):
            raise HTTPException(status_code=403, detail="Invalid signature")

    try:
        data = json.loads(raw_body)
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail="Invalid JSON payload",
        ) from exc

    if not isinstance(data, dict):
        raise HTTPException(
            status_code=400,
            detail="Webhook payload must be a JSON object",
        )

    if data.get("object") != "whatsapp_business_account":
        return {
            "status": "ignored",
            "object": data.get("object"),
        }

    for entry in data.get("entry") or []:
        for change in entry.get("changes") or []:
            value = change.get("value") or {}

            # Status updates (sent/delivered/read) have no "messages" list - skip them.
            messages = value.get("messages") or []
            if not messages:
                continue

            contacts = value.get("contacts") or []
            names = {
                c.get("wa_id"): (c.get("profile") or {}).get("name")
                for c in contacts
            }

            for msg in messages:
                sender_number = msg.get("from", "")
                meta_type = msg.get("type", "")
                message_type = META_TYPE_MAP.get(meta_type, meta_type or "unknown")
                message_text = extract_meta_text(msg)

                # Save the event even if it contains media instead of text.
                received_message = {
                    "id": msg.get("id"),
                    "sender_name": names.get(sender_number) or "Unknown",
                    "chat_id": f"{sender_number}@c.us" if sender_number else "Unknown",
                    "message_type": message_type,
                    "message": message_text,
                    "received_at": datetime.now(timezone.utc).isoformat(),
                }

                # Avoid duplicate entries if Meta retries an event.
                message_id = received_message["id"]
                already_received = (
                    message_id is not None
                    and any(item["id"] == message_id for item in received_messages)
                )

                if not already_received:
                    received_messages.append(received_message)

                    print("\n========== NEW WHATSAPP MESSAGE ==========")
                    print("Sender:", received_message["sender_name"])
                    print("Chat ID:", received_message["chat_id"])
                    print("Type:", received_message["message_type"])
                    print("Message:", message_text or "[No text / media message]")
                    print("==========================================\n")

    # Always answer 200 quickly so Meta does not keep retrying.
    return {"status": "received"}


@app.get("/messages")
def get_received_messages():
    """Return messages received since the server started."""
    return {
        "count": len(received_messages),
        "messages": received_messages,
    }


@app.get("/dashboard", response_class=HTMLResponse)
async def messages_dashboard():
    return r"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WhatsRep - Inbox</title>

    <style>
        :root {
            --bg: #eef1ef;
            --panel: #ffffff;
            --ink: #17231f;
            --muted: #6a7873;
            --line: #e3e8e5;
            --brand: #0f6b57;
            --brand-dark: #0a4f40;
            --brand-soft: #e4f3ec;
            --bubble-in: #ffffff;
            --bubble-out: #d6f0df;
            --thread-bg: #f3f5f2;
            --danger: #b42318;
            --radius: 14px;
        }

        * {
            box-sizing: border-box;
        }

        [hidden] {
            display: none !important;
        }

        html, body {
            height: 100%;
        }

        body {
            margin: 0;
            background: var(--bg);
            color: var(--ink);
            font-family: "Segoe UI", system-ui, -apple-system, Roboto, Arial, sans-serif;
            font-size: 15px;
            line-height: 1.4;
        }

        button, input, textarea {
            font: inherit;
            color: inherit;
        }

        button:focus-visible, input:focus-visible, textarea:focus-visible {
            outline: 2px solid var(--brand);
            outline-offset: 2px;
        }

        /* ---------- Layout ---------- */
        .app {
            display: grid;
            grid-template-columns: 350px 1fr;
            height: 100dvh;
            max-width: 1280px;
            margin: 0 auto;
            background: var(--panel);
        }

        @media (min-width: 1320px) {
            body {
                padding: 18px 0;
            }
            .app {
                height: calc(100dvh - 36px);
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 6px 30px rgba(15, 40, 33, 0.12);
            }
        }

        /* ---------- Sidebar ---------- */
        .sidebar {
            display: flex;
            flex-direction: column;
            min-height: 0;
            border-right: 1px solid var(--line);
        }

        .brand {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 18px 10px;
        }

        .brand h1 {
            margin: 0;
            font-size: 20px;
            font-weight: 700;
            color: var(--brand);
            letter-spacing: -0.2px;
        }

        .brand-right {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .new-btn {
            padding: 6px 12px;
            border: 0;
            border-radius: 16px;
            background: var(--brand);
            color: #fff;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
        }

        .new-btn:hover {
            background: var(--brand-dark);
        }

        .live {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
            color: var(--muted);
        }

        .dot {
            width: 9px;
            height: 9px;
            border-radius: 50%;
            background: #9aa6a1;
        }

        .live.on .dot {
            background: #1fa971;
        }

        .live.off .dot {
            background: var(--danger);
        }

        .search {
            padding: 4px 14px 12px;
        }

        .search input {
            width: 100%;
            padding: 10px 14px;
            border: 1px solid var(--line);
            border-radius: 10px;
            background: var(--bg);
        }

        .chat-list {
            flex: 1;
            margin: 0;
            padding: 0;
            list-style: none;
            overflow-y: auto;
        }

        .chat-item {
            display: grid;
            grid-template-columns: 46px 1fr auto;
            column-gap: 12px;
            align-items: center;
            width: 100%;
            padding: 12px 18px;
            border: 0;
            border-bottom: 1px solid var(--line);
            background: transparent;
            text-align: left;
            cursor: pointer;
        }

        .chat-item:hover {
            background: #f7f9f8;
        }

        .chat-item.active {
            background: var(--brand-soft);
        }

        .avatar {
            width: 46px;
            height: 46px;
            border-radius: 50%;
            display: grid;
            place-items: center;
            font-weight: 700;
            font-size: 17px;
            color: #fff;
            background: var(--brand);
        }

        .chat-main {
            min-width: 0;
        }

        .chat-name {
            font-weight: 600;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .chat-preview {
            margin-top: 2px;
            font-size: 13.5px;
            color: var(--muted);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .chat-meta {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 6px;
            font-size: 12px;
            color: var(--muted);
        }

        .badge {
            min-width: 21px;
            padding: 1px 7px;
            border-radius: 11px;
            background: var(--brand);
            color: #fff;
            font-size: 12px;
            font-weight: 700;
            text-align: center;
        }

        .list-empty {
            padding: 40px 24px;
            text-align: center;
            color: var(--muted);
        }

        /* ---------- Conversation ---------- */
        .conversation {
            display: flex;
            flex-direction: column;
            min-width: 0;
            min-height: 0;
            background: var(--thread-bg);
            position: relative;
        }

        .conv-header {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 18px;
            background: var(--panel);
            border-bottom: 1px solid var(--line);
            min-height: 66px;
        }

        .back {
            display: none;
            border: 0;
            background: transparent;
            font-size: 22px;
            cursor: pointer;
            padding: 4px 8px;
            color: var(--brand);
        }

        .conv-title {
            font-weight: 600;
        }

        .conv-sub {
            font-size: 13px;
            color: var(--muted);
        }

        .thread {
            flex: 1;
            min-height: 0;
            overflow-y: auto;
            padding: 18px 22px;
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .day {
            align-self: center;
            margin: 12px 0 6px;
            padding: 3px 12px;
            border-radius: 10px;
            background: #e3e9e5;
            color: var(--muted);
            font-size: 12px;
        }

        .bubble {
            max-width: min(68%, 560px);
            padding: 8px 12px 6px;
            border-radius: var(--radius);
            background: var(--bubble-in);
            box-shadow: 0 1px 1px rgba(15, 40, 33, 0.08);
            overflow-wrap: anywhere;
            white-space: pre-wrap;
        }

        .bubble.in {
            align-self: flex-start;
            border-top-left-radius: 4px;
        }

        .bubble.out {
            align-self: flex-end;
            background: var(--bubble-out);
            border-top-right-radius: 4px;
        }

        .bubble .media {
            font-style: italic;
            color: var(--muted);
        }

        .bubble .time {
            display: block;
            margin-top: 2px;
            text-align: right;
            font-size: 11px;
            color: var(--muted);
        }

        .new-pill {
            position: absolute;
            left: 50%;
            bottom: 96px;
            transform: translateX(-50%);
            padding: 7px 16px;
            border: 0;
            border-radius: 18px;
            background: var(--brand);
            color: #fff;
            font-size: 13px;
            cursor: pointer;
            box-shadow: 0 3px 12px rgba(15, 40, 33, 0.25);
        }

        .new-pill[hidden] {
            display: none;
        }

        .composer {
            padding: 10px 16px 12px;
            background: var(--panel);
            border-top: 1px solid var(--line);
        }

        .composer-row {
            display: flex;
            gap: 10px;
            align-items: flex-end;
        }

        #replyText {
            flex: 1;
            max-height: 130px;
            padding: 11px 14px;
            border: 1px solid var(--line);
            border-radius: 12px;
            background: var(--bg);
            resize: none;
        }

        #replyText:disabled {
            opacity: 0.6;
        }

        #sendBtn {
            padding: 11px 22px;
            border: 0;
            border-radius: 12px;
            background: var(--brand);
            color: #fff;
            font-weight: 600;
            cursor: pointer;
        }

        #sendBtn:hover:not(:disabled) {
            background: var(--brand-dark);
        }

        #sendBtn:disabled {
            background: #a9b8b3;
            cursor: not-allowed;
        }

        #replyStatus {
            min-height: 18px;
            margin-top: 6px;
            font-size: 13px;
            color: var(--muted);
        }

        #replyStatus.error {
            color: var(--danger);
        }

        .placeholder {
            flex: 1;
            display: grid;
            place-items: center;
            padding: 30px;
            text-align: center;
            color: var(--muted);
        }

        .placeholder strong {
            display: block;
            margin-bottom: 6px;
            color: var(--ink);
            font-size: 18px;
        }

        /* ---------- New message panel ---------- */
        .newchat {
            flex: 1;
            min-height: 0;
            display: flex;
            flex-direction: column;
            overflow-y: auto;
        }

        .newchat-head {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 18px;
            background: var(--panel);
            border-bottom: 1px solid var(--line);
            min-height: 66px;
            font-weight: 600;
        }

        .newchat-body {
            width: 100%;
            max-width: 560px;
            margin: 0 auto;
            padding: 26px 22px;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .newchat-body label {
            font-size: 13px;
            font-weight: 600;
            color: var(--muted);
        }

        .newchat-body input,
        .newchat-body textarea {
            width: 100%;
            padding: 11px 14px;
            border: 1px solid var(--line);
            border-radius: 12px;
            background: var(--panel);
            resize: vertical;
        }

        .newchat-hint {
            font-size: 12.5px;
            color: var(--muted);
        }

        #newSendBtn {
            align-self: flex-end;
            margin-top: 6px;
            padding: 11px 26px;
            border: 0;
            border-radius: 12px;
            background: var(--brand);
            color: #fff;
            font-weight: 600;
            cursor: pointer;
        }

        #newSendBtn:hover:not(:disabled) {
            background: var(--brand-dark);
        }

        #newSendBtn:disabled {
            background: #a9b8b3;
            cursor: not-allowed;
        }

        #newStatus {
            min-height: 18px;
            font-size: 13px;
            color: var(--muted);
        }

        #newStatus.error {
            color: var(--danger);
        }

        /* ---------- Mobile: one pane at a time ---------- */
        @media (max-width: 760px) {
            .app {
                grid-template-columns: 1fr;
            }

            .conversation {
                display: none;
            }

            body.chat-open .sidebar {
                display: none;
            }

            body.chat-open .conversation {
                display: flex;
            }

            .back {
                display: block;
            }

            .bubble {
                max-width: 86%;
            }
        }

        @media (prefers-reduced-motion: no-preference) {
            .chat-item {
                transition: background 0.12s;
            }
        }
    </style>
</head>

<body>
    <div class="app">

        <aside class="sidebar">
            <div class="brand">
                <h1>WhatsRep</h1>
                <div class="brand-right">
                    <button class="new-btn" id="newBtn" type="button">+ New</button>
                    <div class="live" id="live"><span class="dot"></span><span id="liveText">Connecting</span></div>
                </div>
            </div>

            <div class="search">
                <input id="search" type="search" placeholder="Search name, number or message"
                    aria-label="Search chats" autocomplete="off">
            </div>

            <ul class="chat-list" id="chatList" aria-label="Chats"></ul>
        </aside>

        <main class="conversation">
            <div class="conv-header" id="convHeader" hidden>
                <button class="back" id="backBtn" type="button" aria-label="Back to chats">&larr;</button>
                <div class="avatar" id="convAvatar"></div>
                <div>
                    <div class="conv-title" id="convTitle"></div>
                    <div class="conv-sub" id="convSub"></div>
                </div>
            </div>

            <div class="placeholder" id="placeholder">
                <div>
                    <strong>Select a chat</strong>
                    Messages from each number stay together in their own chat.
                </div>
            </div>

            <div class="newchat" id="newChat" hidden>
                <div class="newchat-head">
                    <button class="back" id="newBackBtn" type="button" aria-label="Back to chats">&larr;</button>
                    <span>New message</span>
                </div>
                <div class="newchat-body">
                    <label for="newPhone">Phone number (with country code)</label>
                    <input id="newPhone" type="tel" inputmode="tel" placeholder="e.g. 923001234567"
                        autocomplete="off">
                    <div class="newchat-hint">Country code ke saath likhein, bina 0 ya + ke bhi chalega (Pakistan: 92300...).</div>

                    <label for="newText">Message</label>
                    <textarea id="newText" rows="5" placeholder="Type your message (Enter to send)"></textarea>

                    <button id="newSendBtn" type="button" disabled>Send</button>
                    <div id="newStatus" role="status"></div>
                </div>
            </div>

            <div class="thread" id="thread" hidden></div>
            <button class="new-pill" id="newPill" type="button" hidden>New message &darr;</button>

            <div class="composer" id="composer" hidden>
                <div class="composer-row">
                    <textarea id="replyText" rows="1" aria-label="Reply"
                        placeholder="Type a reply (Enter to send)"></textarea>
                    <button id="sendBtn" type="button">Send</button>
                </div>
                <div id="replyStatus" role="status"></div>
            </div>
        </main>

    </div>

    <script>
        (function () {
            "use strict";

            const $ = id => document.getElementById(id);
            const listEl = $("chatList");
            const threadEl = $("thread");
            const searchEl = $("search");
            const replyText = $("replyText");
            const sendBtn = $("sendBtn");
            const replyStatus = $("replyStatus");
            const newPill = $("newPill");
            const newChatEl = $("newChat");
            const newPhone = $("newPhone");
            const newText = $("newText");
            const newSendBtn = $("newSendBtn");
            const newStatus = $("newStatus");

            const COLORS = ["#0f6b57", "#2b6cb0", "#8a4fb3", "#b45f06", "#a23b5a", "#3b7a8c", "#5b6b2e"];

            let chats = new Map();
            let selectedId = null;
            let lastSignature = "";
            let query = "";
            let busy = false;
            let sending = false;
            let sendingNew = false;
            let drafts = {};
            let lastSeen = loadSeen();

            /* ---------- small helpers ---------- */
            function loadSeen() {
                try {
                    return JSON.parse(localStorage.getItem("whatsrep_last_seen") || "{}");
                } catch (e) {
                    return {};
                }
            }

            function saveSeen() {
                try {
                    localStorage.setItem("whatsrep_last_seen", JSON.stringify(lastSeen));
                } catch (e) {}
            }

            function el(tag, className, text) {
                const node = document.createElement(tag);
                if (className) node.className = className;
                if (text !== undefined) node.textContent = text;
                return node;
            }

            function isOut(m) {
                return m.direction === "out";
            }

            function isPersonal(chatId) {
                return typeof chatId === "string" && chatId.endsWith("@c.us");
            }

            function numberOf(chatId) {
                const raw = String(chatId || "").split("@")[0];
                return raw ? "+" + raw : "Unknown";
            }

            function colorFor(id) {
                let h = 0;
                for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) % 997;
                return COLORS[h % COLORS.length];
            }

            function initialOf(name) {
                const m = String(name).match(/[A-Za-z0-9ÃƒËœÃ¢â€šÂ¬-Ãƒâ€ºÃ‚Â¿]/);
                return m ? m[0].toUpperCase() : "#";
            }

            function timeOf(m) {
                const t = Date.parse(m.received_at);
                return isNaN(t) ? 0 : t;
            }

            function clock(ts) {
                return ts ? new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
            }

            function sameDay(a, b) {
                return new Date(a).toDateString() === new Date(b).toDateString();
            }

            function dayLabel(ts) {
                const now = Date.now();
                if (sameDay(ts, now)) return "Today";
                if (sameDay(ts, now - 86400000)) return "Yesterday";
                return new Date(ts).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
            }

            function listTime(ts) {
                if (!ts) return "";
                return sameDay(ts, Date.now())
                    ? clock(ts)
                    : new Date(ts).toLocaleDateString([], { day: "numeric", month: "short" });
            }

            function bodyOf(m) {
                if (m.message) return { text: m.message, media: false };
                const labels = {
                    imageMessage: "Photo",
                    videoMessage: "Video",
                    audioMessage: "Voice note",
                    documentMessage: "Document",
                    stickerMessage: "Sticker",
                    locationMessage: "Location",
                    contactMessage: "Contact"
                };
                return { text: labels[m.message_type] || m.message_type || "Message", media: true };
            }

            /* ---------- data ---------- */
            function buildChats(messages) {
                const map = new Map();

                messages.forEach(m => {
                    const id = m.chat_id || "Unknown";
                    if (!map.has(id)) {
                        map.set(id, { id: id, name: "", messages: [], lastTs: 0 });
                    }
                    const chat = map.get(id);
                    chat.messages.push(m);
                    chat.lastTs = Math.max(chat.lastTs, timeOf(m));
                });

                map.forEach(chat => {
                    chat.messages.sort((a, b) => timeOf(a) - timeOf(b));

                    let name = "";
                    for (let i = chat.messages.length - 1; i >= 0; i--) {
                        const m = chat.messages[i];
                        if (!isOut(m) && m.sender_name && m.sender_name !== "Unknown") {
                            name = m.sender_name;
                            break;
                        }
                    }

                    if (!isPersonal(chat.id)) {
                        chat.name = "Group " + numberOf(chat.id).replace("+", "");
                    } else {
                        chat.name = name || numberOf(chat.id);
                    }
                });

                return map;
            }

            function unreadOf(chat) {
                const seen = lastSeen[chat.id] || 0;
                return chat.messages.filter(m => !isOut(m) && timeOf(m) > seen).length;
            }

            function markSeen(chat) {
                if (!chat) return;
                if ((lastSeen[chat.id] || 0) < chat.lastTs) {
                    lastSeen[chat.id] = chat.lastTs;
                    saveSeen();
                }
            }

            function nearBottom() {
                return threadEl.scrollHeight - threadEl.scrollTop - threadEl.clientHeight < 90;
            }

            /* ---------- chat list ---------- */
            function renderList() {
                const q = query.trim().toLowerCase();

                const items = [...chats.values()]
                    .filter(chat => {
                        if (!q) return true;
                        return chat.name.toLowerCase().includes(q) ||
                            chat.id.toLowerCase().includes(q) ||
                            chat.messages.some(m => (m.message || "").toLowerCase().includes(q));
                    })
                    .sort((a, b) => b.lastTs - a.lastTs);

                listEl.replaceChildren();

                if (items.length === 0) {
                    listEl.appendChild(el("li", "list-empty",
                        chats.size === 0
                            ? "No chats yet. When a customer messages your WhatsApp number, their chat appears here."
                            : "No chats match your search."));
                    return;
                }

                items.forEach(chat => {
                    const last = chat.messages[chat.messages.length - 1];
                    const unread = chat.id === selectedId ? 0 : unreadOf(chat);

                    const li = el("li");
                    const btn = el("button", "chat-item" + (chat.id === selectedId ? " active" : ""));
                    btn.type = "button";
                    btn.addEventListener("click", () => selectChat(chat.id));

                    const avatar = el("div", "avatar", initialOf(chat.name));
                    avatar.style.background = colorFor(chat.id);

                    const main = el("div", "chat-main");
                    main.appendChild(el("div", "chat-name", chat.name));
                    const body = bodyOf(last);
                    main.appendChild(el("div", "chat-preview", (isOut(last) ? "You: " : "") + body.text));

                    const meta = el("div", "chat-meta");
                    meta.appendChild(el("span", "", listTime(chat.lastTs)));
                    if (unread > 0) meta.appendChild(el("span", "badge", String(unread)));

                    btn.append(avatar, main, meta);
                    li.appendChild(btn);
                    listEl.appendChild(li);
                });
            }

            /* ---------- conversation ---------- */
            function renderThread(forceBottom) {
                const chat = chats.get(selectedId);
                if (!chat) return;

                const keepBottom = forceBottom || nearBottom();
                const previousTop = threadEl.scrollTop;

                threadEl.replaceChildren();
                let lastDay = null;

                chat.messages.forEach(m => {
                    const ts = timeOf(m);
                    if (ts && (lastDay === null || !sameDay(lastDay, ts))) {
                        threadEl.appendChild(el("div", "day", dayLabel(ts)));
                        lastDay = ts;
                    }

                    const bubble = el("div", "bubble " + (isOut(m) ? "out" : "in"));
                    const body = bodyOf(m);
                    bubble.appendChild(el("span", body.media ? "media" : "", body.text));
                    bubble.appendChild(el("span", "time", clock(ts)));
                    threadEl.appendChild(bubble);
                });

                if (keepBottom) {
                    threadEl.scrollTop = threadEl.scrollHeight;
                    newPill.hidden = true;
                    markSeen(chat);
                } else {
                    threadEl.scrollTop = previousTop;
                }
            }

            function renderHeader() {
                const chat = chats.get(selectedId);
                if (!chat) return;

                $("convTitle").textContent = chat.name;
                $("convSub").textContent = isPersonal(chat.id) ? numberOf(chat.id) : "Group chat";
                const avatar = $("convAvatar");
                avatar.textContent = initialOf(chat.name);
                avatar.style.background = colorFor(chat.id);
            }

            function updateComposer() {
                const chat = chats.get(selectedId);
                const canReply = !!chat && isPersonal(chat.id);

                replyText.disabled = !canReply;
                replyText.placeholder = canReply
                    ? "Type a reply (Enter to send)"
                    : "Replies to group chats are not supported yet.";
                sendBtn.disabled = !canReply || sending || replyText.value.trim() === "";
            }

            function autoGrow() {
                replyText.style.height = "auto";
                replyText.style.height = Math.min(replyText.scrollHeight, 130) + "px";
            }

            function selectChat(id) {
                if (selectedId !== null) drafts[selectedId] = replyText.value;

                selectedId = id;
                const chat = chats.get(id);

                $("placeholder").hidden = true;
                newChatEl.hidden = true;
                $("convHeader").hidden = false;
                threadEl.hidden = false;
                $("composer").hidden = false;
                document.body.classList.add("chat-open");

                replyText.value = drafts[id] || "";
                replyStatus.textContent = "";
                replyStatus.className = "";
                autoGrow();

                renderHeader();
                renderThread(true);
                updateComposer();
                markSeen(chat);
                renderList();
                updateTitle();

                if (!replyText.disabled) replyText.focus();
            }

            function showList() {
                document.body.classList.remove("chat-open");
            }

            function updateTitle() {
                let total = 0;
                chats.forEach(chat => {
                    if (chat.id !== selectedId || !nearBottom()) total += unreadOf(chat);
                });
                document.title = (total > 0 ? "(" + total + ") " : "") + "WhatsRep - Inbox";
            }

            /* ---------- new message to any number ---------- */
            function digitsOf(value) {
                return String(value || "").replace(/\D/g, "");
            }

            function updateNewComposer() {
                newSendBtn.disabled =
                    sendingNew ||
                    digitsOf(newPhone.value).length < 10 ||
                    newText.value.trim() === "";
            }

            function openNewChat() {
                if (selectedId !== null) drafts[selectedId] = replyText.value;
                selectedId = null;

                $("placeholder").hidden = true;
                $("convHeader").hidden = true;
                threadEl.hidden = true;
                $("composer").hidden = true;
                newPill.hidden = true;
                newChatEl.hidden = false;
                document.body.classList.add("chat-open");

                newStatus.textContent = "";
                newStatus.className = "";
                updateNewComposer();
                renderList();
                updateTitle();
                newPhone.focus();
            }

            async function sendNewMessage() {
                const phone = digitsOf(newPhone.value);
                const text = newText.value.trim();
                if (phone.length < 10 || !text || sendingNew) return;

                sendingNew = true;
                updateNewComposer();
                newStatus.className = "";
                newStatus.textContent = "Sending...";

                try {
                    const response = await fetch("/send-message", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ phone: phone, message: text })
                    });

                    if (!response.ok) {
                        let detail = "";
                        try {
                            const err = await response.json();
                            detail = typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail);
                        } catch (e) {}
                        throw new Error(detail || "Send failed");
                    }

                    newPhone.value = "";
                    newText.value = "";
                    newStatus.textContent = "";

                    busy = false;
                    lastSignature = "";
                    await poll();

                    const id = phone + "@c.us";
                    if (chats.has(id)) selectChat(id);
                } catch (error) {
                    newStatus.className = "error";
                    newStatus.textContent = "Could not send: " + error.message;
                } finally {
                    sendingNew = false;
                    updateNewComposer();
                }
            }

            /* ---------- live updates ---------- */
            function setLive(on) {
                $("live").className = "live " + (on ? "on" : "off");
                $("liveText").textContent = on ? "Live" : "Offline";
            }

            async function poll() {
                if (busy) return;
                busy = true;

                try {
                    const response = await fetch("/messages", { cache: "no-store" });
                    if (!response.ok) throw new Error("Could not load messages");

                    const data = await response.json();
                    const messages = data.messages || [];
                    setLive(true);

                    const signature = JSON.stringify(messages);
                    if (signature === lastSignature) return;
                    lastSignature = signature;

                    const before = selectedId ? chats.get(selectedId) : null;
                    const beforeCount = before ? before.messages.length : 0;

                    chats = buildChats(messages);

                    if (selectedId && chats.has(selectedId)) {
                        const chat = chats.get(selectedId);
                        const grew = chat.messages.length > beforeCount;
                        const wasAtBottom = nearBottom();

                        renderHeader();
                        renderThread(false);

                        if (grew && !wasAtBottom) newPill.hidden = false;
                    }

                    renderList();
                    updateComposer();
                    updateTitle();
                } catch (error) {
                    setLive(false);
                } finally {
                    busy = false;
                }
            }

            /* ---------- sending ---------- */
            async function sendReply() {
                const chat = chats.get(selectedId);
                const text = replyText.value.trim();
                if (!chat || !isPersonal(chat.id) || !text || sending) return;

                sending = true;
                updateComposer();
                replyStatus.className = "";
                replyStatus.textContent = "Sending...";

                try {
                    const response = await fetch("/send-message", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ phone: chat.id, message: text })
                    });

                    if (!response.ok) {
                        let detail = "";
                        try {
                            const err = await response.json();
                            detail = typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail);
                        } catch (e) {}
                        throw new Error(detail || "Send failed");
                    }

                    replyText.value = "";
                    drafts[selectedId] = "";
                    autoGrow();
                    replyStatus.textContent = "";

                    busy = false;
                    lastSignature = "";
                    threadEl.scrollTop = threadEl.scrollHeight;
                    await poll();
                    renderThread(true);
                } catch (error) {
                    replyStatus.className = "error";
                    replyStatus.textContent = "Could not send: " + error.message;
                } finally {
                    sending = false;
                    updateComposer();
                    if (!replyText.disabled) replyText.focus();
                }
            }

            /* ---------- events ---------- */
            sendBtn.addEventListener("click", sendReply);

            replyText.addEventListener("input", () => {
                autoGrow();
                updateComposer();
            });

            replyText.addEventListener("keydown", event => {
                if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendReply();
                }
            });

            $("newBtn").addEventListener("click", openNewChat);
            $("newBackBtn").addEventListener("click", showList);
            newSendBtn.addEventListener("click", sendNewMessage);
            newPhone.addEventListener("input", updateNewComposer);
            newText.addEventListener("input", updateNewComposer);

            newPhone.addEventListener("keydown", event => {
                if (event.key === "Enter") {
                    event.preventDefault();
                    newText.focus();
                }
            });

            newText.addEventListener("keydown", event => {
                if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendNewMessage();
                }
            });

            searchEl.addEventListener("input", () => {
                query = searchEl.value;
                renderList();
            });

            $("backBtn").addEventListener("click", showList);

            newPill.addEventListener("click", () => {
                threadEl.scrollTop = threadEl.scrollHeight;
                newPill.hidden = true;
                markSeen(chats.get(selectedId));
                renderList();
                updateTitle();
            });

            threadEl.addEventListener("scroll", () => {
                if (nearBottom()) {
                    newPill.hidden = true;
                    const chat = chats.get(selectedId);
                    if (chat && unreadOf(chat) > 0) {
                        markSeen(chat);
                        renderList();
                        updateTitle();
                    }
                }
            });

            poll();
            setInterval(poll, 2000);
        })();
    </script>
</body>
</html>
"""