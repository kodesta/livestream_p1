/*==========================================================================
   LIVESTREAM - CLIENT APPLICATION CONTROLLER
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  // --- APPLICATION STATE ---
  let appData = [];
  let favorites = JSON.parse(localStorage.getItem('livestream_favorites')) || [];
  let activeItem = null;
  let activeEpisode = null;
  let currentFilters = {
    search: '',
    category: 'all', // 'all', 'movies-all', 'movies-recent', 'movies-old', 'tv-all', 'tv-recent', 'tv-old'
    genre: '',
    country: ''
  };

  // --- DOM ELEMENT REFERENCES ---
  // Header Elements
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const searchInput = document.getElementById('search-input');
  const searchClearBtn = document.getElementById('search-clear-btn');
  //modal elements
  
  const loginModal = document.getElementById('login-modal');
  const loginLink = document.getElementById('login-link');
  const loginCloseBtn = document.getElementById('loginclose-btn');
  const loginOverlay = document.getElementById('loginoverlay');
  // Navigation Drawer Elements
  const drawerOverlay = document.getElementById('drawer-overlay');
  const navDrawer = document.getElementById('nav-drawer');
  const drawerCloseBtn = document.getElementById('drawer-close-btn');
  const drawerMenuItems = document.querySelectorAll('.menu-item, .sub-menu-item');
  const genreTags = document.querySelectorAll('.genre-tag');
  const countryTags = document.querySelectorAll('.country-tag');
  const sectionToggles = document.querySelectorAll('.menu-section-header');
  // Left Sidebar Elements
  const sidebarLeft = document.getElementById('sidebar-left');
  const catalogList = document.getElementById('catalog-list');
  const catalogCount = document.getElementById('catalog-count');
  const catalogTitle = document.getElementById('catalog-title');
  const resizeHandle = document.getElementById('resize-handle');
  

  // Video Player Elements
  const videoPlayer = document.getElementById('main-video-player');
  const videoContainer = document.getElementById('video-container');
  const playerControls = document.getElementById('player-controls');
  const playPauseBtn = document.getElementById('play-pause-btn');
  const bigPlayBtn = document.getElementById('big-play-btn');
  const muteBtn = document.getElementById('mute-btn');
  const volumeSlider = document.getElementById('volume-slider');
  const currentTimeDisplay = document.getElementById('current-time');
  const durationTimeDisplay = document.getElementById('duration-time');
  const playerTitleDisplay = document.getElementById('player-title-display');
  const progressContainer = document.getElementById('progress-container');
  const progressFill = document.getElementById('progress-fill');
  const progressBuffer = document.getElementById('progress-buffer');
  const progressHandle = document.getElementById('progress-handle');
  const progressHoverTime = document.getElementById('progress-hover-time');
  const theaterBtn = document.getElementById('theater-btn');
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  // Reaction Elements
  const reactionButtons = document.querySelectorAll('.reaction-btn');
  // Description / Tabs Elements
  const activeTitle = document.getElementById('active-title');
  const activeRating = document.getElementById('active-rating');
  const activeRank = document.getElementById('active-rank');
  const activeDuration = document.getElementById('active-duration');
  const activeCountry = document.getElementById('active-country');
  const activeStudio = document.getElementById('active-studio');
  const activeDescription = document.getElementById('active-description');
  const activeCast = document.getElementById('active-cast');
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  // Right Sidebar Elements
  
  const rightSidebarTitle = document.getElementById('right-sidebar-title');
  const rightSidebarDesc = document.getElementById('right-sidebar-desc');
  const rightPlaylistContainer = document.getElementById('right-playlist-container');
  const emptyPlaylist = document.getElementById('empty-playlist');
  const favoritesStack = document.getElementById('favorites-stack');
  const episodesView = document.getElementById('episodes-view');
  const seasonSelect = document.getElementById('season-select');
  const episodesList = document.getElementById('episodes-list');
 const resizeRight = document.getElementById('resize-handle-right');
const sidebarRight = document.getElementById('sidebar-right');
  // Global Hover Popover
  const hoverPopover = document.getElementById('hover-popover');
  // Modal Elements
  const browseModal = document.getElementById('browse-modal');
  const modalOverlay = document.getElementById('modal-overlay');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalTitle = document.getElementById('modal-title');
  const modalGrid = document.getElementById('modal-grid');
  const backToFavsBtn = document.getElementById('back-to-favs-btn');
  const movieGrid =  document.getElementById('movie-grid');
  // Sign Up Modal Elements
  const signupBtn = document.getElementById('signup-btn');
  const signupModal = document.getElementById('signup-modal');
  const signupOverlay = document.getElementById('signup-overlay');
  const signupCloseBtn = document.getElementById('signup-close-btn');
  const signupForm = document.getElementById('signup-form');
  //login
  const loginBtn = document.getElementById('login-btn');
  //logout
  const logOut = document.getElementById('log-out');
   //icon for log
   

  // --- INITIALIZATION ---
  init();
  function init() {
    fetchCatalog();
    setupEventListeners();
    renderFavorites();
    checkSession(); // ← add this
  }

  function checkSession() {
  const user = localStorage.getItem('livestream_user');
  if (user) {
    loggedIn(JSON.parse(user));
  }
}

  // --- API CALLS ---
  /*function fetchCatalog() {
    fetch('/api/movies')
      .then(res => res.json())
      .then(data => {
        appData = data;
        renderCatalog();

        // Auto-select first item if available
        if (appData.length > 0) {
          selectItem(appData[0]);
        }
      })
      .catch(err => {
        console.error("Failed to load catalog:", err);
        catalogList.innerHTML = `<div class="error-msg">Error loading catalog. Please check backend.</div>`;
      });
  }*/

  function fetchCatalog(){
    Promise.all([
      fetch('/api/movies').then(res=>res.json()),
      fetch('/api/trending').then(res=>res.json()).catch(()=>[])
    ])
    .then(([uploadedMovies, trendingTrailers])=>{
      appData = [...trendingTrailers, ...uploadedMovies];
      renderCatalog();
      if(appData.length > 0){
        selectItem(appData[0]);

      }
    }).catch(err=>{
       console.error('Failed to load catalog', err);
      catalogList.innerHTML = `<div class="error-msg">Error loading catalog. Please check connection.</div>`;
    });
     

  }

  // --- EVENT LISTENERS ---
  function setupEventListeners() {
    // Hamburger / Drawer
    hamburgerBtn.addEventListener('click', toggleDrawer);
    drawerCloseBtn.addEventListener('click', toggleDrawer);
    drawerOverlay.addEventListener('click', toggleDrawer);

    // Expandable Menu Folders
    sectionToggles.forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        const parent = toggle.parentElement;
        parent.classList.toggle('open');
      });
    });

    // Drawer Filters
    drawerMenuItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const filterVal = item.getAttribute('data-filter');
        if (filterVal === 'all') {
          currentFilters.category = 'all';
          currentFilters.genre = '';
          currentFilters.country = '';
          updateCatalogTitle();
          renderCatalog();
          toggleDrawer();
        } else {
          const parts = filterVal.split('-');
          const type = parts[0] === 'movies' ? 'Movies' : 'TV Shows';
          const detail = parts[1] === 'recent' ? 'Recent' : parts[1] === 'old' ? 'Classic' : 'All';
          openBrowseModal('category', filterVal, `Browse ${detail} ${type}`);
        }
      });
    });

    // Genre Filter Tags
    genreTags.forEach(tag => {
      tag.addEventListener('click', (e) => {
        e.preventDefault();
        const genre = tag.getAttribute('data-genre');
        openBrowseModal('genre', genre, `Browse Genre: ${genre}`);
      });
    });

    // Country Filter Tags
    countryTags.forEach(tag => {
      tag.addEventListener('click', (e) => {
        e.preventDefault();
        const country = tag.getAttribute('data-country');
        openBrowseModal('country', country, `Browse Origin: ${country}`);
      });
    });

    // Search input
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.trim().toLowerCase();
      currentFilters.search = query;
      if (query.length > 0) {
        searchClearBtn.style.display = 'block';
        showSearchDropdown(query);
      } else {
        searchClearBtn.style.display = 'none';
        hideSearchDropdown();
      }
    });

    // Enter key support
    searchInput.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (!query) return;
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
          const results = await res.json();
          if (results.length > 0) {
            selectItem(results[0]);
            searchInput.value = '';
            currentFilters.search = '';
            searchClearBtn.style.display = 'none';
            hideSearchDropdown();
          }
        } catch (err) {
          console.error('Search enter error:', err);
        }
      }
    });

    searchClearBtn.addEventListener('click', () => {
      searchInput.value = '';
      currentFilters.search = '';
      searchClearBtn.style.display = 'none';
      hideSearchDropdown();
    });

    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target)) {
        hideSearchDropdown();
      }
    });

    // Left Sidebar Resize
    let isResizing = false;
    resizeHandle.addEventListener('mousedown', (e) => {
      isResizing = true;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      resizeHandle.classList.add('active');
    });
    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      let newWidth = e.clientX;
      if (newWidth < 120) {
        sidebarLeft.classList.add('compact');
      } else {
        sidebarLeft.classList.remove('compact');
        if (newWidth > 500) newWidth = 500;
        if (newWidth < 200) newWidth = 200;
        sidebarLeft.style.width = newWidth + 'px';
      }
    });
    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
        resizeHandle.classList.remove('active');
      }
    });

    //left siderbar to modal
   
    movieGrid.addEventListener('click', () => {
  openBrowseModal('all', null, 'Full Catalog');
});

    /*movieGrid.addEventListener('click', ()=>{
      movieGrid.innerHTML = `<div class="grid-block" >
        <span class="close-grid" id="close-grid" style="font-size: 40px; color: black">x</span>
        
         <!-- Movie/Show Catalog Cards -->
      <div class="catalog-list" id="catalog-list">
        <!-- Rendered dynamically by app.js -->
        
        ${catalogList ? catalogList :<div class="loading-spinner"><i class="fa-solid fa-circle-notch fa-spin"></i> Loading...</div>}
      </div>
      </div>`;
      

  const closeGrids= document.getElementById('close-grid');
  const gridBlock= document.querySelector('.grid-block');
  
  
  closeGrids.addEventListener('click', (e)=>{
    e.stopPropagation()
    gridBlock.style.display = 'none';


  })
     

    })*/

  

  



    // Right Sidebar Resize
    let rightResizing = false;
    resizeRight.addEventListener('mousedown', (e) => {
      rightResizing = true;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      resizeRight.classList.add('active');
    });
    document.addEventListener('mousemove', (e) => {
      if (!rightResizing) return;
      let newWidth = window.innerWidth - e.clientX;
      if (newWidth < 120) {
        sidebarRight.classList.add('compact');
      } else {
        sidebarRight.classList.remove('compact');
        if (newWidth > 500) newWidth = 500;
        if (newWidth < 200) newWidth = 200;
        sidebarRight.style.width = newWidth + 'px';
      }
    });
    document.addEventListener('mouseup', () => {
      if (rightResizing) {
        rightResizing = false;
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
        resizeRight.classList.remove('active');
      }
    });

    // Video Player Controls
    playPauseBtn.addEventListener('click', togglePlay);
    bigPlayBtn.addEventListener('click', togglePlay);
    videoPlayer.addEventListener('click', togglePlay);
    videoPlayer.addEventListener('play', () => {
      playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
      bigPlayBtn.classList.add('hidden');
    });
    videoPlayer.addEventListener('pause', () => {
      playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
      bigPlayBtn.classList.remove('hidden');
    });
    videoPlayer.addEventListener('timeupdate', updateProgress);
    videoPlayer.addEventListener('progress', updateBuffer);

    // Mute/Volume
    muteBtn.addEventListener('click', toggleMute);
    volumeSlider.addEventListener('input', () => {
      videoPlayer.volume = volumeSlider.value;
      videoPlayer.muted = volumeSlider.value === '0';
      updateVolumeIcon();
    });

    // Scrubber
    let isScrubbing = false;
    progressContainer.addEventListener('mousedown', (e) => {
      isScrubbing = true;
      scrub(e);
    });
    document.addEventListener('mousemove', (e) => {
      if (isScrubbing) scrub(e);
      if (progressContainer.contains(e.target) || isScrubbing) {
        updateProgressHover(e);
      }
    });
    document.addEventListener('mouseup', () => {
      isScrubbing = false;
    });

    // Fullscreen & Theater
    fullscreenBtn.addEventListener('click', toggleFullscreen);
    theaterBtn.addEventListener('click', toggleTheaterMode);

    // Settings
    const settingsBtn = document.getElementById('settings-btn');
    const settingsMenu = document.getElementById('settings-menu');
    const settingsOptions = document.querySelectorAll('.settings-option');
    settingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      settingsMenu.style.display = settingsMenu.style.display === 'none' ? 'flex' : 'none';
    });
    document.addEventListener('click', () => {
      settingsMenu.style.display = 'none';
    });
    settingsOptions.forEach(opt => {
      opt.addEventListener('click', () => {
        settingsOptions.forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        const res = opt.getAttribute('data-res');
        showPlayerToast(`Quality: ${res}`);
      });
    });

    // Back to Favorites
    backToFavsBtn.addEventListener('click', () => {
      episodesView.style.display = 'none';
      rightSidebarTitle.textContent = "My Favorites";
      rightSidebarDesc.textContent = "Ranked by your reactions";
      renderFavorites();
    });

    // Tab buttons
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        const contentId = 'tab-' + btn.getAttribute('data-tab');
        document.getElementById(contentId).classList.add('active');
      });
    });

    // Reaction buttons
    reactionButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        if (!activeItem) return;
        const reactionType = btn.getAttribute('data-reaction');
        postReaction(activeItem.id, reactionType, btn);
      });
    });

    // TV Season Select
    seasonSelect.addEventListener('change', () => {
      if (activeItem && activeItem.type === 'TV Show') {
        const seasonNum = parseInt(seasonSelect.value);
        renderEpisodes(activeItem, seasonNum);
      }
    });

    // Login modal
    loginLink.addEventListener('click', (e) => {
      e.preventDefault();
      signupModal.style.display = 'none';
      loginModal.style.display = 'block';
    });
    loginCloseBtn.addEventListener('click', () => {
      loginModal.style.display = 'none';
    });
    loginOverlay.addEventListener('click', () => {
      loginModal.style.display = 'none';
    });

    // Signup modal
    signupBtn.addEventListener('click', () => {
      signupModal.style.display = 'flex';
    });
    signupCloseBtn.addEventListener('click', closeSignupModal);
    signupOverlay.addEventListener('click', closeSignupModal);

    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('signup-name').value;
      const email = document.getElementById('signup-email').value;
      const password = document.getElementById('signup-password').value;

      if (!email || !password) {
        showPlayerToast('Email and password are required.');
        return;
      }
      if (password.length < 8) {
        showPlayerToast('Password must be at least 8 characters.');
        return;
      }

      try {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, display_name: name })
        });
        const data = await res.json();
        if (!res.ok) {
          showPlayerToast(data.error || 'Signup failed.');
          return;
        }
        localStorage.setItem('livestream_user', JSON.stringify(data.user));
        showPlayerToast(`Welcome, ${name || data.user.email}!`);
        loggedIn(data.user);
        signupForm.reset();
        closeSignupModal();
      } catch (err) {
        console.error('Signup error:', err);
        showPlayerToast('Network error. Please try again.');
      }
    });

    // Protect upload page
    const adminLink = document.querySelector('.admin-btn-link');
    if (adminLink) {
      adminLink.addEventListener('click', (e) => {
        const user = localStorage.getItem('livestream_user');
        if (!user) {
          e.preventDefault();
          signupModal.style.display = 'flex';
          showPlayerToast('Please sign up or log in to upload content.');
        }
      });
    }

    // Logout dropdown
    const userProfile = document.querySelector('.user-profile');
    const logOutContainer = document.getElementById('log-out');

    userProfile.addEventListener('click', (e) => {
      e.stopPropagation();
      if (logOutContainer.innerHTML) {
        logOutContainer.innerHTML = '';
        return;
      }
      logOutContainer.innerHTML = `
        <div class="logout-card">
          <p class="logout-username">My Account</p>
          <button id="logout-btn" class="logout-btn">
            <i class="fa-solid fa-right-from-bracket"></i> Log Out
          </button>
        </div>
      `;
      document.getElementById('logout-btn').addEventListener('click', () => {
        signupBtn.style.display = 'block';
        logOutContainer.innerHTML = '';
        userProfile.style.display = 'none';
        localStorage.removeItem('livestream_user');
        showPlayerToast('Logged out successfully.');
      });
    });

    document.addEventListener('click', (e) => {
      if (!userProfile.contains(e.target)) {
        logOutContainer.innerHTML = '';
      }
    });

  } // ← closes setupEventListeners()

  // Logged in confirmation
  function loggedIn(user) {
  signupBtn.style.display = 'none';
  const userProfile = document.querySelector('.user-profile');
  userProfile.style.display = 'flex';

  // Store user session
  if (user) {
    localStorage.setItem('livestream_user', JSON.stringify(user));
  }
}
/*function loggedIn() {
  signupBtn.style.display = 'none';
  //loginBtn.style.display = 'block';
  document.querySelector('.user-profile').style.display = 'flex';
}*/

 

 /* function listmovie(){
    const filter = [...appData];
    const listmov = document.createElement('div');


     listmov.innerHTML = filter.filter(item=>{

     `
    <ul>
      <li>{item.title}</li>
      </button>
    </ul>
  `;
     })

  }*/
 function checkSession() {
    const user = localStorage.getItem('livestream_user');
    if (user) {
      loggedIn(JSON.parse(user));
    }
  }

  function closeSignupModal() {
    signupModal.style.display = 'none';
  }

  function hideSearchDropdown() {
    const existing = document.getElementById('search-dropdown');
    if (existing) existing.remove();
  }
 
async function showSearchDropdown(query){
  //remove existing dropdown
  hideSearchDropdown()

  //new adds
  if (!query) return;

  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const backendResults = await res.json();

     // 2. Also search KinoCheck trailers already in appData
    const q = query.toLowerCase();
    const kinoResults = appData.filter(item =>
      item.id?.startsWith('kc-') && (
        item.title?.toLowerCase().includes(q) ||
        item.genres?.some(g => g.toLowerCase().includes(q))
      )
    ).slice(0, 3);

    // 3. Merge — backend first, then kino, deduplicate by title
    const seen = new Set();
    const results = [...backendResults, ...kinoResults].filter(item => {
      if (seen.has(item.title)) return false;
      seen.add(item.title);
      return true;
    }).slice(0, 6);

    if (results.length === 0) return;

  // Filter results
  /*
  const results = appData.filter(item =>
    item.title?.toLowerCase().includes(query) ||
    item.genres?.some(g => g.toLowerCase().includes(query)) ||
    item.actors?.toLowerCase().includes(query) ||
    item.studio?.toLowerCase().includes(query)
  ).slice(0, 6);*/ // max 6 results

 

//------//

  const dropdown = document.createElement('div');
    dropdown.id = 'search-dropdown';

    dropdown.innerHTML = results.map(item => `
      <div class="search-result-item" data-id="${item.id}" style="
        display:flex; align-items:center; gap:12px;
        padding:10px 14px; cursor:pointer;
        border-bottom:1px solid rgba(255,255,255,0.04); color:white;
      ">
        <img src="${item.poster || ''}" style="width:36px;height:50px;object-fit:cover;border-radius:4px;" onerror="this.style.display='none'"/>
        <div>
          <div style="font-size:0.88rem;font-weight:600;">${item.title}</div>
          <div style="font-size:0.75rem;color:#64748b;">
            ${item.type || 'Movie'} • ${item.duration || 'trailer'}
            ${item.id?.startsWith('kc-') ? ' • <span style="color:#6366f1">trailer</span>' : ''}
          </div>
        </div>
      </div>
    `).join('');

    dropdown.querySelectorAll('.search-result-item').forEach(el => {
      el.addEventListener('mousedown', (e) => {
        e.preventDefault();
        // Check appData first (covers kino results)
        const selected = appData.find(i => i.id === el.dataset.id)
          || results.find(i => i.id === el.dataset.id);
        if (selected) {
          selectItem(selected);
          searchInput.value = '';
          currentFilters.search = '';
          searchClearBtn.style.display = 'none';
          hideSearchDropdown();
        }
      });
    });

   const wrapper = searchInput.parentElement;
    wrapper.style.position = 'relative';
    wrapper.appendChild(dropdown);

  } catch (err) {
    console.error('Search dropdown error:', err);

    // Full fallback — search appData directly
    const q = query.toLowerCase();
    const fallback = appData.filter(item =>
      item.title?.toLowerCase().includes(q) ||
      item.genres?.some(g => g.toLowerCase().includes(q)) ||
      item.actors?.toLowerCase().includes(q) ||
      item.studio?.toLowerCase().includes(q)
    ).slice(0, 6);

    console.log('Fallback results:', fallback.length);
  }
}





function hideSearchDropdown() {
  const existing = document.getElementById('search-dropdown');
  if (existing) existing.remove();
}
  

  
  

  
 

//---------
  function closeSignupModal() {
    signupModal.style.display = 'none';
    
  }

  // --- SHOW DYNAMIC TOAST ON PLAYER ---
  function showPlayerToast(msg) {
    let toast = videoContainer.querySelector('.player-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'player-toast';
      toast.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        background: rgba(0,0,0,0.85);
        color: #fff;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 0.82rem;
        font-weight: 600;
        z-index: 10;
        border: 1px solid rgba(255,255,255,0.08);
        pointer-events: none;
        animation: fadeIn 0.2s ease-out;
      `;
      videoContainer.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.display = 'block';

    if (toast.timeoutId) clearTimeout(toast.timeoutId);
    toast.timeoutId = setTimeout(() => {
      toast.style.display = 'none';
    }, 2000);
  }

  // --- TILED GRID MODAL POPUP LOGIC ---
  function closeBrowseModal() {
    browseModal.style.display = 'none';
  }
  function openBrowseModal(filterType, filterVal, titleText) {
    modalTitle.textContent = titleText;
    modalGrid.innerHTML = '';
    let filtered = [...appData];
    if (filterType === 'category') {
      const type = filterVal.startsWith('movies') ? 'Movie' : 'TV Show';
      filtered = filtered.filter(item => item.type === type);
      const recentYearCutoff = 2011;
      if (filterVal.endsWith('recent')) {
        filtered = filtered.filter(item => parseInt(item.releaseDate.split('-')[0]) >= recentYearCutoff);
      } else if (filterVal.endsWith('old')) {
        filtered = filtered.filter(item => parseInt(item.releaseDate.split('-')[0]) < recentYearCutoff);
      }
    } else if (filterType === 'genre') {
      filtered = filtered.filter(item => item.genres.includes(filterVal));
    } else if (filterType === 'country') {
      filtered = filtered.filter(item => item.country === filterVal);
    }
    if (filtered.length === 0) {
      modalGrid.innerHTML = `<div class="empty-results">No content found matching selection.</div>`;
    } else {
      filtered.forEach(item => {
        const tile = document.createElement('div');
        tile.className = 'modal-tile';
        tile.innerHTML = `
          <div class="modal-tile-poster-wrapper">
            <img class="modal-tile-poster" src="${item.poster}" alt="${item.title}">
          </div>
          <div class="modal-tile-info">
            <span class="modal-tile-title">${item.title}</span>
            <div class="modal-tile-meta">
              <span class="modal-tile-rating"><i class="fa-solid fa-star"></i> ${item.rating}</span>
              <span>${item.type}</span>
            </div>
          </div>
        `;

        tile.addEventListener('click', () => {
          // Close Modal and Drawer
          closeBrowseModal();
          if (navDrawer.classList.contains('open')) {
            toggleDrawer();
          }
          // Select first
          selectItem(item);

          //let needRender = false;
          // Update left sidebar catalog criteria filter
          if (filterType === 'category') {
            currentFilters.category = filterVal;
            currentFilters.genre = '';
            currentFilters.country = '';
            //needRender = true;
          } else if (filterType === 'genre') {
            currentFilters.category = 'all';
            currentFilters.genre = filterVal;
            currentFilters.country = '';
            //needRender = true;
          } else if (filterType === 'country') {
            currentFilters.category = 'all';
            currentFilters.genre = '';
            currentFilters.country = filterVal;
            //needRender = true;
          }
          //if(needRender){
          updateCatalogTitle();
          renderCatalog();
          //}
          // Highlight card in catalog list
          setTimeout(() => {
            document.querySelectorAll('.catalog-card').forEach(c => {
              if (c.getAttribute('data-id') === item.id) {
                c.classList.add('active');
              } else {
                c.classList.remove('active');
              }
            });
          }, 100);
        });

        modalGrid.appendChild(tile);
      });
    }
    modalCloseBtn.onclick = closeBrowseModal;
    modalOverlay.onclick = closeBrowseModal;
    browseModal.style.display = 'flex';
  }

  // --- HAMBURGER DRAWER ---
  function toggleDrawer() {
    navDrawer.classList.toggle('open');
    drawerOverlay.classList.toggle('open');
  }

  // --- CATALOG RENDERING ---
  function updateCatalogTitle() {
    let title = 'Explore Catalog';
    if (currentFilters.genre) {
      title = `${currentFilters.genre} Category`;
    } else if (currentFilters.country) {
      title = `From ${currentFilters.country}`;
    } else if (currentFilters.category !== 'all') {
      const parts = currentFilters.category.split('-');
      const type = parts[0] === 'movies' ? 'Movies' : 'TV Shows';
      const detail = parts[1] === 'recent' ? 'Recent' : parts[1] === 'old' ? 'Classic' : 'All';
      title = `${detail} ${type}`;
    }
    catalogTitle.textContent = title;
  }

  function renderCatalog() {
    let filtered = [...appData];

    // Search filters
   /* if (currentFilters.search) {
      const q = currentFilters.search;
   
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(q) ||
        item.genres.some(g => g.toLowerCase().includes(q)) ||
        item.actors.toLowerCase().includes(q) ||
        item.studio.toLowerCase().includes(q)
        

        
       
      );
    }*/
    // Genre filter
    if (currentFilters.genre) {
      filtered = filtered.filter(item =>
        item.genres.includes(currentFilters.genre)
      );
    }
    // Country filter
    if (currentFilters.country) {
      filtered = filtered.filter(item =>
        item.country === currentFilters.country
      );
    }
    // Category Filter
    if (currentFilters.category && currentFilters.category !== 'all') {
      const type = currentFilters.category.startsWith('movies') ? 'Movie' : 'TV Show';
      filtered = filtered.filter(item => item.type === type);
      const recentYearCutoff = 2011; // 2012+ is recent, 2011- is old (based on our mock dates)
      if (currentFilters.category.endsWith('recent')) {
        filtered = filtered.filter(item => parseInt(item.releaseDate.split('-')[0]) >= recentYearCutoff);
      } else if (currentFilters.category.endsWith('old')) {
        filtered = filtered.filter(item => parseInt(item.releaseDate.split('-')[0]) < recentYearCutoff);
      }
    }
    catalogCount.textContent = `${filtered.length} item${filtered.length !== 1 ? 's' : ''}`;
    if (filtered.length === 0) {
      catalogList.innerHTML = `<div class="empty-results">No results found.</div>`;
      return;
    }
  
    
    

    catalogList.innerHTML = '';
    filtered.forEach(item => {
      const card = document.createElement('div');
      card.className = `catalog-card ${activeItem && activeItem.id === item.id ? 'active' : ''}`;
      card.setAttribute('data-id', item.id);
      const isTrailer = item.duration ==='trailer';
      const posterShape = isTrailer ? 'poster-landscape': 'poster-portrait';

      const genresHtml = item.genres.slice(0, 2).map(g => `<span class="genre-badge">${g}</span>`).join('');


      card.innerHTML = `
         
        <div class="card-poster-wrapper ${posterShape}">
          <span  class="add-to-fav">+</span>
          <img class="card-poster" src="${item.poster}" alt="${item.title}">
        </div>
        <div class="card-info">
          <span class="card-title">${item.title}</span>
          <div class="card-meta">
            <span class="card-rating"><i class="fa-solid fa-star"></i> ${item.rating}</span>
            <span class="card-duration">${item.duration}</span>
          </div>
          <div class="card-genres">
            ${genresHtml}
          </div>
        </div>
      `;

    
      
      // Hover overlay trigger
      card.addEventListener('mouseenter', (e) => showPopover(e, item));
      card.addEventListener('mousemove', movePopover);
      card.addEventListener('mouseleave', hidePopover);
      // Select item on click
      card.addEventListener('click', () => {
        selectItem(item);
        // Highlight active card
        document.querySelectorAll('.catalog-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
      });

        //** */ Add-to-favorites button handler (per card, with correct item in scope)
      const addTofav = card.querySelector('.add-to-fav');
      addTofav.addEventListener('click', (e)=>{
        e.preventDefault();
        e.stopPropagation();
        
        
        addToFavorites(item);
      })


      catalogList.appendChild(card);


    });
    
      

  }

  //addTofavoriteIcon

  /*function plusAdd(){

    const addTofav = document.getElementById('add-to-fav');

    addTofav.addEventListener('click', ()=>{
      addToFavorites(item);
    })
  }*/
  

  // --- DETAIL HOVER POPOVER ---
  function showPopover(e, item) {
    hoverPopover.querySelector('.popover-title').textContent = item.title;
    hoverPopover.querySelector('.popover-rating').innerHTML = `<i class="fa-solid fa-star"></i> ${item.rating}`;
    hoverPopover.querySelector('.popover-rank').textContent = item.worldRank;
    hoverPopover.querySelector('.popover-duration').textContent = item.duration;
    hoverPopover.querySelector('.popover-description').textContent = item.description;
    hoverPopover.querySelector('.popover-actors').textContent = item.actors;
    hoverPopover.querySelector('.popover-studio').textContent = item.studio;
    hoverPopover.querySelector('.popover-country').textContent = item.country;

    if (sidebarLeft.classList.contains('compact')) {
      // In compact mode, show popover offset to the right of the compact card
      const rect = e.currentTarget.getBoundingClientRect();
      hoverPopover.style.top = rect.top + 'px';
      hoverPopover.style.left = (rect.right + 10) + 'px';
    } else {
      // Otherwise, position absolute near mouse cursor
      hoverPopover.style.top = (e.clientY + 15) + 'px';
      hoverPopover.style.left = (e.clientX + 15) + 'px';
    }
    hoverPopover.style.display = 'flex';
  }
  function movePopover(e) {
    if (sidebarLeft.classList.contains('compact')) return;
    hoverPopover.style.top = (e.clientY + 15) + 'px';
    hoverPopover.style.left = (e.clientX + 15) + 'px';
  }
  function hidePopover() {
    hoverPopover.style.display = 'none';
  }

  // --- SELECTION CONTROL ---
  function selectItem(item) {
    activeItem = item;

    // Update main video details view
    activeTitle.textContent = item.title;
    activeRating.innerHTML = `<i class="fa-solid fa-star"></i> ${item.rating}`;
    activeRank.textContent = item.worldRank;
    activeDuration.textContent = item.duration;
    activeCountry.textContent = item.country;
    activeStudio.textContent = item.studio;
    activeDescription.textContent = item.description;

    // Populate Cast
    populateCast(item.actors);
    // Update reactions deck UI count values
    updateReactionsUI(item.reactions);
    // Reset reaction button states
    reactionButtons.forEach(b => b.classList.remove('active'));
    // Both Movies and TV Shows are auto-added to favorites
    //addToFavorites(item);
   
    // Default right sidebar to Favorites list when selecting a new item
    rightSidebarTitle.textContent = "My Favorites";
    rightSidebarDesc.textContent = "Ranked by your reactions";
    episodesView.style.display = 'none';
    renderFavorites();

   /* changes */ if (item.type === 'Movie') {
      loadVideo(item.videoUrl, item.title);
    } else {
      // For TV show, load default S1E1 video stream
      const s1 = item.seasons && item.seasons[0];
      const ep1 = s1 && s1.episodes && s1.episodes[0];
      if (ep1) {
        activeEpisode = ep1;
        loadVideo(ep1.videoUrl, `${item.title} - S1E1: ${ep1.title}`);
      }
    }
  }

  function populateCast(actorsString) {
    activeCast.innerHTML = '';
    const actors = actorsString.split(',').map(a => a.trim());
    actors.forEach(actor => {
      const initials = actor.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
      const castCard = document.createElement('div');
      castCard.className = 'cast-card';
      castCard.innerHTML = `
        <div class="cast-avatar-mock">${initials}</div>
        <span class="cast-name" title="${actor}">${actor}</span>
        <span class="cast-role">Principal Cast</span>
      `;
      activeCast.appendChild(castCard);
    });
  }

  function renderEpisodes(tvShow, seasonNum) {
    const season = tvShow.seasons.find(s => s.seasonNumber === seasonNum);
    if (!season) return;
    episodesList.innerHTML = '';
    season.episodes.forEach(ep => {
      const card = document.createElement('div');
      card.className = `episode-card ${activeEpisode && activeEpisode.videoUrl === ep.videoUrl ? 'active' : ''}`;
      card.innerHTML = `
        <div class="ep-header">
          <span class="ep-number">Episode ${ep.episodeNumber}</span>
          <span class="ep-duration">${ep.duration}</span>
        </div>
        <span class="ep-title">${ep.title}</span>
        <p class="ep-desc">${ep.description}</p>
      `;
      card.addEventListener('click', () => {
        document.querySelectorAll('.episode-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        activeEpisode = ep;
        loadVideo(ep.videoUrl, `${tvShow.title} - S${seasonNum}E${ep.episodeNumber}: ${ep.title}`);
      });
      episodesList.appendChild(card);
    });
    // Auto load first episode of the season if player has no active tv series video loaded
    if (season.episodes.length > 0 && (!activeEpisode || !season.episodes.some(ep => activeEpisode.videoUrl === ep.videoUrl))) {
      const firstEp = season.episodes[0];
      activeEpisode = firstEp;
      // Highlight first episode card
      setTimeout(() => {
        const firstCard = episodesList.querySelector('.episode-card');
        if (firstCard) firstCard.classList.add('active');
      }, 0);
      loadVideo(firstEp.videoUrl, `${tvShow.title} - S${seasonNum}E1: ${firstEp.title}`);
    }
  }

  // --- CUSTOM VIDEO PLAYER LOGIC ---
  /*function loadVideo(url, title) {
    playerTitleDisplay.textContent = title;
    videoPlayer.src = url;
    videoPlayer.load();
    progressFill.style.width = '0%';
    progressHandle.style.left = '0%';
    currentTimeDisplay.textContent = '00:00';
    durationTimeDisplay.textContent = '00:00';
  }*/
 
  function loadVideo(url, title){
    playerTitleDisplay.textContent = title;
    const youtubeplayer = document.getElementById('youtube-player');
    const isYoutube = url.includes('youtube.com/embed');

    if(isYoutube){
      //trailer hand off

      videoPlayer.pause();
      videoPlayer.style.display = 'none';
      playerControls.style.display = 'none';
      bigPlayBtn.style.display = 'none';
      youtubeplayer.src = url + '?rel=0';
      youtubeplayer.style.display = 'block';
    }else{
      //normal mode
      youtubeplayer.src = '';
      youtubeplayer.style.display = 'none';
      videoPlayer.style.display = 'block';
       playerControls.style.display = 'flex';
      bigPlayBtn.style.display = 'flex';
      videoPlayer.src = url;
      videoPlayer.load();
    }

    progressFill.style.width = '0%';
    progressHandle.style.left = '0%';
    currentTimeDisplay.textContent = '00:00';
    durationTimeDisplay.textContent = '00:00';

  }

  /**************************8888888888 */


  function togglePlay() {
    if (videoPlayer.paused) {
      videoPlayer.play()
        .catch(err => console.log("Player error:", err));
    } else {
      videoPlayer.pause();
    }
  }
  function toggleMute() {
    videoPlayer.muted = !videoPlayer.muted;
    if (videoPlayer.muted) {
      volumeSlider.value = 0;
    } else {
      volumeSlider.value = videoPlayer.volume || 0.8;
    }
    updateVolumeIcon();
  }

  function updateVolumeIcon() {
    if (videoPlayer.muted || videoPlayer.volume === 0) {
      muteBtn.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
    } else if (videoPlayer.volume < 0.4) {
      muteBtn.innerHTML = '<i class="fa-solid fa-volume-low"></i>';
    } else {
      muteBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
    }
  }
  function updateProgress() {
    if (videoPlayer.duration) {
      const current = videoPlayer.currentTime;
      const duration = videoPlayer.duration;
      const pct = (current / duration) * 100;

      progressFill.style.width = `${pct}%`;
      progressHandle.style.left = `${pct}%`;

      currentTimeDisplay.textContent = formatTime(current);
      durationTimeDisplay.textContent = formatTime(duration);
    }
  }
  function updateBuffer() {
    if (videoPlayer.buffered.length > 0 && videoPlayer.duration) {
      const bufferedEnd = videoPlayer.buffered.end(videoPlayer.buffered.length - 1);
      const duration = videoPlayer.duration;
      const pct = (bufferedEnd / duration) * 100;
      progressBuffer.style.width = `${pct}%`;
    }
  }

  function scrub(e) {
    if (!videoPlayer.duration) return;
    const rect = progressContainer.getBoundingClientRect();
    let pos = (e.clientX - rect.left) / rect.width;
    if (pos < 0) pos = 0;
    if (pos > 1) pos = 1;

    videoPlayer.currentTime = pos * videoPlayer.duration;
    updateProgress();
  }
  function updateProgressHover(e) {
    if (!videoPlayer.duration) return;
    const rect = progressContainer.getBoundingClientRect();
    let pos = (e.clientX - rect.left) / rect.width;
    if (pos < 0) pos = 0;
    if (pos > 1) pos = 1;

    const time = pos * videoPlayer.duration;
    progressHoverTime.textContent = formatTime(time);
    progressHoverTime.style.left = `${pos * 100}%`;
  }
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      videoContainer.requestFullscreen()
        .catch(err => console.log("Fullscreen failed:", err));
    } else {
      document.exitFullscreen();
    }
  }
  function toggleTheaterMode() {
    videoContainer.classList.toggle('theater');
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // --- USER ENGAGEMENT REACTIONS & DYNAMIC RANKING ---
  function updateReactionsUI(reactions) {
    if (!reactions) return;
    document.getElementById('count-love').textContent = reactions.love || 0;
    document.getElementById('count-like').textContent = reactions.like || 0;
    document.getElementById('count-funny').textContent = reactions.funny || 0;
    document.getElementById('count-wow').textContent = reactions.wow || 0;
    document.getElementById('count-sad').textContent = reactions.sad || 0;
  }
  function postReaction(id, type, buttonElement) {
    buttonElement.classList.add('active');

    // Animate floating emoji
    spawnFloatingEmoji(buttonElement.querySelector('.reaction-emoji').textContent);
    fetch(`/api/movies/${id}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: type })
    })
      .then(res => res.json())
      .then(updatedItem => {
        // Update local database catalog copy
        const idx = appData.findIndex(item => item.id === id);
        if (idx !== -1) {
          appData[idx] = updatedItem;
        }

        // Update active displays
        if (activeItem.id === id) {
          activeItem = updatedItem;
          activeRating.innerHTML = `<i class="fa-solid fa-star"></i> ${updatedItem.rating}`;
          updateReactionsUI(updatedItem.reactions);
        }
        // Refresh left catalog
        renderCatalog();
        // Update and re-rank Favorites
        updateFavoriteScore(updatedItem);
      })
      .catch(err => console.error("Reaction failed:", err));
  }
  function spawnFloatingEmoji(emoji) {
    const floating = document.createElement('div');
    floating.className = 'floating-emoji';
    floating.textContent = emoji;

    // Spawn around the reaction panel
    const rect = videoContainer.getBoundingClientRect();
    floating.style.left = (rect.left + rect.width / 2 + (Math.random() * 100 - 50)) + 'px';
    floating.style.top = (rect.bottom - 40) + 'px';

    document.body.appendChild(floating);

    // Clean up
    setTimeout(() => {
      floating.remove();
    }, 1000);
  }

  // --- FAVORITES MANAGEMENT & DESCENT ORDER RANKING ---
  function addToFavorites(item) {
    const exists = favorites.some(fav => fav.id === item.id);
    if (!exists) {
      // Calculate reaction sum score
      const score = getReactionsCount(item.reactions);
      favorites.push({
        id: item.id,
        title: item.title,
        poster: item.poster,
        score: score
      });
      saveFavorites();
      renderFavorites(); // ← add this: redraw the list immediately after saving
    }
  }
  function updateFavoriteScore(updatedItem) {
    const score = getReactionsCount(updatedItem.reactions);

    // Find in favorites
    const favIndex = favorites.findIndex(fav => fav.id === updatedItem.id);
    if (favIndex !== -1) {
      favorites[favIndex].score = score;
    } else {
      // Add if missing
      favorites.push({
        id: updatedItem.id,
        title: updatedItem.title,
        poster: updatedItem.poster,
        score: score
      });
    }

    saveFavorites();
    renderFavorites();
  }
  function getReactionsCount(reactions) {
    if (!reactions) return 0;
    return Object.values(reactions).reduce((a, b) => a + b, 0);
  }
  function deleteFavorite(id) {
    favorites = favorites.filter(fav => fav.id !== id);
    saveFavorites();
    renderFavorites();
  }

  function saveFavorites() {
    localStorage.setItem('livestream_favorites', JSON.stringify(favorites));
  }
  function renderFavorites() {
    // Check if episodes view is currently visible. If so, do not overwrite right sidebar
    if (episodesView.style.display === 'block') return;
    if (favorites.length === 0) {
      emptyPlaylist.style.display = 'flex';
      favoritesStack.style.display = 'none';
      return;
    }
    emptyPlaylist.style.display = 'none';
    favoritesStack.style.display = 'flex';
    favoritesStack.innerHTML = '';
    // SORT DESCENDING ORDER BY SCORE (ranking)
    const sortedFavs = [...favorites].sort((a, b) => b.score - a.score);
    sortedFavs.forEach((fav, index) => {
      const card = document.createElement('div');
      card.className = 'fav-card';

      card.innerHTML = `
        <span class="fav-rank-badge">${index + 1}</span>
        <img class="fav-poster" src="${fav.poster}" alt="${fav.title}">
        <div class="fav-info">
          <span class="fav-title" title="Play ${fav.title}">${fav.title}</span>
          <span class="fav-score"><i class="fa-solid fa-fire"></i> ${fav.score} reactions</span>
        </div>
        <button class="delete-fav-btn" data-id="${fav.id}" title="Remove from Favorites">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      `;

      // Select fav movie or TV show on title click
      card.querySelector('.fav-title').addEventListener('click', () => {
        const fullItem = appData.find(item => item.id === fav.id);
        if (fullItem) {
          selectItem(fullItem);
          // Highlight card in left catalog if matches
          document.querySelectorAll('.catalog-card').forEach(c => {
            c.classList.toggle('active', c.getAttribute('data-id') === fav.id);
          });
          if (fullItem.type === 'TV Show') {
            // Open episodes list view for this TV show in right sidebar
            rightSidebarTitle.textContent = "Episodes";
            rightSidebarDesc.textContent = "Browse series timeline";
            favoritesStack.style.display = 'none';
            emptyPlaylist.style.display = 'none';
            episodesView.style.display = 'block';
            // Setup seasons dropdown
            seasonSelect.innerHTML = '';
            fullItem.seasons.forEach(s => {
              const option = document.createElement('option');
              option.value = s.seasonNumber;
              option.textContent = `Season ${s.seasonNumber}`;
              seasonSelect.appendChild(option);
            });
            // Render season 1 episodes
            renderEpisodes(fullItem, 1);
          }
        }
      });

      // Delete from playlist
      card.querySelector('.delete-fav-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteFavorite(fav.id);
      });
      favoritesStack.appendChild(card);
    });
  }
});
