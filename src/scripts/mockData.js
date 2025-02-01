const fs = require('fs').promises;
const path = require('path');

async function generateMockData() {
    try {
        console.log('Starting mock data generation...');
        
        // Read current stock data
        const stockDataPath = path.join(__dirname, '../../cache/stock_data.json');
        const cacheContent = JSON.parse(await fs.readFile(stockDataPath, 'utf8'));
        
        if (!cacheContent || !cacheContent.data) {
            throw new Error('Invalid cache data structure');
        }

        const currentData = cacheContent.data;
        
        // Create new mock data structure
        const mockData = {
            lastGenerationDate: currentData.lastGenerationDate
        };

        // Process each stock
        for (const [symbol, data] of Object.entries(currentData)) {
            if (symbol === 'lastGenerationDate') continue;

            // Get the latest date key
            const dateKeys = Object.keys(data).sort();
            const latestKey = dateKeys[dateKeys.length - 1];
            
            if (!latestKey) continue;

            const latestData = data[latestKey];
            if (!latestData) continue;

            // Create historical entry based on latest data
            const historicalData = createHistoricalEntry(latestData);
            
            // Create a previous date key (one day before)
            const prevDate = getPreviousDateKey(latestKey);
            
            mockData[symbol] = {
                [prevDate]: historicalData,
                [latestKey]: latestData
            };
        }

        // Save mock data with timestamp
        const mockDataPath = path.join(__dirname, '../../cache/stock_data_mock.json');
        await fs.writeFile(mockDataPath, JSON.stringify({
            fetchTimestamp: new Date().toISOString(),
            data: mockData
        }, null, 2));
        console.log('Mock data generated and saved to stock_data_mock.json');

    } catch (error) {
        console.error('Error generating mock data:', error);
        throw error; // Let refreshData.js handle the error
    }
}

function getPreviousDateKey(dateKey) {
    // Extract date parts from key (format: DDMMYYphase)
    const day = parseInt(dateKey.slice(0, 2));
    const month = parseInt(dateKey.slice(2, 4)) - 1; // 0-based month
    const year = parseInt('20' + dateKey.slice(4, 6));
    const phase = dateKey.slice(6);

    // Create date and subtract one day
    const date = new Date(year, month, day);
    date.setDate(date.getDate() - 1);

    // Format back to key
    return `${String(date.getDate()).padStart(2, '0')}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getFullYear()).slice(-2)}${phase}`;
}

function createHistoricalEntry(currentData) {
    // Create a deep copy of current data
    const historical = JSON.parse(JSON.stringify(currentData));
    
    // Adjust values to create logical historical data
    const priceAdjustment = -1 * (Math.random() * 2 + 0.5); // Random decrease between 0.5% and 2.5%
    
    // Update price-related fields
    historical.companyInfo.currentPrice = Number((historical.companyInfo.currentPrice * (1 + priceAdjustment/100)).toFixed(2));
    historical.companyInfo.dayChange = Number((priceAdjustment).toFixed(4));
    historical.companyInfo.marketCap = adjustMarketCap(historical.companyInfo.marketCap, priceAdjustment);
    
    // Adjust ranges
    historical.companyInfo.dayRange.low = Number((historical.companyInfo.currentPrice * 0.995).toFixed(2));
    historical.companyInfo.dayRange.high = Number((historical.companyInfo.currentPrice * 1.005).toFixed(2));
    
    // Adjust technical indicators
    historical.technicalIndicators.rsi = String(Number(historical.technicalIndicators.rsi) - 1.5);
    historical.technicalIndicators.macdSignal = weakenSignal(historical.technicalIndicators.macdSignal);
    historical.technicalIndicators.trendStrength = Number((historical.technicalIndicators.trendStrength * 0.9).toFixed(4));
    
    // Adjust prediction and recommendation
    historical.prediction = Number((historical.prediction * 0.97).toFixed(2));
    historical.recommendation = weakenRecommendation(historical.recommendation);
    
    return historical;
}

function adjustMarketCap(marketCap, percentChange) {
    const value = parseFloat(marketCap.replace(/[^0-9.]/g, ''));
    const unit = marketCap.slice(-1);
    const adjustedValue = value * (1 + percentChange/100);
    return `$${adjustedValue.toFixed(1)}${unit}`;
}

function weakenSignal(signal) {
    const signals = {
        'Strong Bullish': 'Bullish',
        'Bullish': 'Neutral',
        'Neutral': 'Bearish',
        'Bearish': 'Strong Bearish',
        'Strong Bearish': 'Strong Bearish'
    };
    return signals[signal] || signal;
}

function weakenRecommendation(recommendation) {
    const recommendations = {
        'Strong Buy': 'Buy',
        'Buy': 'Hold',
        'Hold': 'Hold',
        'Sell': 'Strong Sell',
        'Strong Sell': 'Strong Sell'
    };
    return recommendations[recommendation] || recommendation;
}

if (require.main === module) {
    generateMockData();
}

module.exports = { generateMockData }; 