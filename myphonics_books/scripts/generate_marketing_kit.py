import os
import requests
from dotenv import load_dotenv

def generate_marketing_visuals():
    # Load environment variables from .env
    load_dotenv()
    
    kie_api_key = os.getenv("KIE_API_KEY")
    if not kie_api_key or kie_api_key.startswith("your_"):
        print("ERROR: Please add your real KIE_API_KEY to the .env file first!")
        return
        
    print("Kie API Key found. Initiating generation...")
    headers = {
        "Authorization": f"Bearer {kie_api_key}",
        "Content-Type": "application/json"
    }
    
    # 1. Image Generation (Midjourney endpoint mapping)
    image_prompt = (
        "Cinematic, high-resolution photo of a modern elementary school classroom whiteboard. "
        "Empty classroom, no people, no faces, no humans. On the whiteboard, written in neat "
        "teacher handwriting in black dry-erase marker: 'Did you know? 68% of parents don't "
        "know their child's true reading age.' Soft morning sunlight streaming through the "
        "windows, casting gentle shadows. Professional photography, sharp focus on the "
        "whiteboard text, shallow depth of field, 8k, photorealistic."
    )
    
    print("\n--- Generating Image via Kie AI ---")
    image_payload = {
        "model": "midjourney", 
        "prompt": image_prompt
    }
    
    try:
        img_resp = requests.post("https://api.kie.ai/v1/images/generations", headers=headers, json=image_payload)
        print(f"Image API Status: {img_resp.status_code}")
        if img_resp.status_code == 200:
            print("Success! Image Response:", img_resp.json())
        else:
            print("Failed Response:", img_resp.text)
    except Exception as e:
        print(f"Image generation failed: {e}")
        
    # 2. Video Generation (Runway / Gen-3 is available on Kie as per docs)
    video_prompt = (
        "Cinematic slow pan across a modern elementary school classroom bathed in soft morning sunlight. "
        "The camera moves smoothly towards a pristine whiteboard. Empty classroom, absolutely no people or faces. "
        "Professional lighting, 4k resolution, highly detailed."
    )
    
    print("\n--- Generating Video via Kie AI ---")
    runway_payload = {
        "prompt": video_prompt
    }
    
    try:
        vid_resp = requests.post("https://api.kie.ai/api/v1/runway/generate", headers=headers, json=runway_payload)
        print(f"Video API Status: {vid_resp.status_code}")
        if vid_resp.status_code == 200:
            print("Success! Video Response:", vid_resp.json())
        else:
            print("Failed Response:", vid_resp.text)
    except Exception as e:
        print(f"Video generation failed: {e}")

if __name__ == "__main__":
    generate_marketing_visuals()
