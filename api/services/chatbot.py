#!/usr/bin/env python3
"""
AgroBot CLI - Standalone OpenRouter client (NOT used by the Node.js server).
The Node.js API (routes/chatbot.js) calls OpenRouter directly via https.
This script is kept as a handy CLI debugging tool only.

Usage:
  set OPENROUTER_API_KEY=sk-or-...
  echo '{"message": "hi", "history": []}' | python services/chatbot.py
"""

import json
import sys
import os
import urllib.request
import urllib.error

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = os.getenv("OPENROUTER_MODEL", "google/gemini-2.0-flash-001")

SYSTEM_PROMPT = (
    "You are AgroBot, an agricultural assistant specialized in Sri Lankan agriculture "
    "built into the Agrolink platform."
)


def call_openrouter(user_message: str, history: list) -> str:
    if not OPENROUTER_API_KEY:
        raise ValueError("OPENROUTER_API_KEY environment variable is not set.")

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for entry in history:
        role = entry.get("role", "user")
        content = entry.get("content", "")
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": user_message})

    payload = json.dumps({
        "model": MODEL,
        "messages": messages,
        "max_tokens": 1024,
        "temperature": 0.7,
    }).encode("utf-8")

    req = urllib.request.Request(
        OPENROUTER_API_URL,
        data=payload,
        headers={
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://agrolink.app",
            "X-Title": "AgroLink Chatbot",
        },
        method="POST",
    )

    with urllib.request.urlopen(req, timeout=30) as response:
        body = response.read().decode("utf-8")

    data = json.loads(body)
    return data["choices"][0]["message"]["content"]


def main():
    try:
        raw_input = sys.stdin.read().strip()
        if not raw_input:
            print(json.dumps({"error": "No input provided"}))
            sys.exit(1)

        try:
            input_data = json.loads(raw_input)
        except json.JSONDecodeError:
            input_data = {"message": raw_input}

        user_message = (input_data.get("message") or "").strip()
        history = input_data.get("history") or []

        if not user_message:
            print(json.dumps({"error": "No message provided"}))
            sys.exit(1)

        bot_response = call_openrouter(user_message, history)
        print(json.dumps({"userMessage": user_message, "botResponse": bot_response}))

    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8", errors="replace")
        print(json.dumps({"error": f"OpenRouter API error {e.code}: {error_body}"}))
        sys.exit(1)
    except urllib.error.URLError as e:
        print(json.dumps({"error": f"Network error: {str(e.reason)}"}))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
