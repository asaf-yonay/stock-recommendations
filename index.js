const { fetchStockData, fullStockList } = require('./src/dataFetcher');
const { renderToFile } = require('./src/htmlRenderer');

async function main() {
    try {
        console.log('Starting stock market analysis...');
        console.time('Analysis Duration');
        
        const stockData = await fetchStockData(fullStockList);
        await renderToFile(stockData, 'index.html');
        
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