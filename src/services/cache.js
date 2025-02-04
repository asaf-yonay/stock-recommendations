const fs = require('fs').promises;
const path = require('path');

const CACHE_DIR = path.join(__dirname, '../../cache');
const CACHE_FILE = path.join(CACHE_DIR, 'stock_data.json');
const MOCK_CACHE_FILE = path.join(CACHE_DIR, 'stock_data_mock.json');
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

async function ensureCacheDirectory() {
    try {
        await fs.access(CACHE_DIR);
    } catch {
        await fs.mkdir(CACHE_DIR, { recursive: true });
    }
}

async function saveToCache(data, isMock = false) {
    await ensureCacheDirectory();
    const filePath = isMock ? MOCK_CACHE_FILE : CACHE_FILE;
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

async function loadFromCache(useMock = false) {
    try {
        const filePath = useMock ? MOCK_CACHE_FILE : CACHE_FILE;
        const cacheContent = await fs.readFile(filePath, 'utf-8');
        const parsed = JSON.parse(cacheContent);
        
        // Ensure we always return a properly structured object
        return {
            fetchTimestamp: parsed.fetchTimestamp || new Date().toISOString(),
            data: parsed.data || {}
        };
    } catch (error) {
        // Return empty structure if file doesn't exist
        return {
            fetchTimestamp: new Date().toISOString(),
            data: {}
        };
    }
}

module.exports = {
    saveToCache,
    loadFromCache,
    MOCK_CACHE_FILE
}; 