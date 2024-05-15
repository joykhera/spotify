import { GoogleGenerativeAI } from "@google/generative-ai";

// Constants
let accessToken: string | null = null;
let gemini_api_key = 'AIzaSyDKOdPZGOsD8kCR5ZXhIjGIHde_flrxWuo'
let genreDisplays: HTMLDivElement[] = [];
let genre: string | null = null;

async function getAccessToken(forceRefresh = false) {
  if (typeof Spicetify === "undefined" || !Spicetify.Platform || !Spicetify.Platform.AuthorizationAPI) {
    setTimeout(getAccessToken, 1000); // Check every second
  } else {
    try {
      accessToken = await Spicetify.Platform.Session.accessToken
      fetchSongGenre();
      return accessToken;
    } catch (error) {
      console.error('Error retrieving access token:', error);
      return null;
    }
  }
}

// Ensure Spicetify is loaded
if (!window.Spicetify) {
  throw new Error("Spicetify is not loaded.");
}

// Function to fetch the currently playing or last played song
async function fetchCurrentOrLastPlayedSong() {
  const headers = {
    "Authorization": `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
  try {
    let response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", { headers });
    if (response.status === 204 || !response.ok) {
      response = await fetch("https://api.spotify.com/v1/me/player/recently-played?limit=1", { headers });
      const data = await response.json();
      return data.items.length > 0 ? data.items[0].track : null;
    }
    const data = await response.json();
    return data.item;
  } catch (e) {
    console.error("Error fetching song data: ", e);
    return null;
  }
}

// Function to query the Gemini API
async function askGemini(trackName: string, artistName: string) {
  const generationConfig = {
    temperature: 0,  // Controls randomness
    top_p: 1,
    top_k: 1,
    max_output_tokens: 100,
  };

  const genAI = new GoogleGenerativeAI(gemini_api_key);
  const model = genAI.getGenerativeModel({ model: "gemini-pro", generationConfig });
  const prompt = `What genre is the song ${trackName} by ${artistName}?`;
  const result = await model.generateContent(prompt);
  const response = result.response.text();
  // console.log('prompt', prompt, 'response', response);
  return response
}


// Function to fetch the genre and update the UI
async function fetchSongGenre() {
  if (!accessToken) {
    console.error("No access token available.");
    return;
  }

  const songData = await fetchCurrentOrLastPlayedSong();
  if (songData) {
    const trackName = songData.name;
    const artistName = songData.artists[0].name;
    genre = await askGemini(trackName, artistName); // Replace 'YOUR_GEMINI_API_KEY' with your actual API key

    // Ensure the genre display container is ready
    if (!genreDisplays || genreDisplays.length == 0) createGenreDisplay();
    if (genreDisplays) {
      updateGenreDisplay(genreDisplays, genre); // Update the genre text
    } else {
      console.log("Genre display container could not be created.");
    }

    // console.log(trackName, ",", artistName, ":", genre);
  } else {
    console.log("No song data available.");
  }
}

// Function to ensure the genre display div is created and ready
function createGenreDisplay() {
  const trackInfoContainers = document.querySelectorAll('.main-trackInfo-container') as NodeListOf<HTMLDivElement>;
  if (!trackInfoContainers || trackInfoContainers.length === 0) {
    console.log("Track info container not found.");
    return null;
  }
  trackInfoContainers.forEach((trackInfoContainer) => {
    trackInfoContainer.style.gridTemplate = `"pretitle pretitle" "title title" "badges subtitle" "genre genre"/auto 1fr`;
    let genreDisplay = document.querySelector('.main-trackinfo-genre') as HTMLDivElement;
    if (!genreDisplay) {
      genreDisplay = document.createElement('div');
      genreDisplay.className = 'main-trackInfo-genre';
      genreDisplay.style.gridArea = "genre";
      const innerDiv = document.createElement('div');
      innerDiv.className = 'Text__TextElement-sc-if376j-0 TextElement-text-marginal-textSubdued encore-text-marginal main-trackInfo-genre';
      genreDisplay.appendChild(innerDiv);
      trackInfoContainer.appendChild(genreDisplay);
      genreDisplays.push(genreDisplay);
    }
  });
  if (genre) updateGenreDisplay(genreDisplays, genre); // Update the genre text
  else console.log("Genre not available.");
}

// Function to update the genre display with new genre data
function updateGenreDisplay(genreDisplays: HTMLDivElement[], genre: string) {
  genreDisplays.forEach((genreDisplay) => {
    if (genreDisplay && genre && genreDisplay.textContent !== genre && genreDisplay.childElementCount > 0) {
      genreDisplay.children[0].textContent = genre;
    }
  });
}


export default async function app() {
  console.log('Show genre extension loaded!');
  document.addEventListener('DOMContentLoaded', createGenreDisplay);
  await getAccessToken();
  Spicetify.Player.addEventListener("songchange", fetchSongGenre);
}