const { renderToFile } = require('./src/htmlRenderer');
const { loadFromCache } = require('./src/services/cache');

async function main() {
    try {
        console.log('Starting stock market analysis...');
        console.time('Analysis Duration');
        
        // Load data from cache
        const results = await loadFromCache();
        
        if (!results) {
            console.error('No cached data found. Please run "npm run refresh" first.');
            process.exit(1);
        }

        // Generate HTML from cached data
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