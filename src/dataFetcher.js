const stockAgent = require('./stockPredictionAgent');

async function fetchStockData(symbols) {
    const results = [];
    console.log(`Starting analysis for ${symbols.length} stocks...`);
    
    for (const symbol of symbols) {
        try {
            console.log(`\nAnalyzing ${symbol}...`);
            const result = await stockAgent.analyzeTicker(symbol);
            
            if (result) {
                results.push(result);
                console.log(`✓ Successfully analyzed ${symbol}`);
            } else {
                console.warn(`⚠ No data available for ${symbol}`);
            }

            // Minimal delay to prevent API throttling
            await new Promise(resolve => setTimeout(resolve, 100)); // Reduced to 100ms
            
        } catch (error) {
            console.error(`✗ Error analyzing ${symbol}:`, error.message);
        }
    }

    console.log(`\nCompleted analysis of ${results.length}/${symbols.length} stocks`);

    // Sort results by prediction score (highest to lowest)
    return results.sort((a, b) => b.prediction - a.prediction);
}

// Production list of major stocks across different sectors
const productionStocks = [
    // Technology
    'AAPL', 'MSFT', 'GOOGL', 'META', 'NVDA', 'ADBE', 'CRM', 'INTC', 'AMD', 'CSCO', 'WIX',
    
    // E-commerce & Internet
    'AMZN', 'BABA', 'PYPL', 'SHOP', 'ETSY',
    
    // Electric Vehicles & Auto
    'TSLA', 'F', 'GM', 'NIO', 'RIVN',
    
    // Financial Services
    'JPM', 'V', 'MA', 'BAC', 'GS', 'MS', 'AXP',
    
    // Healthcare & Pharma
    'JNJ', 'UNH', 'PFE', 'MRNA', 'ABBV',
    
    // Retail
    'WMT', 'TGT', 'COST', 'HD', 'LOW',
    
    // Entertainment & Media
    'DIS', 'NFLX', 'CMCSA', 'PARA', 'WBD',
    
    // Telecommunications
    'VZ', 'T', 'TMUS',
    
    // Energy
    'XOM', 'CVX', 'COP', 'SLB',
    
    // Consumer Goods
    'PG', 'KO', 'PEP', 'MCD', 'NKE'
];

module.exports = {
    fetchStockData,
    testStocks: ['AAPL', 'WIX'], // Added WIX to test stocks
    fullStockList: productionStocks
}; 