const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));


// Ensure directories exist
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
const DB_FILE = path.join(__dirname, 'movies.json');


// Initialize database if it doesn't exist

const initialMovies = [
  {
    id: "movie-1",
    title: "Big Buck Bunny",
    type: "Movie",
    description: "A large and lovable giant rabbit is forced to deal with three bullying rodents who molest the forest creatures and ruin his peaceful day.",
    rating: 4.5,
    worldRank: "#12 Globally",
    duration: "9 min",
    actors: "Bunny, Squirrels, Forest Animals",
    studio: "Blender Institute",
    country: "Netherlands",
    genres: ["Animation", "Comedy", "Family"],
    poster: "https://upload.wikimedia.org/wikipedia/commons/c/c5/Big_Buck_Bunny_堅強的兔子.jpg",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    reactions: { love: 45, like: 120, funny: 340, wow: 12, sad: 1 },
    releaseDate: "2008-05-30"
  },
  {
    id: "movie-2",
    title: "Sintel",
    type: "Movie",
    description: "A lonely young woman named Sintel befriended a baby dragon she named Scales. When Scales is kidnapped by an adult dragon, Sintel embarks on a dangerous quest to rescue him.",
    rating: 4.8,
    worldRank: "#5 Globally",
    duration: "14 min",
    actors: "Sintel, Scales the Dragon",
    studio: "Blender Foundation",
    country: "Netherlands",
    genres: ["Animation", "Fantasy", "Drama"],
    poster: "https://upload.wikimedia.org/wikipedia/commons/e/eb/Sintel_poster_by_David_Revoy.jpg",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    reactions: { love: 280, like: 180, funny: 5, wow: 110, sad: 95 },
    releaseDate: "2010-09-27"
  },
  {
    id: "movie-3",
    title: "Tears of Steel",
    type: "Movie",
    description: "Set in a dystopian future in Amsterdam, a group of scientists and soldiers attempt to save the world from giant destructive robots using memory projection.",
    rating: 4.2,
    worldRank: "#24 Globally",
    duration: "12 min",
    actors: "Derek de Lint, Rogier Schippers",
    studio: "Blender Institute",
    country: "Netherlands",
    genres: ["Sci-Fi", "Action", "CGI"],
    poster: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Tears_of_Steel_poster_crop.jpg/800px-Tears_of_Steel_poster_crop.jpg",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    reactions: { love: 98, like: 140, funny: 12, wow: 89, sad: 4 },
    releaseDate: "2012-09-26"
  },
  {
    id: "tv-1",
    title: "Blender Open Anthology",
    type: "TV Show",
    description: "A collection of beautiful open-source animated and CGI stories funded by the Blender Foundation, showcasing cutting-edge techniques and narrative designs.",
    rating: 4.7,
    worldRank: "#8 Globally",
    duration: "2 Seasons",
    actors: "Various Artists, CGI Characters",
    studio: "Blender Studio",
    country: "Netherlands",
    genres: ["Animation", "Sci-Fi", "Fantasy"],
    poster: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Cosmos_Laundromat_poster.jpg",
    reactions: { love: 189, like: 90, funny: 45, wow: 76, sad: 3 },
     releaseDate: "2015-08-10",
    seasons: [
      {
        seasonNumber: 1,
        episodes: [
          {
            episodeNumber: 1,
            title: "Cosmos Laundromat",
            duration: "12 min",
            description: "On a desolate island, a suicidal sheep named Franck meets a quirky salesman who offers him the adventure of a lifetime.",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4"
          },
          {
            episodeNumber: 2,
            title: "Elephant's Dream",
            duration: "10 min",
            description: "Two characters explore a strange, mechanical world of cables and gears, trying to understand their bizarre surroundings.",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4"
          }
        ]
      },
      {
        seasonNumber: 2,
        episodes: [
          {
            episodeNumber: 1,
            title: "Caminandes: Llama Drama",
            duration: "2 min",
            description: "Koro the llama must cross a busy highway in Patagonia to reach the juicy grass on the other side.",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4"
          },
          {
            episodeNumber: 2,
            title: "Caminandes: Gran Dillama",
            duration: "3 min",
            description: "A second adventure for Koro the llama, trying to get food in winter.",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
          }
        ]
      }
    ]
  }
];

if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify(initialMovies, null, 2));
}
// Read database
function readDatabase() {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading database:", err);
    return [];
  }
}

// Write database
function writeDatabase(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error writing database:", err);
  }
}
// Multer storage configuration for Admin Uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // accept images and videos only
    const mimeType = file.mimetype;
    if (mimeType.startsWith('image/') || mimeType.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images and video files are allowed!'), false);
    }
  }
});
// API Routes
// Get catalog
app.get('/api/movies', (req, res) => {
  const db = readDatabase();
  res.json(db);
});
// Add reaction to a movie/show
app.post('/api/movies/:id/react', (req, res) => {
  const { id } = req.params;
  const { type } = req.body; // e.g., 'love', 'like', 'funny', 'wow', 'sad'
  if (!['love', 'like', 'funny', 'wow', 'sad'].includes(type)) {
    return res.status(400).json({ error: 'Invalid reaction type' });
  }

  const db = readDatabase();
  const itemIndex = db.findIndex(item => item.id === id);
  if (itemIndex === -1) {
    return res.status(404).json({ error: 'Item not found' });
  }
  if (!db[itemIndex].reactions) {
    db[itemIndex].reactions = { love: 0, like: 0, funny: 0, wow: 0, sad: 0 };
  }
  db[itemIndex].reactions[type] = (db[itemIndex].reactions[type] || 0) + 1;
  // Recalculate rating based on reactions count as a fun dynamic feature
  const totalReactions = Object.values(db[itemIndex].reactions).reduce((a, b) => a + b, 0);
  const positive = (db[itemIndex].reactions.love || 0) + (db[itemIndex].reactions.like || 0) + (db[itemIndex].reactions.wow || 0);
  const newRating = totalReactions > 0 ? (positive / totalReactions) * 2 + 3 : db[itemIndex].rating;
  db[itemIndex].rating = parseFloat(newRating.toFixed(1));
  writeDatabase(db);
  res.json(db[itemIndex]);
});

// Upload a new movie or TV show
app.post('/api/movies', upload.fields([
  { name: 'posterFile', maxCount: 1 },
  { name: 'videoFile', maxCount: 1 }
]), (req, res) => {
  try {
    const {
      title,
      type,
      description,
      rating,
      actors,
      studio,
      country,
      genres,
      videoUrl,
      posterUrl,
      releaseDate
    } = req.body;
    if (!title || !type) {
      return res.status(400).json({ error: "Title and Type (Movie/TV Show) are required." });
    }
    const db = readDatabase();

    // Create new id
    const newId = (type === 'TV Show' ? 'tv-' : 'movie-') + Date.now();
    // Handle poster
    let poster = posterUrl || '';
    if (req.files && req.files.posterFile && req.files.posterFile[0]) {
      poster = '/uploads/' + req.files.posterFile[0].filename;
    }
    // Handle video source (URL or file)
    let finalVideoUrl = videoUrl || '';
    if (req.files && req.files.videoFile && req.files.videoFile[0]) {
      finalVideoUrl = '/uploads/' + req.files.videoFile[0].filename;
    }
    const newItem = {
      id: newId,
      title: title,
      type: type,
      description: description || 'No description provided.',
      rating: parseFloat(rating) || 4.0,
      worldRank: "#" + Math.floor(Math.random() * 50 + 1) + " Globally",
      duration: type === 'TV Show' ? "1 Season" : "120 min",
      actors: actors || 'Unknown',
      studio: studio || 'Independent Studio',
      country: country || 'United States',
      genres: Array.isArray(genres) ? genres : (genres ? genres.split(',').map(g => g.trim()) : ['General']),
      poster: poster || 'https://via.placeholder.com/300x450?text=No+Poster',
      reactions: { love: 0, like: 0, funny: 0, wow: 0, sad: 0 },
      releaseDate: releaseDate || new Date().toISOString().split('T')[0]
    };
    if (type === 'Movie') {
      newItem.videoUrl = finalVideoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    } else {
      // Create a default Season 1 Episode 1 for TV shows if none uploaded
      newItem.seasons = [
        {
          seasonNumber: 1,
          episodes: [
            {
              episodeNumber: 1,
              title: "Episode 1: Pilot",
              duration: "45 min",
              description: "The pilot episode of " + title + ".",
              videoUrl: finalVideoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
            }
          ]
        }
      ];
    }
    db.push(newItem);
    writeDatabase(db);
    res.status(201).json({ success: true, item: newItem });
  } catch (err) {
    console.error("Error in POST /api/movies:", err);
    res.status(500).json({ error: "Failed to upload movie/TV show. " + err.message });
  }
});
// Start server

app.listen(PORT, () => {
  console.log(`Livestream server running at http://localhost:${PORT}`);
});
