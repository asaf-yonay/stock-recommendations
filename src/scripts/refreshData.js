const agent = require('../stockPredictionAgent');
const { STOCKS } = require('../config');
const { saveToCache, loadFromCache } = require('../services/cache');
const { renderToFile } = require('../htmlRenderer');

async function refreshData(useMock = false) {
    try {
        console.log(`Starting ${useMock ? 'mock' : 'real'} data refresh...`);
        console.time('Refresh Duration');
        
        if (useMock) {
            const { generateMockData } = require('./mockData');
            await generateMockData();
            console.log('Mock data generated successfully');
            console.timeEnd('Refresh Duration');
            return;
        }

        // Load existing cache
        const existingCache = await loadFromCache(false);
        
        // Get current date in ET (US Eastern Time)
        const date = new Date();
        const etDate = new Date(date.getTime() - (7 * 60 * 60 * 1000));
        
        const month = String(etDate.getMonth() + 1).padStart(2, '0');
        const day = String(etDate.getDate()).padStart(2, '0');
        const year = etDate.getFullYear().toString().slice(-2);
        const compactDate = `${month}${day}${year}`;

        // Market hours in ET: 9:30 AM - 4:00 PM
        const hour = etDate.getHours();
        const minutes = etDate.getMinutes();
        const marketTime = hour + (minutes / 60);
        
        let tradePhase;
        if (marketTime < 9.5) {
            tradePhase = 'pre';
        } else if (marketTime >= 9.5 && marketTime < 16) {
            tradePhase = 'in';
        } else {
            tradePhase = 'post';
        }
        
        const dateKey = `${compactDate}${tradePhase}`;
        
        // Update cache structure
        const newCache = {
            fetchTimestamp: new Date().toISOString(),
            data: {
                lastGenerationDate: etDate.toLocaleString('en-US', {
                    timeZone: 'America/New_York',
                    year: 'numeric',
                    month: 'numeric',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                }),
                ...existingCache.data
            }
        };

        // Process each stock
        for (const symbol of STOCKS) {
            try {
                console.log(`Fetching data for ${symbol}...`);
                const analysis = await agent.analyzeTicker(symbol);
                
                if (analysis) {
                    // Initialize stock entry if it doesn't exist
                    if (!newCache.data[symbol]) {
                        newCache.data[symbol] = {};
                    }
                    
                    // Add the new analysis under the current date/phase key
                    newCache.data[symbol][dateKey] = analysis;
                }
            } catch (error) {
                console.error(`Error analyzing ${symbol}:`, error.message);
            }
        }

        // Save the updated cache
        await saveToCache(newCache, false);
        
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