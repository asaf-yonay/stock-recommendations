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

async function saveToCache(data, timestamp) {
    await ensureCacheDirectory();
    const cacheData = {
        fetchTimestamp: timestamp,
        data
    };
    await fs.writeFile(CACHE_FILE, JSON.stringify(cacheData, null, 2));
}

async function loadFromCache() {
    try {
        const cacheContent = await fs.readFile(CACHE_FILE, 'utf-8');
        return JSON.parse(cacheContent);
    } catch (error) {
        return null;
    }
}

module.exports = {
    saveToCache,
    loadFromCache
}; 