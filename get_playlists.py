import requests


def get_user_playlists(access_token):
    headers = {"Authorization": f"Bearer {access_token}"}
    url = "https://api.spotify.com/v1/me/playlists"

    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        playlists_data = response.json()
        playlists = playlists_data.get("items", [])
        return playlists
    else:
        print("Error:", response.status_code)
        return None


# Replace 'your_access_token' with your actual access token
access_token = "BQAEPFMQ7KR_mCDMlG-VUBl-e_YtmstP7Gs46jlszYC1uIJbLnfJL9wwRDb6BH-tY6a8p54LVvfaWQrw9fCqn-_5dX88k4-50C-oa0x0n3yyVTe_Rb0Gydzzx_TIBoS0lfGGMbbApHRIleSj3v7FKdJQeaNKbJ8CQNTpYfGdE7JavacZ7nkhHW2MiolsBrMztFz63DuU7M0pHn_7_2g"

playlists = get_user_playlists(access_token)
if playlists:
    print("Your Spotify playlists:")
    for playlist in playlists:
        print(playlist["name"])
else:
    print("Failed to retrieve playlists.")
