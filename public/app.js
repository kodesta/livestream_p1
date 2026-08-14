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
  // Global Hover Popover
  const hoverPopover = document.getElementById('hover-popover');
  // Modal Elements
  const browseModal = document.getElementById('browse-modal');
  const modalOverlay = document.getElementById('modal-overlay');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalTitle = document.getElementById('modal-title');
  const modalGrid = document.getElementById('modal-grid');
  const backToFavsBtn = document.getElementById('back-to-favs-btn');
  // Sign Up Modal Elements
  const signupBtn = document.getElementById('signup-btn');
  const signupModal = document.getElementById('signup-modal');
  const signupOverlay = document.getElementById('signup-overlay');
  const signupCloseBtn = document.getElementById('signup-close-btn');
  const signupForm = document.getElementById('signup-form');

  // --- INITIALIZATION ---
  init();
  function init() {
    fetchCatalog();
    setupEventListeners();
    renderFavorites();
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
      if(appData > 0){
        selectItem(appData[0]);

      }
    }).catch(err=>{
       console.error('Failed to load catalog', err);
      catalogList.innerHTML = `<div class="error-msg">Error loading catalog. Please check backend.</div>`;
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
          // Home button resets filters and shows all in left catalog
          currentFilters.category = 'all';
          currentFilters.genre = '';
          currentFilters.country = '';
          updateCatalogTitle();
          renderCatalog();
          toggleDrawer();
        } else {
          // Opens beautiful tiled grid modal
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
      currentFilters.search = searchInput.value.trim().toLowerCase();
      if (currentFilters.search.length > 0) {
        searchClearBtn.style.display = 'block';
      } else {
        searchClearBtn.style.display = 'none';
      }
      renderCatalog();
    });
    searchClearBtn.addEventListener('click', () => {
      searchInput.value = '';
      currentFilters.search = '';
      searchClearBtn.style.display = 'none';
      renderCatalog();
    });

    // Left Sidebar Resize Splitter
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
        // Compact icon mode
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

    // Custom Video Player Controls
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

    // Scrubber timeline control
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

    // Fullscreen & Theater modes
    fullscreenBtn.addEventListener('click', toggleFullscreen);
    theaterBtn.addEventListener('click', toggleTheaterMode);

    // Settings gear resolution selectors
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

    // Back to Favorites button trigger
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

    // Emojis reaction buttons
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

    // Sign Up Modal
    signupBtn.addEventListener('click', () => {
      signupModal.style.display = 'flex';
    });
    signupCloseBtn.addEventListener('click', closeSignupModal);
    signupOverlay.addEventListener('click', closeSignupModal);
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      // NOTE: no auth backend yet - this just confirms the form works.
      // Wire this up to a real /api/signup endpoint once accounts are built.
      const name = document.getElementById('signup-name').value;
      showPlayerToast(`Welcome, ${name}! (Accounts coming soon)`);
      signupForm.reset();
      closeSignupModal();
    });
  }

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
          // Update left sidebar catalog criteria filter
          if (filterType === 'category') {
            currentFilters.category = filterVal;
            currentFilters.genre = '';
            currentFilters.country = '';
          } else if (filterType === 'genre') {
            currentFilters.category = 'all';
            currentFilters.genre = filterVal;
            currentFilters.country = '';
          } else if (filterType === 'country') {
            currentFilters.category = 'all';
            currentFilters.genre = '';
            currentFilters.country = filterVal;
          }
          updateCatalogTitle();
          renderCatalog();
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
    if (currentFilters.search) {
      const q = currentFilters.search;
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(q) ||
        item.genres.some(g => g.toLowerCase().includes(q)) ||
        item.actors.toLowerCase().includes(q) ||
        item.studio.toLowerCase().includes(q)
      );
    }
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

      const genresHtml = item.genres.slice(0, 2).map(g => `<span class="genre-badge">${g}</span>`).join('');

      card.innerHTML = `
        <div class="card-poster-wrapper">
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
      catalogList.appendChild(card);
    });
  }

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
    addToFavorites(item);
    // Default right sidebar to Favorites list when selecting a new item
    rightSidebarTitle.textContent = "My Favorites";
    rightSidebarDesc.textContent = "Ranked by your reactions";
    episodesView.style.display = 'none';
    renderFavorites();

    if (item.type === 'Movie') {
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
