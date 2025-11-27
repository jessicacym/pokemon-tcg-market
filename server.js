const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = 3000;
const POKEMON_API_KEY = process.env.POKEMON_TCG_API_KEY || '';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory storage
let favorites = [];
let priceAlerts = [];

// Server-side cache for API requests
const apiCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper function to fetch with retry
async function fetchWithRetry(url, options, maxRetries = 3) {
    const fetch = (await import('node-fetch')).default;

    for (let i = 0; i < maxRetries; i++) {
        try {
            console.log(`🔍 Attempt ${i + 1}/${maxRetries}: ${url}`);
            const response = await fetch(url, options);

            if (response.ok) {
                return response;
            }

            // If it's a 5xx error, retry
            if (response.status >= 500 && i < maxRetries - 1) {
                console.log(`⏳ Retrying after ${response.status} error...`);
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
                continue;
            }

            return response;
        } catch (error) {
            if (i < maxRetries - 1) {
                console.log(`⏳ Retrying after error: ${error.message}`);
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
                continue;
            }
            throw error;
        }
    }
}

// Proxy endpoint for Pokemon TCG API with caching and retry
app.get('/api/cards', async (req, res) => {
    try {
        // Create cache key from query params
        const cacheKey = JSON.stringify(req.query);

        // Check cache first
        if (apiCache.has(cacheKey)) {
            const cached = apiCache.get(cacheKey);
            if (Date.now() - cached.timestamp < CACHE_DURATION) {
                console.log('✅ Serving from cache:', req.query);
                return res.json(cached.data);
            } else {
                apiCache.delete(cacheKey);
            }
        }

        // Build query string
        const queryParams = new URLSearchParams(req.query);
        const url = `https://api.pokemontcg.io/v2/cards?${queryParams}`;

        // Build headers
        const headers = {
            'User-Agent': 'Mozilla/5.0 Pokemon TCG Market App',
            'Accept': 'application/json'
        };

        // Add API key if available
        if (POKEMON_API_KEY) {
            headers['X-Api-Key'] = POKEMON_API_KEY;
        }

        // Fetch with retry
        const response = await fetchWithRetry(url, {
            headers: headers,
            timeout: 60000 // 60 second timeout per attempt
        }, 3);

        if (!response.ok) {
            console.error('❌ API Error:', response.status, response.statusText);
            throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.error('❌ Invalid content type:', contentType);
            throw new Error('API did not return JSON');
        }

        const data = await response.json();

        // Store in cache
        apiCache.set(cacheKey, {
            data: data,
            timestamp: Date.now()
        });

        // Clean old cache entries (keep only last 100)
        if (apiCache.size > 100) {
            const firstKey = apiCache.keys().next().value;
            apiCache.delete(firstKey);
        }

        console.log('✅ API Success:', data.count || 0, 'cards found');
        res.json(data);
    } catch (error) {
        console.error('❌ Error fetching cards:', error.message);
        res.status(500).json({
            error: 'Failed to fetch cards',
            message: error.message,
            data: [],
            count: 0,
            totalCount: 0
        });
    }
});

// Favorites endpoints
app.get('/api/favorites', (req, res) => {
    const { userId } = req.query;
    const userFavorites = favorites.filter(f => f.userId === userId);
    res.json({ success: true, data: userFavorites });
});

app.post('/api/favorites', (req, res) => {
    const { userId, cardId, cardData } = req.body;

    // Check if already exists
    const exists = favorites.find(f => f.userId === userId && f.cardId === cardId);
    if (exists) {
        return res.json({ success: false, message: 'Already in favorites' });
    }

    const favorite = {
        id: Date.now().toString(),
        userId,
        cardId,
        cardData,
        createdAt: new Date()
    };

    favorites.push(favorite);
    res.json({ success: true, data: favorite });
});

app.delete('/api/favorites/:cardId', (req, res) => {
    const { cardId } = req.params;
    const { userId } = req.query;

    const index = favorites.findIndex(f => f.userId === userId && f.cardId === cardId);
    if (index !== -1) {
        favorites.splice(index, 1);
        res.json({ success: true });
    } else {
        res.json({ success: false, message: 'Favorite not found' });
    }
});

app.get('/api/favorites/:cardId', (req, res) => {
    const { cardId } = req.params;
    const { userId } = req.query;

    const favorite = favorites.find(f => f.userId === userId && f.cardId === cardId);
    res.json({ success: !!favorite, data: favorite });
});

// Price alerts endpoints
app.get('/api/price-alerts', (req, res) => {
    const { userId } = req.query;
    const userAlerts = priceAlerts.filter(a => a.userId === userId);
    res.json({ success: true, data: userAlerts });
});

app.post('/api/price-alerts', (req, res) => {
    const alert = {
        id: Date.now().toString(),
        ...req.body,
        createdAt: new Date()
    };

    priceAlerts.push(alert);
    res.json({ success: true, data: alert });
});

app.delete('/api/price-alerts/:alertId', (req, res) => {
    const { alertId } = req.params;
    const { userId } = req.query;

    const index = priceAlerts.findIndex(a => a.userId === userId && a.id === alertId);
    if (index !== -1) {
        priceAlerts.splice(index, 1);
        res.json({ success: true });
    } else {
        res.json({ success: false, message: 'Alert not found' });
    }
});

app.put('/api/price-alerts/:alertId', (req, res) => {
    const { alertId } = req.params;
    const { userId } = req.query;
    const { enabled } = req.body;

    const alert = priceAlerts.find(a => a.userId === userId && a.id === alertId);
    if (alert) {
        alert.enabled = enabled;
        res.json({ success: true, data: alert });
    } else {
        res.json({ success: false, message: 'Alert not found' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${path.join(__dirname, 'public')}`);
    console.log(`💾 Cache enabled: ${CACHE_DURATION / 1000}s duration`);
});
