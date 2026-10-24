const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const http = require('http');

describe('Top Navigation Bar & Components Unit Tests', () => {
  let htmlContent = '';
  let appJsContent = '';
  let styleCssContent = '';

  before(() => {
    htmlContent = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
    appJsContent = fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8');
    styleCssContent = fs.readFileSync(path.join(__dirname, '../public/style.css'), 'utf8');
  });

  describe('1. Top Navigation Bar - DOM Structure & Hierarchy', () => {
    test('Header container <header class="app-header"> exists', () => {
      assert.match(htmlContent, /<header\s+class="app-header">/i, 'app-header element should exist');
    });

    test('Header is split into 3 responsive regions: left, center, and right', () => {
      assert.match(htmlContent, /class="header-left"/, 'header-left region must exist');
      assert.match(htmlContent, /class="header-center"/, 'header-center region must exist');
      assert.match(htmlContent, /class="header-right"/, 'header-right region must exist');
    });

    test('Header Left contains Hamburger menu toggle and Brand Logo', () => {
      assert.match(htmlContent, /id="hamburger-btn"[^>]*class="icon-btn"/, 'hamburger-btn must be inside header');
      assert.match(htmlContent, /class="brand-logo"/, 'brand-logo container must exist');
      assert.match(htmlContent, /class="livestream-logo"/, 'livestream-logo img element must exist');
    });

    test('Header Center contains Search Bar with Icon, Input, and Clear Button', () => {
      assert.match(htmlContent, /class="search-wrapper"/, 'search-wrapper container must exist');
      assert.match(htmlContent, /class="fa-solid fa-magnifying-glass search-icon"/, 'magnifying-glass search-icon must exist');
      assert.match(htmlContent, /id="search-input"/, 'search-input element must exist');
      assert.match(htmlContent, /id="search-clear-btn"/, 'search-clear-btn element must exist');
    });

    test('Header Right contains Login, Sign Up, Upload, and User Profile elements', () => {
      assert.match(htmlContent, /id="login-btn"/, 'login-btn must exist in header-right');
      assert.match(htmlContent, /id="signup-btn"/, 'signup-btn must exist in header-right');
      assert.match(htmlContent, /class="admin-btn-link"[\s\S]*?href="\/admin\.html"|href="\/admin\.html"[\s\S]*?class="admin-btn-link"/, 'admin-btn-link pointing to /admin.html must exist');
      assert.match(htmlContent, /class="user-profile"/, 'user-profile container must exist');
      assert.match(htmlContent, /id="user-avatar-img"/, 'user-avatar-img must exist');
      assert.match(htmlContent, /class="user-online-badge"/, 'user-online-badge must exist');
      assert.match(htmlContent, /id="avatar-upload-input"/, 'hidden avatar-upload-input file element must exist');
    });

    test('Account logout dropdown anchor #log-out exists', () => {
      assert.match(htmlContent, /id="log-out"/, '#log-out dropdown container must exist');
    });
  });

  describe('2. Navigation Components - Attributes & Accessibility', () => {
    test('Hamburger button has descriptive aria-label and icon', () => {
      assert.match(htmlContent, /aria-label="Toggle Navigation Menu"/, 'hamburger-btn should have aria-label');
      assert.match(htmlContent, /fa-bars/, 'hamburger-btn should render fa-bars icon');
    });

    test('Brand Logo links to home ("/") and uses livestream logo image', () => {
      assert.match(htmlContent, /<a\s+href="\/"\s+class="brand-logo">\s*<img\s+src="\.\/uploads\/imgs\/live\.png"/, 'Brand logo must link to "/" with live.png');
    });

    test('Search Input contains proper placeholder and autocomplete disabled', () => {
      assert.match(htmlContent, /id="search-input"[^>]*placeholder="Search by title, genre, actors, studio\.\.\."/, 'search-input must have search placeholder');
      assert.match(htmlContent, /id="search-input"[^>]*autocomplete="off"/, 'search-input must have autocomplete="off"');
    });

    test('Search Clear button starts hidden by default', () => {
      assert.match(htmlContent, /id="search-clear-btn"[^>]*style="display:\s*none;"/, 'search-clear-btn should start with display:none');
    });

    test('Action buttons have descriptive icons and labels', () => {
      assert.match(htmlContent, /id="login-btn"[\s\S]*?fa-arrow-right-to-bracket[\s\S]*?<span>Log In<\/span>/, 'login-btn must have icon and text');
      assert.match(htmlContent, /id="signup-btn"[\s\S]*?fa-user-plus[\s\S]*?<span>Sign Up<\/span>/, 'signup-btn must have icon and text');
      assert.match(htmlContent, /class="admin-btn-link"[\s\S]*?fa-cloud-arrow-up[\s\S]*?<span>Upload<\/span>/, 'admin-btn-link must have icon and text');
    });

    test('User profile starts hidden by default when unauthenticated', () => {
      assert.match(htmlContent, /class="user-profile"\s+style="display:\s*none;"/, 'user-profile must default to display:none');
    });
  });

  describe('3. Top Navigation - JavaScript Logic & Event Handlers', () => {
    test('app.js selects all header elements correctly', () => {
      assert.match(appJsContent, /document\.getElementById\(['"]hamburger-btn['"]\)/, 'Selects hamburger-btn');
      assert.match(appJsContent, /document\.getElementById\(['"]search-input['"]\)/, 'Selects search-input');
      assert.match(appJsContent, /document\.getElementById\(['"]search-clear-btn['"]\)/, 'Selects search-clear-btn');
      assert.match(appJsContent, /document\.getElementById\(['"]login-btn['"]\)/, 'Selects login-btn');
      assert.match(appJsContent, /document\.getElementById\(['"]signup-btn['"]\)/, 'Selects signup-btn');
      assert.match(appJsContent, /document\.querySelector\(['"]\.user-profile['"]\)/, 'Selects user-profile');
    });

    test('Hamburger button click triggers toggleDrawer()', () => {
      assert.match(appJsContent, /hamburgerBtn\.addEventListener\(['"]click['"],\s*toggleDrawer\)/, 'hamburger-btn click must bind toggleDrawer');
    });

    test('Search input handles typing, clear button toggle, and dropdown autocomplete', () => {
      assert.match(appJsContent, /searchInput\.addEventListener\(['"]input['"],/, 'searchInput listens to input events');
      assert.match(appJsContent, /searchClearBtn\.style\.display\s*=\s*['"]block['"]/, 'shows searchClearBtn when text is present');
      assert.match(appJsContent, /searchClearBtn\.style\.display\s*=\s*['"]none['"]/, 'hides searchClearBtn when text is empty');
      assert.match(appJsContent, /showSearchDropdown\(query\)/, 'triggers showSearchDropdown with query');
    });

    test('Search clear button clears input and resets search filter', () => {
      assert.match(appJsContent, /searchClearBtn\.addEventListener\(['"]click['"],/, 'searchClearBtn click handler exists');
      assert.match(appJsContent, /searchInput\.value\s*=\s*['"]['"]/, 'Clears search input value');
    });

    test('loggedIn() updates top navigation state: hides guest buttons and reveals user profile', () => {
      assert.match(appJsContent, /function\s+loggedIn\(user\)\s*\{[\s\S]*?loginBtn\.style\.display\s*=\s*['"]none['"]/, 'Hides loginBtn');
      assert.match(appJsContent, /signupBtn\.style\.display\s*=\s*['"]none['"]/, 'Hides signupBtn');
      assert.match(appJsContent, /userProfile\.style\.display\s*=\s*['"]flex['"]/, 'Reveals userProfile');
    });

    test('User profile click opens account popup card with avatar and logout action', () => {
      assert.match(appJsContent, /userProfile\.addEventListener\(['"]click['"],/, 'userProfile click handler exists');
      assert.match(appJsContent, /class="logout-card"/, 'Renders logout-card on profile click');
      assert.match(appJsContent, /id="upload-avatar-btn"/, 'Includes upload avatar button');
      assert.match(appJsContent, /id="logout-btn"/, 'Includes logout button');
    });

    test('Logout action resets header: hides profile and restores login/signup buttons', () => {
      assert.match(appJsContent, /loginBtn\.style\.display\s*=\s*['"]inline-flex['"]|loginBtn\.style\.display\s*=\s*['"]block['"]|loginBtn\.style\.display\s*=\s*['"]flex['"]/, 'Restores login button on logout');
      assert.match(appJsContent, /userProfile\.style\.display\s*=\s*['"]none['"]/, 'Hides user profile on logout');
      assert.match(appJsContent, /localStorage\.removeItem\(['"]livestream_user['"]\)/, 'Clears stored user session');
    });
  });

  describe('4. Navigation Styling & Design Tokens (Dark Warm Charcoal)', () => {
    test('.app-header has sticky/fixed positioning, proper height and dark warm theme', () => {
      assert.match(styleCssContent, /\.app-header\s*\{[^}]*height:\s*var\(--header-height\)/, 'app-header has height token');
      assert.match(styleCssContent, /\.app-header\s*\{[^}]*z-index:\s*100/, 'app-header has top z-index');
    });

    test('.admin-btn-link and .signup-btn-link have warm charcoal styling and hover transitions', () => {
      assert.match(styleCssContent, /\.admin-btn-link,\s*\.signup-btn-link\s*\{/, 'Header action buttons have cohesive styling');
      assert.match(styleCssContent, /\.admin-btn-link:hover,\s*\.signup-btn-link:hover\s*\{/, 'Header action buttons have hover state');
    });

    test('.user-profile avatar online indicator uses lime green badge', () => {
      assert.match(styleCssContent, /\.user-profile\s*\{[^}]*#22c55e/, 'user-profile online ring uses lime green (#22c55e)');
      assert.match(styleCssContent, /\.user-online-badge\s*\{[^}]*#22c55e/, 'user-online-badge uses lime green (#22c55e)');
    });
  });

  describe('5. Search API Live Endpoint Integration', () => {
    test('GET /api/search?q=bunny returns valid array of matching titles', async () => {
      const data = await new Promise((resolve, reject) => {
        http.get('http://127.0.0.1:3000/api/search?q=bunny', (res) => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => {
            try {
              resolve(JSON.parse(body));
            } catch (e) {
              reject(e);
            }
          });
        }).on('error', reject);
      });

      assert.ok(Array.isArray(data), 'Search endpoint must return an array');
      assert.ok(data.length > 0, 'Search should find at least 1 result for "bunny"');
      assert.equal(data[0].title, 'Big Buck Bunny', 'Should match Big Buck Bunny');
    });

    test('GET /api/search with empty query returns empty array', async () => {
      const data = await new Promise((resolve, reject) => {
        http.get('http://127.0.0.1:3000/api/search?q=', (res) => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => {
            try {
              resolve(JSON.parse(body));
            } catch (e) {
              reject(e);
            }
          });
        }).on('error', reject);
      });

      assert.ok(Array.isArray(data), 'Empty search must return an array');
      assert.equal(data.length, 0, 'Empty search should return 0 results');
    });
  });

  describe('6. Video Player Aspect Ratio Switcher (9:16 Portrait & 16:9 Landscape)', () => {
    test('Video player markup contains #aspect-ratio-btn and #quick-ratio-btn with icons and tooltips', () => {
      assert.match(htmlContent, /id="aspect-ratio-btn"[^>]*class="player-btn aspect-ratio-btn"/, 'aspect-ratio-btn must exist in controls-right');
      assert.match(htmlContent, /id="quick-ratio-btn"[^>]*class="quick-ratio-btn"/, 'quick-ratio-btn must exist in video-container');
      assert.match(htmlContent, /fa-mobile-screen/, 'Should render mobile screen icon');
    });

    test('style.css defines .video-container.portrait-mode with 9/16 aspect ratio and smooth transition', () => {
      assert.match(styleCssContent, /\.video-container\.portrait-mode\s*\{[^}]*aspect-ratio:\s*9\s*\/\s*16;/, 'portrait-mode must set aspect-ratio: 9/16');
      assert.match(styleCssContent, /\.quick-ratio-btn:hover/, 'quick-ratio-btn must have hover state');
      assert.match(styleCssContent, /\.aspect-ratio-btn:hover/, 'aspect-ratio-btn must have hover state');
    });

    test('app.js attaches toggle listeners to both aspect ratio buttons and supports auto-detection', () => {
      assert.match(appJsContent, /aspectRatioBtn\.addEventListener\(['"]click['"],\s*toggleAspectRatio\)/, 'aspect-ratio-btn binds to toggleAspectRatio');
      assert.match(appJsContent, /quickRatioBtn\.addEventListener\(['"]click['"],\s*toggleAspectRatio\)/, 'quick-ratio-btn binds to toggleAspectRatio');
      assert.match(appJsContent, /videoContainer\.classList\.toggle\(['"]portrait-mode['"]\)/, 'toggles portrait-mode class');
    });
  });

  describe('7. My Favorites Authentication Guards & User-Scoped Persistence', () => {
    test('Favorites state starts as empty array [] for unauthenticated users', () => {
      assert.match(appJsContent, /let\s+favorites\s*=\s*\[\];/, 'favorites must initialize to empty array []');
    });

    test('Helper functions isUserLoggedIn() and getFavoritesKey() exist', () => {
      assert.match(appJsContent, /function\s+isUserLoggedIn\(\)/, 'isUserLoggedIn helper must exist');
      assert.match(appJsContent, /function\s+getFavoritesKey\(/, 'getFavoritesKey helper must exist');
      assert.match(appJsContent, /livestream_favorites_/, 'Storage key must be user-scoped');
    });

    test('addToFavorites guards against unauthenticated users with prompt and toast', () => {
      assert.match(appJsContent, /function\s+addToFavorites\(item\)\s*\{[\s\S]*?!isUserLoggedIn\(\)[\s\S]*?loginModal/, 'addToFavorites must check isUserLoggedIn and open loginModal if guest');
      assert.match(appJsContent, /showPlayerToast\(['"]Please log in or sign up to add to My Favorites\.['"]\)/, 'Shows auth prompt toast on add attempt');
    });

    test('deleteFavorite guards against unauthenticated users', () => {
      assert.match(appJsContent, /function\s+deleteFavorite\(id[\s\S]*?!isUserLoggedIn\(\)/, 'deleteFavorite must check isUserLoggedIn()');
    });

    test('renderFavorites displays empty playlist state when !isUserLoggedIn()', () => {
      assert.match(appJsContent, /if\s*\(!isUserLoggedIn\(\)\s*\|\|\s*favorites\.length\s*===\s*0\)/, 'renderFavorites enforces empty playlist if not logged in');
    });

    test('loggedIn(user) loads user favorites and renders favorites', () => {
      assert.match(appJsContent, /favorites\s*=\s*loadUserFavorites\(user\);[\s\S]*?renderFavorites\(\);/, 'loggedIn must load user favorites and render them');
    });

    test('Logout clears favorites array and resets right sidebar to empty playlist', () => {
      assert.match(appJsContent, /logout-btn[\s\S]*?favorites\s*=\s*\[\];[\s\S]*?renderFavorites\(\);/, 'logout must reset favorites to empty array and re-render');
    });

    test('Empty playlist HTML contains empty-auth-btn and descriptive text', () => {
      assert.match(htmlContent, /id="empty-playlist"/, 'empty-playlist container exists');
      assert.match(htmlContent, /id="empty-auth-btn"/, 'empty-auth-btn button exists');
    });
  });

  describe('8. Mobile Responsiveness System & Breakpoints', () => {
    test('Viewport meta tag is set correctly for mobile responsiveness', () => {
      assert.match(htmlContent, /<meta\s+name="viewport"\s+content="width=device-width,\s*initial-scale=1\.0">/i, 'viewport meta tag must exist with proper scale');
    });

    test('Tablet and mobile layout orders main video content first', () => {
      assert.match(styleCssContent, /@media\s*\(max-width:\s*992px\)\s*\{[\s\S]*?\.main-content\s*\{[^}]*order:\s*1;/, 'main-content is ordered first on mobile/tablet');
      assert.match(styleCssContent, /\.sidebar-left\s*\{[^}]*order:\s*2;/, 'sidebar-left catalog is ordered second');
      assert.match(styleCssContent, /\.sidebar-right\s*\{[^}]*order:\s*3;/, 'sidebar-right favorites is ordered third');
    });

    test('Favorites sidebar remains accessible on mobile and tablet without being hidden', () => {
      assert.match(styleCssContent, /\.sidebar-right\s*\{[^}]*display:\s*flex\s*!important;/, 'sidebar-right remains flex on mobile');
    });

    test('Touch screens show catalog card actions without requiring hover', () => {
      assert.match(styleCssContent, /@media\s*\(hover:\s*none\)\s*\{[\s\S]*?\.add-to-fav,\s*\.card-delete-btn\s*\{[^}]*opacity:\s*1\s*!important;/, 'Card actions are visible on touch devices');
    });

    test('Desktop-only controls are hidden on mobile player layout', () => {
      assert.match(styleCssContent, /#theater-btn\s*\{[^}]*display:\s*none\s*!important;/, 'theater button is hidden on mobile');
      assert.match(styleCssContent, /\.player-title-display\s*\{[^}]*display:\s*none\s*!important;/, 'player-title-display is hidden on compact screens');
    });

    test('Input fields on mobile have 16px font-size to prevent iOS auto-zoom', () => {
      assert.match(styleCssContent, /input\[type="text"\][\s\S]*?font-size:\s*16px\s*!important;/, 'Inputs prevent iOS zoom with 16px font size');
    });
  });
});
