const fs = require('fs').promises;
const {
    getRecommendationClass,
    getRiskClass,
    generateAnalystBar,
    generateExplanation,
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
            function toggleDetails(rowId) {
                const details = document.getElementById('details-' + rowId);
                const allDetails = document.getElementsByClassName('details');
                
                Array.from(allDetails).forEach(detail => {
                    if (detail.id !== 'details-' + rowId) {
                        detail.classList.remove('active');
                    }
                });
                
                details.classList.toggle('active');
            }
        </script>
    </head>
    <body>
        <h1>Stock Market Analysis</h1>
        <p>Analysis performed on ${new Date().toLocaleString()}</p>
        <table class="stock-table">
            <thead>
                <tr class="stock-header">
                    <th>Company</th>
                    <th>Recommendation</th>
                </tr>
            </thead>
            <tbody>
                ${stockRows}
            </tbody>
        </table>
    </body>
    </html>`;
}

function generateStockRow(stock, index) {
    return `
        <tr class="stock-row" onclick="toggleDetails(${index})">
            <td>${stock.companyInfo.name} (${stock.symbol})</td>
            <td class="${getRecommendationClass(stock.recommendation)}">${stock.recommendation}</td>
        </tr>
        <tr>
            <td colspan="2">
                <div id="details-${index}" class="details">
                    ${generateMetricsSection(stock)}
                    ${generateTechnicalSection(stock)}
                </div>
            </td>
        </tr>
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