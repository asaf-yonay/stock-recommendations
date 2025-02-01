const agent = require('../stockPredictionAgent');
const { STOCKS } = require('../config');
const { saveToCache, loadFromCache } = require('../services/cache');
const { renderToFile } = require('../htmlRenderer');

async function refreshData(useMock = false) {
    try {
        console.log(`Starting ${useMock ? 'mock' : 'real'} data refresh...`);
        console.time('Refresh Duration');
        
        let newCache;
        
        if (useMock) {
            // For mock data, we'll use mockData.js functionality
            const { generateMockData } = require('./mockData');
            await generateMockData();
            console.log('Mock data generated successfully');
            
            // Exit early as mock data is already saved with timestamp
            console.timeEnd('Refresh Duration');
            return;
        } else {
            // Get current date in the compact format
            const date = new Date();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const year = date.getFullYear().toString().slice(-2);
            const compactDate = `${month}${day}${year}`;

            // Determine if we're in pre-trade or in-trade hours
            const hour = date.getHours();
            const tradePhase = (hour < 9 || hour >= 16) ? 'pre' : 'in';
            const dateKey = `${compactDate}${tradePhase}`;
            
            // Create new cache structure
            newCache = {
                lastGenerationDate: date.toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'numeric',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                })
            };

            // Process each stock
            for (const symbol of STOCKS) {
                try {
                    console.log(`Fetching data for ${symbol}...`);
                    const analysis = await agent.analyzeTicker(symbol);
                    
                    if (analysis) {
                        // Initialize stock entry if it doesn't exist
                        if (!newCache[symbol]) {
                            newCache[symbol] = {};
                        }
                        
                        // Add the new analysis under the current date/phase key
                        newCache[symbol][dateKey] = analysis;
                    }
                } catch (error) {
                    console.error(`Error analyzing ${symbol}:`, error.message);
                }
            }

            // Save the new cache structure with timestamp
            await saveToCache(newCache, new Date().toISOString(), false);
        }
        
        console.timeEnd('Refresh Duration');
        console.log('Data refresh complete! Cache files updated.');
    } catch (error) {
        console.error('Refresh process error:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    const useMock = process.argv.includes('--mock');
    refreshData(useMock);
}

module.exports = { refreshData }; 