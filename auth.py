import os
from dotenv import load_dotenv
from flask import Flask, request, redirect
import requests
import base64
import urllib

app = Flask(__name__)
load_dotenv()

CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")
SCOPE = "user-library-read user-read-currently-playing user-read-recently-played"
STATE = ""
SHOW_DIALOG = True


# First step: Redirect to Spotify's authorization page
@app.route("/")
def login():
    auth_url = f"https://accounts.spotify.com/authorize?response_type=code&client_id={CLIENT_ID}&scope={urllib.parse.quote(SCOPE)}&redirect_uri={urllib.parse.quote(REDIRECT_URI)}&state={STATE}&show_dialog={SHOW_DIALOG}"
    return redirect(auth_url)


# Second step: Spotify redirects back to your app
@app.route("/callback")
def callback():
    code = request.args.get("code")
    error = request.args.get("error")

    if error:
        return f"Error: {error}"

    # Exchange the code for an access token
    token_url = "https://accounts.spotify.com/api/token"
    token_data = {"grant_type": "authorization_code", "code": code, "redirect_uri": REDIRECT_URI}
    token_headers = {"Authorization": f'Basic {base64.b64encode(f"{CLIENT_ID}:{CLIENT_SECRET}".encode()).decode()}'}

    response = requests.post(token_url, data=token_data, headers=token_headers)
    token_info = response.json()

    # Now you can use the access token to access the Spotify Web API
    access_token = token_info["access_token"]

    return f"Access token: {access_token}"


if __name__ == "__main__":
    app.run(debug=True)
