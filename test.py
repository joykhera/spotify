import os
import base64
from dotenv import load_dotenv
from requests import get, post

load_dotenv()

client_id = os.getenv("CLIENT_ID")
client_secret = os.getenv("CLIENT_SECRET")


def get_token():
    auth_string = f"{client_id}:{client_secret}"
    auth_bytes = auth_string.encode("utf-8")
    auth_base64 = str(base64.b64encode(auth_bytes), "utf-8")

    url = "https://accounts.spotify.com/api/token"
    headers = {"Authorization": f"Basic {auth_base64}", "Content-Type": "application/x-www-form-urlencoded"}
    data = {"grant_type": "client_credentials"}
    result = post(url, headers=headers, data=data)
    json_result = result.json()
    token = json_result["access_token"]
    return token


def get_auth_header():
    token = get_token()
    return {"Authorization": f"Bearer {token}"}


def search_artist(artist):
    url = "https://api.spotify.com/v1/search"
    headers = get_auth_header()
    params = {"q": artist, "type": "artist", "limit": 1}
    result = get(url, headers=headers, params=params)
    json_result = result.json()
    artists = json_result["artists"]["items"]

    if len(artists) == 0:
        print(f"Couldn't find artist {artist}")
        return None

    return artists[0]


def get_songs_by_artist(artist_id):
    url = f"https://api.spotify.com/v1/artists/{artist_id}/top-tracks"
    headers = get_auth_header()
    params = {"country": "US"}
    result = get(url, headers=headers, params=params)
    json_result = result.json()
    songs = json_result["tracks"]
    return songs


artist = search_artist("Juice wrld")
songs = get_songs_by_artist(artist["id"])

for idx, song in enumerate(songs):
    print(f"{idx + 1}. {song['name']}")
