import requests
import json
import os
from dotenv import load_dotenv
import google.generativeai as genai
import requests
import webbrowser
import urllib.parse


def spotify_user_authorization(client_id, redirect_uri):
    """Generate the Spotify authorization URL and prompt user for authorization."""
    scope = "user-read-currently-playing user-read-recently-played"
    query = {
        "client_id": client_id,
        "response_type": "code",
        "redirect_uri": redirect_uri,
        "scope": scope,
    }
    # auth_url = f"https://accounts.spotify.com/authorize?response_type=code&client_id={CLIENT_ID}&scope={urllib.parse.quote(SCOPE)}&redirect_uri={urllib.parse.quote(REDIRECT_URI)}&state={STATE}&show_dialog={SHOW_DIALOG}"
    # redirect(auth_url)
    url = f"https://accounts.spotify.com/authorize?{urllib.parse.urlencode(query)}"
    webbrowser.open(url)
    print("Please follow the URL to authorize the application.")
    return input("Please enter the code you received: ")


def exchange_code_for_token(client_id, client_secret, code, redirect_uri):
    """Exchange the authorization code for an access token."""
    url = "https://accounts.spotify.com/api/token"
    payload = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": redirect_uri,
        "client_id": client_id,
        "client_secret": client_secret,
    }
    response = requests.post(url, data=payload)
    return response.json()["access_token"]


# Load API keys from .env file
load_dotenv()
client_id = os.getenv("CLIENT_ID")
client_secret = os.getenv("CLIENT_SECRET")
spotify_access_token = "BQAY9K2FcDJJ5vd-U7sGNmutNvFHebQ_62mdfhYsG7fW8iDe7qN8HUf9oOGHQIL4fZ3cj3w9vBtywPeDth5HxrDaR4z9GnVa2N1YSHaQJGx-yKqfmPay8ObQ4f0Z8e_OOzKZw-EEaNRXUTg8L-kBtUwVknaovftZ-OwIpl_hAn-sDj4NUOgJj4-3sIdP6NR58HSIdilUZT9wbjf2_U8"
gemini_api_key = os.getenv("GEMINI_API_KEY")
redirect_uri = os.getenv("REDIRECT_URI")


# def get_spotify_token(client_id, client_secret):
#     """Authenticate and return an access token for the Spotify API."""
#     auth_url = "https://accounts.spotify.com/api/token"
#     try:
#         response = requests.post(
#             auth_url,
#             {
#                 "grant_type": "client_credentials",
#                 "client_id": client_id,
#                 "client_secret": client_secret,
#             },
#         )
#         response.raise_for_status()  # Raises an HTTPError for bad responses
#         return response.json()["access_token"]
#     except requests.RequestException as e:
#         print(f"Error fetching Spotify token: {e}")
#         return None


def fetch_current_or_last_played_song(access_token):
    # """Fetch the currently playing or last played song's data from Spotify."""
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }
    endpoint = "https://api.spotify.com/v1/me/player/currently-playing"
    response = requests.get(endpoint, headers=headers)
    print(response.status_code, response.json())
    if response.status_code == 204 or response.json() is None:  # No content or nothing is playing
        # Fetch last played track if nothing is currently playing
        endpoint = "https://api.spotify.com/v1/me/player/recently-played?limit=1"
        response = requests.get(endpoint, headers=headers)
        return response.json()["items"][0]["track"]  # Return the last played track
    return response.json()["item"]  # Return the currently playing track"""Fetch a song's data from Spotify."""
    # song_id = "3n3Ppam7vgaVa1iaRUc9Lp"
    # song_url = f"https://api.spotify.com/v1/tracks/{song_id}"
    # try:
    #     response = requests.get(song_url, headers=headers)
    #     print(response.status_code, response.json())
    #     response.raise_for_status()
    #     return response.json()
    # except requests.RequestException as e:
    #     print(f"Error fetching song data: {e}")
    #     return None


def ask_gemini(question, api_key):
    """Send a question to the Gemini API and get the response."""
    generation_config = {
        "temperature": 0,
        "top_p": 1,
        "top_k": 1,
        "max_output_tokens": 100,
    }
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(model_name="gemini-pro", generation_config=generation_config)
    response = model.generate_content(question)
    return response.text


# Fetch song data
# spotify_access_token = get_spotify_token(client_id, client_secret)
code = spotify_user_authorization(client_id, redirect_uri)
spotify_access_token = "BQA-P2PfRvIk10JafqKl_9pvfqx6MIepoFTY3icmDTPcmaFtNKB3ApOrRow1skYzISxTPqOdElGlAhE4kXmuvsA9b4Zm_5yE3FRrAcTgbchZq5K_41SsY-Br1hPir9Ak2YDWtALjZDtRAMuZZ1hSKg-WPJqjRu0tIM10O-2yIw4V8v8b-SoY8xJRQ_TA1T-6_HHSLDmNrNDBZeyw8GxLpgVY"
song_data = fetch_current_or_last_played_song(spotify_access_token)
if song_data:
    artist_name = song_data["artists"][0]["name"]
    track_name = song_data["name"]
    question = f"What genre is the song '{track_name}' by {artist_name}?"
    # Get response from Gemini API
    genre_response = ask_gemini(question, gemini_api_key)
    print(genre_response)
else:
    print("No song data available.")
