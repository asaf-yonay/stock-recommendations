const fs = require('fs').promises;
const path = require('path');
const {
    getRecommendationClass,
    generatePriceInfo,
    generateAnalystInfo,
    generateTechnicalSection
} = require('./utils');

async function renderToFile(outputPath = 'index.html', useMock = false) {
    try {
        console.log(`\n[renderToFile] Starting HTML generation for ${useMock ? 'mock' : 'live'} data`);
        const { loadFromCache } = require('./services/cache');
        const cacheData = await loadFromCache(useMock);
        console.log('[renderToFile] Cache data structure:', {
            fetchTimestamp: cacheData.fetchTimestamp,
            dataKeys: Object.keys(cacheData.data || {}),
        });
        return await render(cacheData, outputPath);
    } catch (error) {
        console.error('[renderToFile] Error:', error);
        throw error;
    }
}

async function render(cacheData, outputPath) {
    if (!cacheData?.data) {
        console.error('[render] No cache data available');
        throw new Error('No cache data available');
    }

    const stockData = cacheData.data;
    const stockKeys = Object.keys(stockData).filter(k => k !== 'lastGenerationDate');
    console.log('\n[render] Processing stocks:', stockKeys);
    console.log('[render] Last generation date:', stockData.lastGenerationDate);

    const latestStockData = Object.entries(stockData)
        .filter(([key]) => key !== 'lastGenerationDate')
        .map(([symbol, data]) => {
            console.log(`\n[render] Processing ${symbol}:`);
            console.log(`Available dates for ${symbol}:`, Object.keys(data));
            
            const dateKeys = Object.keys(data).sort();
            const latestKey = dateKeys[dateKeys.length - 1];
            
            console.log(`Selected latest key for ${symbol}: ${latestKey}`);
            console.log(`Data preview for ${symbol}:`, {
                prediction: data[latestKey]?.prediction,
                recommendation: data[latestKey]?.recommendation,
                price: data[latestKey]?.companyInfo?.currentPrice
            });

            return {
                symbol,
                ...data[latestKey]
            };
        })
        .filter(data => {
            if (!data.companyInfo) {
                console.warn(`[render] Warning: No company info for ${data.symbol}`);
                return false;
            }
            return true;
        });

    console.log('\n[render] Processed stock count:', latestStockData.length);

    const sortedData = latestStockData.sort((a, b) => {
        return (b.prediction || 0) - (a.prediction || 0);
    });

    console.log('[render] Top 3 predictions:', sortedData.slice(0, 3).map(stock => ({
        symbol: stock.symbol,
        prediction: stock.prediction,
        recommendation: stock.recommendation
    })));

    const htmlContent = generateHtml({
        data: sortedData,
        fetchTimestamp: stockData.lastGenerationDate
    });
    
    await fs.writeFile(outputPath, htmlContent);
    console.log(`\n[render] HTML file ${outputPath} updated successfully`);
    console.log(`[render] Generated content for ${sortedData.length} stocks`);
}

function generateHtml({ data, fetchTimestamp }) {
    console.log('\n[generateHtml] Generating HTML with:', {
        stockCount: data.length,
        fetchTimestamp
    });

    const renderTimestamp = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Stock Market Predictions</title>
        <link rel="stylesheet" href="styles.css">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    </head>
    <body>
        <header class="main-header">
            <div class="header-content">
                <h1>Stock Market Analysis</h1>
                <div class="timestamps">
                    <p>Data from: ${fetchTimestamp}</p>
                    <p>Generated: ${renderTimestamp}</p>
                </div>
            </div>
        </header>
        <div class="stock-list">
            ${data.map(stock => {
                console.log(`[generateHtml] Generating card for ${stock.symbol}`);
                return generateStockCard(stock);
            }).join('\n')}
        </div>
        <script src="src/scripts/fed-scripts.js"></script>
    </body>
    </html>`;
}

function generateStockCard(stock) {
    if (!stock?.companyInfo) {
        console.warn(`[generateStockCard] Missing company info for stock:`, stock?.symbol);
        return '';
    }

    const recommendation = stock.recommendation?.toLowerCase() || 'hold';
    const score = (parseFloat(stock.prediction || 0) * 10).toFixed(1);
    
    const currentRsi = stock.technicalIndicators?.rsi;
    const previousRsi = stock.previousData?.technicalIndicators?.rsi;
    const rsiChange = currentRsi && previousRsi ? currentRsi - previousRsi : 0;
    
    const currentMacd = stock.technicalIndicators?.macdSignal;
    const previousMacd = stock.previousData?.technicalIndicators?.macdSignal;
    const macdChanged = currentMacd && previousMacd && currentMacd !== previousMacd;
    
    const currentPrice = stock.companyInfo?.currentPrice;
    const supportLevel = stock.trends?.tradingMetrics?.support;
    const resistanceLevel = stock.trends?.tradingMetrics?.resistance;
    const priceToSupportRatio = currentPrice && supportLevel ? (currentPrice - supportLevel) / supportLevel : null;
    const priceToResistanceRatio = currentPrice && resistanceLevel ? (resistanceLevel - currentPrice) / resistanceLevel : null;
    
    return `
        <div class="stock-row">
            <div class="stock-summary">
                <span class="stock-name">${stock.companyInfo.name} (${stock.symbol})</span>
                <span class="signals">
                    ${macdChanged ? `
                    <span class="signal macd-signal ${currentMacd.toLowerCase().includes('bullish') ? 'positive' : 'negative'}"
                          title="MACD Signal changed to: ${currentMacd}">
                        <i class="fas fa-signal"></i>
                    </span>` : ''}
                    ${Math.abs(rsiChange) > 5 ? `
                    <span class="signal rsi-signal ${currentRsi > 70 ? 'negative' : currentRsi < 30 ? 'positive' : ''}"
                          title="RSI changed by ${rsiChange.toFixed(1)} to ${currentRsi}">
                        <i class="fas fa-chart-line"></i>
                    </span>` : ''}
                    ${priceToSupportRatio !== null && priceToSupportRatio < 0.02 ? `
                    <span class="signal price-signal support"
                          title="Price near support level ($${supportLevel.toFixed(2)})">
                        <i class="fas fa-arrow-down"></i>
                    </span>` : ''}
                    ${priceToResistanceRatio !== null && priceToResistanceRatio < 0.02 ? `
                    <span class="signal price-signal resistance"
                          title="Price near resistance level ($${resistanceLevel.toFixed(2)})">
                        <i class="fas fa-arrow-up"></i>
                    </span>` : ''}
                </span>
                <span class="score" title="AI Prediction Score">
                    ${score}
                </span>
                <span class="recommendation ${recommendation}">
                    ${stock.recommendation}
                </span>
                <span class="analyst-breakdown" title="Strong Buy/Buy/Hold/Sell">
                    ${formatAnalystBreakdown(stock.analystRecommendations)}
                </span>
            </div>
            <div class="details hidden">
                <div class="metrics">
                    ${generatePriceInfo(stock)}
                    ${generateAnalystInfo(stock)}
                    ${generateTechnicalSection(stock)}
                </div>
            </div>
        </div>`;
}

function formatAnalystBreakdown(recommendations) {
    const { strongBuy, buy, hold, sell } = recommendations.breakdown;
    return `${strongBuy}/${buy}/${hold}/${sell}`;
}

module.exports = {
    renderToFile,
    render,
    generateHtml
};