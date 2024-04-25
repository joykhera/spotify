// Constants
let accessToken: string | null = null;
let likedSongs: any = [];

async function getAccessToken() {
  if (typeof Spicetify === "undefined" || !Spicetify.Platform || !Spicetify.Platform.AuthorizationAPI) {
    console.log("Spicetify is not loaded yet. Waiting...");
    setTimeout(getAccessToken, 1000); // Check every second
  } else {
    console.log('Spicetify loaded', Spicetify.Platform)
    try {
      // await waitForSpicetifyLoaded();
      // console.log('sdfs')
      accessToken = await Spicetify.Platform.Session.accessToken
      // const accessToken = await Spicetify.Platform.AuthorizationAPI.getAccessToken()
      console.log('Access Token:', accessToken);
      likedSongs = await fetchLikedSongs();
      console.log('Liked Songs:', likedSongs);
      updateRowsWithStreamCount();
      return accessToken;
    } catch (error) {
      console.error('Error retrieving access token:', error);
      return null;
    }
  }
}

// Helper function to fetch liked songs
async function fetchLikedSongs() {
  let url = 'https://api.spotify.com/v1/me/tracks?limit=50'; // Start with the first 50 songs
  let allSongs: any = []; // Array to store all liked songs

  try {
    while (url) { // Continue looping as long as there's a URL to fetch from
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.log(response, accessToken);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      allSongs = allSongs.concat(data.items); // Add the fetched songs to the array

      url = data.next; // Get the URL for the next page of songs, if any
    }

    return allSongs; // Return all liked songs once fetching is complete
  } catch (error) {
    console.error('Error fetching liked songs:', error);
    return []; // Return an empty array in case of an error
  }
}

// Function to add stream count for each row
async function updateRowsWithStreamCount() {
  const rows = document.querySelectorAll('.main-trackList-trackListRow');

  rows.forEach((row, index) => {
    // Ensure that the 'aria-colindex' for all elements is updated to accommodate the new popularity column
    const cells = row.querySelectorAll('[role="gridcell"]');
    cells.forEach((cell, idx: number) => {
      cell.setAttribute("aria-colindex", (idx + 1).toString()); // Update existing columns index
    });

    // Check if the popularity cell already exists to prevent adding it twice
    let popularityCell = row.querySelector('.main-trackList-popularityCell');
    if (!popularityCell) {
      // Create a new cell for popularity if it doesn't exist
      popularityCell = document.createElement('div');
      popularityCell.classList.add('main-trackList-rowSectionVariable', 'main-trackList-popularityCell'); // Added class for identification
      popularityCell.setAttribute("role", "gridcell");
      popularityCell.setAttribute("aria-colindex", "5"); // Popularity at index 5
      popularityCell.textContent = likedSongs[index].track.popularity.toString();

      // Find the duration cell to insert before it, or append if not found
      const durationCell = row.querySelector('.main-trackList-rowSectionEnd');
      if (durationCell) {
        row.insertBefore(popularityCell, durationCell);
      } else {
        row.appendChild(popularityCell); // Append at the end if no duration cell
      }

      // Adjust duration cell to the new index
      if (durationCell) {
        durationCell.setAttribute("aria-colindex", "6");
      }
    }
  });

  const trackList = document.querySelector('.main-trackList-trackList');
  console.log('trackList', trackList)
}

async function addStreamCountColumn() {
  const headerRow = document.querySelector('.main-trackList-trackListHeader')!.children[0];
  if (!headerRow) {
    console.error('Header row not found');
    return;
  }

    const popularityColumn = document.createElement("div");
    popularityColumn.classList.add("main-trackList-rowSectionVariable");
    popularityColumn.setAttribute("role", "columnheader");
    popularityColumn.setAttribute("aria-colindex", "5");
    popularityColumn.setAttribute("aria-sort", "none");
    popularityColumn.setAttribute("tabindex", "-1");
    popularityColumn.style.display = "flex";

    // Create a button that when clicked, will sort by popularity
    const popularityButton = document.createElement("button");
    popularityButton.className = "main-trackList-column main-trackList-sortable";
    popularityButton.tabIndex = -1;
    popularityButton.innerHTML = `<span class="Text__TextElement-sc-if376j-0 TextElement-text-bodySmall encore-text-body-small standalone-ellipsis-one-line" data-encore-id="text">Popularity</span>`;
    popularityButton.onclick = sortTracksByPopularity

    popularityColumn.appendChild(popularityButton);

    // Insert the "Popularity" column into the header row
    const durationColumn = headerRow.querySelector(".main-trackList-rowSectionEnd");
    if (durationColumn) {
      headerRow.insertBefore(popularityColumn, durationColumn);
      // Update the aria-colindex attribute of the "Duration" column
      durationColumn.setAttribute("aria-colindex", "6");
    } else {
      headerRow.appendChild(popularityColumn);
    }

    // Update the grid template columns for the track list rows
    const trackList = document.querySelector(
      ".main-trackList-trackList.main-trackList-indexable"
    );
    if (trackList) {
      trackList.setAttribute("aria-colcount", "6");

      const trackListRowGrid = document.querySelector(".main-trackList-trackListRowGrid") as HTMLElement;
      trackListRowGrid.style.gridTemplateColumns = `
      [index] var(--tracklist-index-column-width, 16px)
      [first] minmax(120px, var(--col1, 6fr))
      [var1] minmax(120px, var(--col2, 4fr))
      [var2] minmax(120px, var(--col3, 3fr))
      [var3] minmax(120px, var(--col4, 2fr))
      [last] minmax(120px, var(--col6, 1fr))
    `;
    }
}

// Function to sort tracks by popularity
function sortTracksByPopularity() {
  console.log('Sorting tracks by popularity...');

  const trackList = document.querySelector('.main-trackList-trackList')!.children[1];
  console.log('trackList', trackList)
  if (!trackList) {
    console.error("Track list not found!");
    return;
  }

  // Gather all the track rows into an array
  let tracks = Array.from(trackList.querySelectorAll('.main-trackList-trackListRow'));

  // Assuming each row has a 'data-popularity' attribute or we extract from an element
  tracks.sort((a, b) => {
    let popA = parseInt(a.querySelector('.main-trackList-popularityCell')!.textContent!);
    let popB = parseInt(b.querySelector('.main-trackList-popularityCell')!.textContent!);
    console.log(a, b, popA, popB)
    return popB - popA; // Sort descending
  });

  // Clear the existing track list before re-adding sorted rows
  // console.log('trackList', trackList)
  while (trackList.firstChild) {
    trackList.removeChild(trackList.firstChild);
  }

  // Reattach sorted rows to the DOM
  tracks.forEach(track => {
    trackList.appendChild(track); // Appending an existing element moves it to the new position
  });
}


// MutationObserver to handle new songs added dynamically
function observeTrackListChanges() {
  const trackList = document.querySelector('.main-trackList-trackList');
  if (!trackList) {
    console.error('Track list element not found!');
    return;
  }

  const observer = new MutationObserver((mutations) => {
    let updateRequired = false;  // Flag to track if an update is needed
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // console.log('Mutation detected:', mutation);
        updateRequired = true;  // Set flag to true if any relevant mutation is found
      }
    }

    // Check after all mutations if an update is needed
    if (updateRequired) {
      observer.disconnect();  // Disconnect observer before updating the DOM
      updateRowsWithStreamCount();
      observer.observe(trackList, { childList: true, subtree: true });  // Reconnect observer after DOM update
    }
  });

  observer.observe(trackList, { childList: true, subtree: true });
}

export default async function app() {
  console.log('Stream Count extension loaded!');
  let isLikedSongsPageDetected = false;

  // Solution 1: Checking for a unique element on the Liked Songs page
  function checkForLikedSongsPage() {
    const likedSongsPageElement = document.querySelector('[data-testid="playlist-page"] h1'); // Assuming the h1 with the playlist title is unique to the page
    if (likedSongsPageElement && likedSongsPageElement.textContent === 'Liked Songs') {
      if (!isLikedSongsPageDetected) {
        console.log('Liked songs page found!');
        addStreamCountColumn();
        observeTrackListChanges();
        isLikedSongsPageDetected = true;
      }
    } else {
      isLikedSongsPageDetected = false; // Reset the flag if not on the page
      // console.log('Liked songs page not found');
    }
  }

  // Solution 2: Using a MutationObserver to detect page changes (more reliable but complex)
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.target === document.body) {
        // debouncedCheckForLikedSongsPage(); // Call the debounced function
        checkForLikedSongsPage();
      }
    });
  });
  // console.log(document.body)
  observer.observe(document.body, { childList: true, subtree: true }); // Observe the entire document for changes

  // Initial check when the extension loads
  getAccessToken();
  checkForLikedSongsPage();
}