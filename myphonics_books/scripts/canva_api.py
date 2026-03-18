"""
Canva Connect API — Design operations.
Requires running canva_auth.py first to get tokens.
"""
import json
import sys

import requests

from canva_auth import get_access_token, load_tokens

BASE_URL = "https://api.canva.com/rest/v1"


def headers():
    token = get_access_token()
    if not token:
        print("No valid access token. Run canva_auth.py first.")
        sys.exit(1)
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }


def get_design(design_id):
    """Get metadata for a design."""
    resp = requests.get(f"{BASE_URL}/designs/{design_id}", headers=headers())
    resp.raise_for_status()
    return resp.json()


def list_designs(limit=20):
    """List the user's designs."""
    resp = requests.get(f"{BASE_URL}/designs", headers=headers(), params={"limit": limit})
    resp.raise_for_status()
    return resp.json()


def export_design(design_id, format="pdf"):
    """Start an export job for a design."""
    resp = requests.post(
        f"{BASE_URL}/designs/{design_id}/exports",
        headers=headers(),
        json={"format": format},
    )
    resp.raise_for_status()
    return resp.json()


def get_export_status(design_id, export_id):
    """Check export job status."""
    resp = requests.get(
        f"{BASE_URL}/designs/{design_id}/exports/{export_id}",
        headers=headers(),
    )
    resp.raise_for_status()
    return resp.json()


def list_user_profile():
    """Get the current user's profile."""
    resp = requests.get(f"{BASE_URL}/users/me", headers=headers())
    resp.raise_for_status()
    return resp.json()


def upload_asset(file_path, name=None):
    """Upload an image asset to Canva."""
    import os
    if name is None:
        name = os.path.basename(file_path)
    with open(file_path, "rb") as f:
        resp = requests.post(
            f"{BASE_URL}/assets",
            headers={
                "Authorization": f"Bearer {get_access_token()}",
            },
            files={"file": (name, f)},
            data={"name": name},
        )
    resp.raise_for_status()
    return resp.json()


if __name__ == "__main__":
    # Quick test: fetch user profile
    print("Testing Canva API connection...\n")
    try:
        profile = list_user_profile()
        print(f"Connected as: {json.dumps(profile, indent=2)}")
    except requests.HTTPError as e:
        print(f"API Error: {e}")
        print(f"Response: {e.response.text}")
    except Exception as e:
        print(f"Error: {e}")
