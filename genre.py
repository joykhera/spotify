import requests
import json
import os
from dotenv import load_dotenv
import google.generativeai as genai
import requests


# Load API keys from .env file
load_dotenv()
client_id = os.getenv("CLIENT_ID")
client_secret = os.getenv("CLIENT_SECRET")
spotify_access_token = "BQAY9K2FcDJJ5vd-U7sGNmutNvFHebQ_62mdfhYsG7fW8iDe7qN8HUf9oOGHQIL4fZ3cj3w9vBtywPeDth5HxrDaR4z9GnVa2N1YSHaQJGx-yKqfmPay8ObQ4f0Z8e_OOzKZw-EEaNRXUTg8L-kBtUwVknaovftZ-OwIpl_hAn-sDj4NUOgJj4-3sIdP6NR58HSIdilUZT9wbjf2_U8"
gemini_api_key = os.getenv("GEMINI_API_KEY")
redirect_uri = os.getenv("REDIRECT_URI")


import requests
import google.generativeai as genai


def fetch_current_or_last_played_song(access_token):
    """Fetch the currently playing or last played song's data from Spotify."""
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }
    endpoint = "https://api.spotify.com/v1/me/player/currently-playing"
    try:
        response = requests.get(endpoint, headers=headers)
        if response.status_code == 204 or not response.content:
            endpoint = "https://api.spotify.com/v1/me/player/recently-played?limit=1"
            response = requests.get(endpoint, headers=headers)
            if response.status_code == 200:
                return response.json()["items"][0]["track"]
            return None
        if(response.status_code == 200):
            return response.json()["item"]
        else:
            print(f"Error fetching song data: {response.status_code}, response: {response.content}")
            return None
    except requests.RequestException as e:
        print(f"Error fetching song data: {e}, response: {response.content}")
        return None


def ask_gemini(question, api_key):
    """Send a question to the Gemini API and get the response."""
    generation_config = {
        "temperature": 0,  # Controls randomness. Low values make responses more deterministic.
        "top_p": 1,  # Nucleus sampling. Keeps the top p% likely next words. 1.0 means no truncation.
        "top_k": 1,  # Limits the responses to the top k probable next words. 1 is the most deterministic.
        "max_output_tokens": 100,  # Sets the maximum length of the model's output.
    }
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(model_name="gemini-pro", generation_config=generation_config)
        response = model.generate_content(question)
        return response.text
    except Exception as e:
        print(f"Error communicating with Gemini API: {e}")
        return None


# Fetch song data
spotify_access_token = "BQA-P2PfRvIk10JafqKl_9pvfqx6MIepoFTY3icmDTPcmaFtNKB3ApOrRow1skYzISxTPqOdElGlAhE4kXmuvsA9b4Zm_5yE3FRrAcTgbchZq5K_41SsY-Br1hPir9Ak2YDWtALjZDtRAMuZZ1hSKg-WPJqjRu0tIM10O-2yIw4V8v8b-SoY8xJRQ_TA1T-6_HHSLDmNrNDBZeyw8GxLpgVY"
song_data = fetch_current_or_last_played_song(spotify_access_token)
if song_data:
    artist_name = song_data["artists"][0]["name"]
    track_name = song_data["name"]
    question = f"What genre is the song '{track_name}' by {artist_name}?"
    # Get response from Gemini API
    genre_response = ask_gemini(question, gemini_api_key)
    print(track_name, ",", artist_name, ":", genre_response)
else:
    print("No song data available.")
