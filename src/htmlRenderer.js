const fs = require('fs').promises;
const {
    getRecommendationClass,
    generateAnalystInfo,
    generateRiskInfo,
    generatePriceInfo,
    generateTechnicalSection
} = require('./utils');

async function renderToFile(stockData, outputPath = 'index.html') {
    // Sort stocks by prediction score before generating HTML
    const sortedStocks = [...stockData].sort((a, b) => {
        // First sort by prediction score
        const scoreDiff = b.prediction - a.prediction;
        if (scoreDiff !== 0) return scoreDiff;
        
        // If scores are equal, sort by analyst consensus
        const consensusDiff = (b.analystRecommendations?.consensusScore || 0) - 
                            (a.analystRecommendations?.consensusScore || 0);
        if (consensusDiff !== 0) return consensusDiff;
        
        // If still equal, sort alphabetically by symbol
        return a.symbol.localeCompare(b.symbol);
    });

    const htmlContent = generateHtml(sortedStocks);
    
    try {
        await fs.writeFile(outputPath, htmlContent);
        console.log('HTML file updated successfully');
    } catch (error) {
        console.error('Error writing HTML file:', error);
        throw error;
    }
}

function generateHtml(results) {
    const stockRows = results.map((stock, index) => generateStockRow(stock, index)).join('');
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Stock Market Predictions</title>
        <link rel="stylesheet" href="styles.css">
        <script>
            function toggleDetails(element) {
                const detailsDiv = element.querySelector('.details');
                const allDetails = document.querySelectorAll('.details');
                
                // Close all other open details
                allDetails.forEach(detail => {
                    if (detail !== detailsDiv) {
                        detail.classList.remove('active');
                        detail.classList.add('hidden');
                    }
                });
                
                // Toggle the clicked details
                detailsDiv.classList.toggle('hidden');
                detailsDiv.classList.toggle('active');
            }
        </script>
    </head>
    <body>
        <h1>Stock Market Analysis</h1>
        <p>Analysis performed on ${new Date().toLocaleString()}</p>
        <div class="stock-list">
            ${stockRows}
        </div>
    </body>
    </html>`;
}

function generateStockRow(stock) {
    const breakdown = stock.analystRecommendations?.breakdown || {};
    const analystBreakdown = `${breakdown.strongBuy || 0}/${breakdown.buy || 0}/${breakdown.hold || 0}/${breakdown.sell || 0}`;
    
    // Calculate normalized score (0.0 to 9.9)
    const predictionScore = (stock.prediction * 9.9).toFixed(1);

    return `
        <div class="stock-row" onclick="toggleDetails(this)">
            <div class="stock-summary">
                <span class="stock-name">${stock.companyInfo.name} (${stock.symbol})</span>
                <span class="score" title="AI Prediction Score">
                    ${predictionScore}
                </span>
                <span class="recommendation ${getRecommendationClass(stock.recommendation)}">
                    ${stock.recommendation}
                </span>
                <span class="analyst-breakdown" title="Strong Buy/Buy/Hold/Sell">
                    ${analystBreakdown}
                </span>
            </div>
            <div class="details hidden">
                ${generateMetricsSection(stock)}
                ${generateTechnicalSection(stock)}
            </div>
        </div>
    `;
}

function generateMetricsSection(stock) {
    return `
        <div class="metrics">
            ${generatePriceInfo(stock)}
            ${generateAnalystInfo(stock)}
            ${generateRiskInfo(stock)}
        </div>
    `;
}

// ... Additional component generation functions ...

module.exports = {
    renderToFile,
    generateHtml
}; 