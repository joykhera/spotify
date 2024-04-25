export async function getAudioData(trackUri: string) {
  const response = await fetch(`https://api.spotify.com/v1/tracks/${trackUri}`);
  const data = await response.json();
  return {
    streams: data.popularity, // Using track popularity as a placeholder for stream count
  };
}