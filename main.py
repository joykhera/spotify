import time
import requests

access_token = "BQCEkjL-tMBirGsh3jgixvDWhN55ts41EhW61fWn5biki7oSxKEZ_u4MV0P7Cv2DbjBlu_v_SEv4ZBFdo7erOBNwtKdXGuGwV6N-_2nhQY2AVRzHO6W2KqtOWbY-_4TPFT4KOjjtIKtuO9Vcr4gJZN2Rt-LX7f2vZtimZgKgF_1Fry_jJmA86-rWTwhHxr12P1YqIfKBAF_doU_WNek"
headers = {"Authorization": f"Bearer {access_token}"}
playlists_ids = {
    "pop": "01wO8tnZzlwZ2jPh9y4yga",
    "rock": "6W0J3Sp1Elvs6iuNkdmGY5",
    "indie": "6yWMH7pqVZatPh2wRe7JbW",
    "drill": "7jI4ygfYuSvpqunAZS9Wex",
}


def search_musicbrainz_for_track(artist_name, track_name):
    """Search MusicBrainz for a track matching the artist and track name."""
    time.sleep(1)  # Respect MusicBrainz's rate limit
    query = f'artist:"{artist_name}" AND recording:"{track_name}"'
    url = f"https://musicbrainz.org/ws/2/recording?query={query}&fmt=json"
    response = requests.get(url)
    if response.status_code == 200:
        recordings = response.json()["recordings"]
        if recordings:
            # Assuming the first match is the best, but you might need a more refined approach
            for recording in recordings:
                # Check if there's a 'releases' list and return the first release ID found
                if "releases" in recording and recording["releases"]:
                    return recording["releases"][0]["id"]
    else:
        print("Error searching MusicBrainz for track:", response.status_code)
    return None


def get_musicbrainz_release_genres(release_id):
    """Fetch genres (tags) associated with a MusicBrainz release."""
    time.sleep(1)  # Respect MusicBrainz's rate limit
    url = f"https://musicbrainz.org/ws/2/release/{release_id}?inc=tags&fmt=json"
    response = requests.get(url)
    if response.status_code == 200:
        print(response.json())
        tags = response.json().get("tags", [])
        genres = [tag["name"] for tag in tags]
        return genres
    else:
        print("Error fetching MusicBrainz release genres:", response.status_code)
    return []


def fetch_playlist_tracks(playlist_id):
    """Fetch all tracks in a playlist."""
    tracks = []
    url = f"https://api.spotify.com/v1/playlists/{playlist_id}/tracks"
    while url:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            tracks.extend([(item["track"]["id"], item["track"]["uri"]) for item in data["items"]])
            url = data["next"]  # URL for the next page, if any
        else:
            print(f"Error fetching tracks for playlist {playlist_id}")
            break
    return tracks


def get_all_playlist_tracks():
    """Get all tracks for each playlist and store them."""
    playlist_tracks = {}
    for genre, playlist_id in playlists_ids.items():
        playlist_tracks[playlist_id] = fetch_playlist_tracks(playlist_id)
    return playlist_tracks


def add_song_to_playlist(playlist_id, track_uri):
    """Add a song to a playlist."""
    add_tracks_endpoint = f"https://api.spotify.com/v1/playlists/{playlist_id}/tracks"
    response = requests.post(add_tracks_endpoint, headers=headers, json={"uris": [track_uri]})
    return response.status_code == 201


def get_liked_songs(total_songs=None):
    liked_songs = []
    endpoint = "https://api.spotify.com/v1/me/tracks"
    limit = 50
    offset = 0

    while True:
        query = f"?limit={limit}&offset={offset}"
        response = requests.get(endpoint + query, headers=headers)
        if response.status_code == 200:
            res = response.json()
            items_fetched = len(res["items"])
            for item in res["items"]:
                if total_songs is not None and len(liked_songs) >= total_songs:
                    break  # Stop if we've reached the specified total number of songs
                track_info = item["track"]
                liked_songs.append(
                    {
                        "name": track_info["name"],
                        "artist": track_info["artists"][0]["name"],
                    }
                )

            if not res["next"] or (total_songs is not None and len(liked_songs) >= total_songs):
                break  # Stop if there are no more songs or we've reached the specified number
            offset += limit
        else:
            print("Failed to fetch liked songs", response)
            break

    return liked_songs[:total_songs] if total_songs is not None else liked_songs


def get_playlist_tracks():
    endpoint = f"https://api.spotify.com/v1/me/playlists"
    response = requests.get(endpoint, headers=headers)
    if response.status_code == 200:
        playlists = response.json()
        return playlists["items"]
    else:
        print("Failed to get playlist", response)
        return []


liked_songs = get_liked_songs(total_songs=10)  # Example to fetch only 10 songs
print(liked_songs, len(liked_songs))
# playlists = get_playlist_tracks()
# print(list(map(lambda x: x["name"], playlists)))

for song in liked_songs:
    musicbrainz_release_id = search_musicbrainz_for_track(song["artist"], song["name"])
    if musicbrainz_release_id:
        genres = get_musicbrainz_release_genres(musicbrainz_release_id)
        print(f"Genres for {song['name']} - {song['artist']}: {genres}")
    else:
        print(f"MusicBrainz release not found for track: {song['name']} - {song['artist']}")
