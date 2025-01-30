const { renderToFile } = require('./src/htmlRenderer');
const agent = require('./src/stockPredictionAgent');
const { STOCKS } = require('./src/config');

async function main() {
    try {
        console.log('Starting stock market analysis...');
        console.time('Analysis Duration');
        
        // Determine which stocks to analyze based on the environment
        const isTestRun = process.env.NODE_ENV === 'test' || process.env.npm_lifecycle_event === 'test';
        const stocksToAnalyze = isTestRun ? ['WIX', 'AAPL'] : STOCKS;
        
        console.log(`Analyzing ${stocksToAnalyze.length} stocks in ${isTestRun ? 'test' : 'full'} mode...`);
        
        const results = [];
        for (const symbol of stocksToAnalyze) {
            try {
                const analysis = await agent.analyzeTicker(symbol);
                if (analysis) {
                    results.push(analysis);
                }
            } catch (error) {
                console.error(`Error analyzing ${symbol}:`, error.message);
            }
        }

        // Sort results by prediction score (descending)
        results.sort((a, b) => b.prediction - a.prediction);
        
        await renderToFile(results, 'index.html');
        
        console.timeEnd('Analysis Duration');
        console.log('Analysis complete! Check index.html for results.');
    } catch (error) {
        console.error('Main process error:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = main; 