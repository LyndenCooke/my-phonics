"""
Canva Connect API — OAuth2 Authorization Flow
Handles PKCE, local callback server, and token storage.
"""
import base64
import hashlib
import http.server
import json
import os
import secrets
import sys
import urllib.parse
import webbrowser
from pathlib import Path

import requests
from dotenv import load_dotenv

load_dotenv()

CLIENT_ID = os.getenv("CANVA_CLIENT_ID")
CLIENT_SECRET = os.getenv("Canva_SECRET")
REDIRECT_URI = "http://127.0.0.1:8765/callback"
TOKEN_FILE = Path(__file__).parent / ".canva_tokens.json"

SCOPES = " ".join([
    "design:content:read",
    "design:content:write",
    "design:meta:read",
    "asset:read",
    "asset:write",
    "folder:read",
    "folder:write",
    "profile:read",
    "brandtemplate:content:read",
    "brandtemplate:meta:read",
])

AUTH_URL = "https://www.canva.com/api/oauth/authorize"
TOKEN_URL = "https://api.canva.com/rest/v1/oauth/token"


def generate_pkce():
    """Generate PKCE code_verifier and code_challenge."""
    verifier = secrets.token_urlsafe(64)[:128]
    digest = hashlib.sha256(verifier.encode("ascii")).digest()
    challenge = base64.urlsafe_b64encode(digest).rstrip(b"=").decode("ascii")
    return verifier, challenge


def build_auth_url(code_challenge, state):
    """Build the Canva authorization URL."""
    params = {
        "response_type": "code",
        "client_id": CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "scope": SCOPES,
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
        "state": state,
    }
    return f"{AUTH_URL}?{urllib.parse.urlencode(params)}"


def exchange_code(auth_code, code_verifier):
    """Exchange authorization code for access + refresh tokens."""
    credentials = base64.b64encode(f"{CLIENT_ID}:{CLIENT_SECRET}".encode()).decode()
    resp = requests.post(
        TOKEN_URL,
        headers={
            "Authorization": f"Basic {credentials}",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        data={
            "grant_type": "authorization_code",
            "code": auth_code,
            "code_verifier": code_verifier,
            "redirect_uri": REDIRECT_URI,
        },
    )
    resp.raise_for_status()
    return resp.json()


def refresh_access_token(refresh_token):
    """Use a refresh token to get a new access token."""
    credentials = base64.b64encode(f"{CLIENT_ID}:{CLIENT_SECRET}".encode()).decode()
    resp = requests.post(
        TOKEN_URL,
        headers={
            "Authorization": f"Basic {credentials}",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        data={
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
        },
    )
    resp.raise_for_status()
    return resp.json()


def save_tokens(tokens):
    """Save tokens to local file."""
    TOKEN_FILE.write_text(json.dumps(tokens, indent=2))
    print(f"Tokens saved to {TOKEN_FILE}")


def load_tokens():
    """Load tokens from local file."""
    if TOKEN_FILE.exists():
        return json.loads(TOKEN_FILE.read_text())
    return None


def get_access_token():
    """Get a valid access token, refreshing if needed."""
    tokens = load_tokens()
    if not tokens:
        print("No tokens found. Run this script to authorize first.")
        return None
    # Try refreshing
    try:
        new_tokens = refresh_access_token(tokens["refresh_token"])
        save_tokens(new_tokens)
        return new_tokens["access_token"]
    except Exception as e:
        print(f"Token refresh failed: {e}")
        print("Run this script again to re-authorize.")
        return None


def main():
    if not CLIENT_ID or not CLIENT_SECRET:
        print("ERROR: Set CANVA_CLIENT_ID and Canva_SECRET in .env")
        sys.exit(1)

    code_verifier, code_challenge = generate_pkce()
    state = secrets.token_urlsafe(32)
    auth_url = build_auth_url(code_challenge, state)

    # Store auth code from callback
    result = {"code": None, "state": None, "error": None, "error_description": None, "done": False}

    class CallbackHandler(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            parsed = urllib.parse.urlparse(self.path)
            params = urllib.parse.parse_qs(parsed.query)
            print(f"  Received request: {self.path}")

            # Only process the actual callback path
            if parsed.path == "/callback" and ("code" in params or "error" in params):
                result["code"] = params.get("code", [None])[0]
                result["state"] = params.get("state", [None])[0]
                result["error"] = params.get("error", [None])[0]
                result["error_description"] = params.get("error_description", [None])[0]
                result["done"] = True
                self.send_response(200)
                self.send_header("Content-Type", "text/html")
                self.end_headers()
                if result["code"]:
                    self.wfile.write(b"<h1>Authorization successful!</h1><p>You can close this tab.</p>")
                else:
                    msg = f"Authorization failed: {result.get('error_description', result.get('error', 'unknown'))}"
                    self.wfile.write(f"<h1>{msg}</h1>".encode())
            else:
                # Ignore favicon and other requests
                self.send_response(204)
                self.end_headers()

        def log_message(self, format, *args):
            pass  # Suppress server logs

    print("Opening Canva authorization page in your browser...")
    print(f"If it doesn't open, visit:\n{auth_url}\n")
    webbrowser.open(auth_url)

    server = http.server.HTTPServer(("127.0.0.1", 8765), CallbackHandler)
    server.timeout = 120  # 2 minute timeout
    print("Waiting for authorization callback on http://127.0.0.1:8765/callback ...")
    print("(You have 2 minutes to authorize in your browser)\n")

    # Keep handling requests until we get the callback or timeout
    while not result.get("done"):
        server.handle_request()

    if result.get("error"):
        print(f"ERROR from Canva: {result.get('error')}")
        print(f"Description: {result.get('error_description')}")
        sys.exit(1)

    if not result["code"]:
        print("ERROR: No authorization code received.")
        sys.exit(1)

    if result["state"] != state:
        print("WARNING: State mismatch — possible CSRF. Proceeding anyway for dev.")

    print("Exchanging authorization code for tokens...")
    try:
        tokens = exchange_code(result["code"], code_verifier)
        save_tokens(tokens)
        print(f"\nAccess token: {tokens['access_token'][:20]}...")
        print(f"Token type: {tokens.get('token_type')}")
        print(f"Expires in: {tokens.get('expires_in')} seconds")
        print(f"Scopes: {tokens.get('scope')}")
        print("\nAuthorization complete! You can now use the Canva API.")
    except requests.HTTPError as e:
        print(f"ERROR: Token exchange failed: {e}")
        print(f"Response: {e.response.text}")
        sys.exit(1)


if __name__ == "__main__":
    main()
