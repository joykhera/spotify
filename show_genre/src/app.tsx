// This imports the new Gemini LLM
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

// This imports the mechanism that helps create the messages
// called `prompts` we send to the LLM
import { PromptTemplate } from "langchain/prompts";

// This imports the tool called `chains` that helps combine
// the model and prompts so we can communicate with the LLM
import { LLMChain } from "langchain/chains";

// This helps connect to our .env file
import * as dotenv from "dotenv";
dotenv.config();

// Constants
let accessToken: string | null = null;
let gemini_api_key = 'AIzaSyDKOdPZGOsD8kCR5ZXhIjGIHde_flrxWuo'

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
  // const payload = {
  //   question: question,
  //   temperature: 0,  // Controls randomness
  //   top_p: 1,
  //   top_k: 1,
  //   max_output_tokens: 100,
  // };
  // We create our model and pass it our model name
  // which is `gemini-pro`. Another option is to pass
  // `gemini-pro-vision` if we were also sending an image
  // in our prompt
  const geminiModel = new ChatGoogleGenerativeAI({
    modelName: "gemini-pro",
  });

  const template = `What genre is the song {trackName} by {artistName}?`;
  const promptTemplate = new PromptTemplate({
    template,
    inputVariables: ["emojis"],
  });


  // We then use a chain to combine our LLM with our
  // prompt template
  const llmChain = new LLMChain({
    llm: geminiModel,
    prompt: promptTemplate,
  });

  // We then call the chain to communicate with the LLM
  // and pass in the emojis we want to be explained.
  // Note that the property name `emojis` below must match the
  // variable name in the template earlier created.
  const result = await llmChain.call({
    trackName: trackName,
    artistName: artistName,
  });

  // Log result to the console
  console.log(result.text);
  return result.text;

  // const headers = {
  //   "Authorization": `Bearer ${gemini_api_key}`,
  //   "Content-Type": "application/json",
  // };
  // try {
  //   const response = await fetch("https://api.gemini.com/generate-text", {
  //     method: "POST",
  //     headers: headers,
  //     body: JSON.stringify(payload)
  //   });
  //   const data = await response.json();
  //   // console.log(question, response.status, data)
  //   return data.text;
  // } catch (e) {
  //   console.error("Error communicating with Gemini API: ", e);
  //   return "Unknown genre";
  // }
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
    // const genre = await askGemini(promptTemplate); // Replace 'YOUR_GEMINI_API_KEY' with your actual API key
    const genre = await askGemini(trackName, artistName); // Replace 'YOUR_GEMINI_API_KEY' with your actual API key

    // Ensure the genre display container is ready
    const genreDisplay = createGenreDisplay();
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
  const trackInfoContainer = document.querySelector('.main-nowPlayingView-trackInfo main-trackInfo-container');
  console.log(trackInfoContainer);
  if (!trackInfoContainer) {
    console.log("Track info container not found.");
    return null;
  }

  let genreDisplay = document.querySelector('.genre-display');
  if (!genreDisplay) {
    genreDisplay = document.createElement('div');
    genreDisplay.className = 'genre-display';
    trackInfoContainer.appendChild(genreDisplay);
  }
  return genreDisplay as HTMLDivElement;
}

// Function to update the genre display with new genre data
function updateGenreDisplay(genreDisplay: HTMLDivElement, genre: string) {
  if (genreDisplay && genre && genreDisplay.textContent !== `Genre: ${genre}`) {
    genreDisplay.textContent = `Genre: ${genre}`;
  }
}


export default async function app() {
  console.log('Show genre extension loaded!');
  getAccessToken();
  createGenreDisplay()
}