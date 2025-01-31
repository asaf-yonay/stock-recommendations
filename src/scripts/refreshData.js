const agent = require('../stockPredictionAgent');
const { STOCKS } = require('../config');
const { saveToCache } = require('../services/cache');

async function refreshData() {
    try {
        console.log('Starting data refresh...');
        console.time('Refresh Duration');
        
        const results = [];
        for (const symbol of STOCKS) {
            try {
                console.log(`Fetching data for ${symbol}...`);
                const analysis = await agent.analyzeTicker(symbol);
                if (analysis) {
                    results.push(analysis);
                }
            } catch (error) {
                console.error(`Error analyzing ${symbol}:`, error.message);
            }
        }

        // Sort results by prediction score before saving
        results.sort((a, b) => b.prediction - a.prediction);
        
        // Save to cache
        await saveToCache(results);
        
        console.timeEnd('Refresh Duration');
        console.log('Data refresh complete! Cache file updated.');
    } catch (error) {
        console.error('Refresh process error:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    refreshData();
} 