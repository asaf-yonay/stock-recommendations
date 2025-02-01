const { renderToFile } = require('./src/htmlRenderer');

async function main() {
    try {
        console.log('Starting stock market analysis...');
        console.time('Analysis Duration');
        
        // Check if we should use mock data
        const useMock = process.argv.includes('--mock');
        const outputFile = useMock ? 'mock.html' : 'index.html';
        
        // Generate HTML from cached data
        await renderToFile(outputFile, useMock);
        
        console.timeEnd('Analysis Duration');
        console.log(`Analysis complete! Check ${outputFile} for results.`);
    } catch (error) {
        console.error('Main process error:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = main;