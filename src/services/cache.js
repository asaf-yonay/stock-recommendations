const fs = require('fs').promises;
const path = require('path');

const CACHE_DIR = path.join(__dirname, '../../cache');
const CACHE_FILE = path.join(CACHE_DIR, 'stock_data.json');
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

async function ensureCacheDirectory() {
    try {
        await fs.access(CACHE_DIR);
    } catch {
        await fs.mkdir(CACHE_DIR, { recursive: true });
    }
}

async function saveToCache(data) {
    await ensureCacheDirectory();
    const cacheData = {
        timestamp: Date.now(),
        data
    };
    await fs.writeFile(CACHE_FILE, JSON.stringify(cacheData, null, 2));
}

async function loadFromCache() {
    try {
        const cacheContent = await fs.readFile(CACHE_FILE, 'utf-8');
        const cache = JSON.parse(cacheContent);
        
        // Check if cache is still valid
        if (Date.now() - cache.timestamp < CACHE_DURATION) {
            return cache.data;
        }
    } catch (error) {
        // If file doesn't exist or is invalid, return null
        return null;
    }
    return null;
}

module.exports = {
    saveToCache,
    loadFromCache
}; 