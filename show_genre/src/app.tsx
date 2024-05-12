import { GoogleGenerativeAI } from "@google/generative-ai";

// Constants
let accessToken: string | null = null;
let gemini_api_key = 'AIzaSyDKOdPZGOsD8kCR5ZXhIjGIHde_flrxWuo'
let genreDisplay: HTMLDivElement | null = null;
let genre: string | null = null;

async function getAccessToken(forceRefresh = false) {
  if (typeof Spicetify === "undefined" || !Spicetify.Platform || !Spicetify.Platform.AuthorizationAPI) {
    setTimeout(getAccessToken, 1000); // Check every second
  } else {
    console.log('Spicetify loaded', Spicetify.Platform)
    try {
      accessToken = await Spicetify.Platform.Session.accessToken
      // console.log('Access Token:', accessToken);
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

  // Access your API key (see "Set up your API key" above)
  const genAI = new GoogleGenerativeAI(gemini_api_key);

    // For text-only input, use the gemini-pro model
  const model = genAI.getGenerativeModel({ model: "gemini-pro", generationConfig });
  const prompt = `What genre is the song ${trackName} by ${artistName}?`;

  const result = await model.generateContent(prompt);
  const response = result.response.text();
  console.log(prompt, response);
  return response
}


// Function to fetch the genre and update the UI
async function fetchSongGenre() {
  console.log("Fetching song genre...");
  if (!accessToken) {
    console.error("No access token available.");
    return;
  }

  const songData = await fetchCurrentOrLastPlayedSong();
  console.log(songData);
  if (songData) {
    const trackName = songData.name;
    const artistName = songData.artists[0].name;
    genre = await askGemini(trackName, artistName); // Replace 'YOUR_GEMINI_API_KEY' with your actual API key

    // Ensure the genre display container is ready
    if(!genreDisplay) createGenreDisplay();
    if (genreDisplay) {
      updateGenreDisplay(genreDisplay, genre); // Update the genre text
    } else {
      console.log("Genre display container could not be created.");
    }

    console.log(trackName, ",", artistName, ":", genre);
  } else {
    console.log("No song data available.");
  }
}

// Function to ensure the genre display div is created and ready
function createGenreDisplay() {
  // console.log(document.body)
  // console.log(document.querySelector('.main-nowPlayingView-trackInfo'))
  // console.log(document.querySelector('.main-trackInfo-container'))
  const trackInfoContainer = document.querySelector('.main-nowPlayingView-trackInfo') as HTMLDivElement;
  console.log(trackInfoContainer);
  if (!trackInfoContainer) {
    console.log("Track info container not found.");
    return null;
  }
  trackInfoContainer.style.gridTemplateAreas = `"title" "subtitle" "genre"`;
  let genreDisplay = document.querySelector('.main-trackinfo-genre') as HTMLDivElement;
  if (!genreDisplay) {
    genreDisplay = document.createElement('div');
    genreDisplay.className = 'main-trackInfo-genre';
    // genreDisplay.style.display = 'block';
    genreDisplay.style.gridArea = "subtitle";
    trackInfoContainer.appendChild(genreDisplay);
  }
  if (genre) updateGenreDisplay(genreDisplay, genre); // Update the genre text
  else console.log("Genre not available.");
}

// Function to update the genre display with new genre data
function updateGenreDisplay(genreDisplay: HTMLDivElement, genre: string) {
  if (genreDisplay && genre && genreDisplay.textContent !== genre) {
    genreDisplay.textContent = genre;
  }
  console.log('updateGenreDisplay', genreDisplay)
}


export default async function app() {
  console.log('Show genre extension loaded!');
  document.addEventListener('DOMContentLoaded', createGenreDisplay);
  getAccessToken();
}