#!/usr/bin/env python3
"""
Fish Audio Voice Cloning Script
Creates a custom voice model from an audio file
"""

import sys
import os
from pathlib import Path

try:
    from fish_audio_sdk import Session, TTSRequest
except ImportError:
    print("ERROR: fish_audio_sdk not installed")
    print("Run: pip install fish-audio-sdk")
    sys.exit(1)

def create_voice_model(api_key: str, audio_path: str, user_id: str):
    """Create a Fish Audio voice model from an audio file"""
    
    print(f"🎤 Creating voice model for user: {user_id}")
    print(f"📁 Audio file: {audio_path}")
    
    if not os.path.exists(audio_path):
        print(f"ERROR: Audio file not found: {audio_path}")
        sys.exit(1)
    
    # Initialize session
    session = Session(api_key)
    
    try:
        # Check credits
        credits = session.get_api_credit()
        print(f"💰 Available credits: {credits.credit}")
        
        if credits.credit <= 0:
            print("ERROR: No credits available")
            sys.exit(1)
        
        # Create model
        print("🔨 Creating model...")
        
        # Upload audio and create model
        with open(audio_path, 'rb') as f:
            audio_data = f.read()
        
        # Fish Audio SDK method to create voice from audio
        model = session.create_model(
            title=f"Clone_{user_id[:8]}",
            description="Custom voice clone",
            audio=audio_data,
            type="tts",
            train_mode="fast"
        )
        
        print(f"✅ Voice model created!")
        print(f"📌 Model ID: {model.id}")
        
        # Return model ID
        print(f"VOICE_MODEL_ID:{model.id}")
        return model.id
        
    except Exception as e:
        print(f"ERROR: {str(e)}")
        sys.exit(1)
    finally:
        session.close()

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: create_fish_voice.py <api_key> <audio_path> <user_id>")
        sys.exit(1)
    
    api_key = sys.argv[1]
    audio_path = sys.argv[2]
    user_id = sys.argv[3]
    
    create_voice_model(api_key, audio_path, user_id)

