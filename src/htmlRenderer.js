const fs = require('fs').promises;
const path = require('path');
const {
    getRecommendationClass,
    generateAnalystInfo,
    generatePriceInfo,
    generateTechnicalSection,
    generateAnalystBar,
    generateExplanation
} = require('./utils');

function getLatestDataKey(stockData) {
    return Object.keys(stockData)
        .filter(key => key !== 'symbol') // Exclude non-date keys
        .sort()
        .pop();
}

async function renderToFile(outputPath = 'index.html', useMock = false) {
    try {
        const { loadFromCache } = require('./services/cache');
        const cacheData = await loadFromCache(useMock);
        return await render(cacheData, outputPath);
    } catch (error) {
        console.error('Error rendering HTML:', error);
        throw error;
    }
}

async function render(cacheData, outputPath) {
    if (!cacheData?.data) {
        throw new Error('No cache data available');
    }

    const stockData = cacheData.data;
    console.log('Processing stocks:', Object.keys(stockData).filter(k => k !== 'lastGenerationDate'));

    // Transform data structure to array and get latest data for each stock
    const latestStockData = Object.entries(stockData)
        .filter(([key]) => key !== 'lastGenerationDate')
        .map(([symbol, data]) => {
            const dateKeys = Object.keys(data).filter(key => key.includes('pre')).sort();
            const latestKey = dateKeys[dateKeys.length - 1];
            return {
                symbol,
                ...data[latestKey]
            };
        })
        .filter(data => data.companyInfo);

    // Sort stocks by prediction score
    const sortedData = latestStockData.sort((a, b) => {
        return (b.prediction || 0) - (a.prediction || 0);
    });

    const htmlContent = generateHtml({
        data: sortedData,
        fetchTimestamp: stockData.lastGenerationDate
    });
    
    await fs.writeFile(outputPath, htmlContent);
    console.log(`HTML file ${outputPath} updated successfully`);
}

function generateHtml(results) {
    const { data, fetchTimestamp } = results;
    const renderTimestamp = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    
    const stockRows = data
        .map(stock => generateStockRow(stock))
        .join('');
    
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
                    <p>Data fetched on: ${fetchTimestamp}</p>
                    <p>Report generated on: ${renderTimestamp}</p>
                </div>
            </div>
        </header>
        <div class="stock-list">
            ${stockRows}
        </div>
        <script src="src/scripts/fed-scripts.js"></script>
    </body>
    </html>`;
}

function getLatestAndPreviousData(stockData) {
    console.log('\nGetting latest and previous data');
    console.log('Stock data keys:', Object.keys(stockData));
    
    if (!stockData || typeof stockData !== 'object') {
        console.warn('Invalid stockData provided to getLatestAndPreviousData');
        return { latest: null, previous: null };
    }

    const dateKeys = Object.keys(stockData)
        .filter(key => key !== 'symbol' && key !== 'lastGenerationDate')
        .sort();
    
    console.log('Filtered date keys:', dateKeys);

    if (dateKeys.length === 0) {
        console.warn('No valid date keys found in stockData');
        return { latest: null, previous: null };
    }

    const result = {
        latest: stockData[dateKeys[dateKeys.length - 1]],
        previous: dateKeys.length > 1 ? stockData[dateKeys[dateKeys.length - 2]] : null
    };
    
    console.log('Latest data key:', dateKeys[dateKeys.length - 1]);
    console.log('Previous data key:', dateKeys.length > 1 ? dateKeys[dateKeys.length - 2] : 'none');
    
    return result;
}

function generateStockRow(stock) {
    if (!stock?.companyInfo) return '';

    const recommendation = stock.recommendation?.toLowerCase() || 'hold';
    const score = (parseFloat(stock.prediction || 0) * 10).toFixed(1);
    
    // Get current and previous values
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

function generatePriceMetric(companyInfo) {
    const dayChangeClass = parseFloat(companyInfo.dayChange) >= 0 ? 'positive' : 'negative';
    const dayChangeSign = parseFloat(companyInfo.dayChange) >= 0 ? '+' : '';
    
    return `
        <div class="metric price-metric">
            <h3>Price Information</h3>
            <div class="kpi-grid">
                <div class="kpi" title="Current trading price of the stock">Current Price:</div>
                <div class="kpi-value">$${formatNumber(companyInfo.currentPrice)}</div>
                
                <div class="kpi" title="Percentage change in price over the last trading day">Day Change:</div>
                <div class="kpi-value ${dayChangeClass}">
                    ${dayChangeSign}${formatNumber(companyInfo.dayChange)}%
                </div>
                
                <div class="kpi" title="Total market value of the company">Market Cap:</div>
                <div class="kpi-value">${companyInfo.marketCap}</div>
                
                <div class="kpi" title="Price range during the current trading day">Day Range:</div>
                <div class="kpi-value">
                    $${formatNumber(companyInfo.dayRange.low)} - $${formatNumber(companyInfo.dayRange.high)}
                </div>
            </div>
        </div>`;
}

function generateAnalystMetric(recommendations) {
    const total = recommendations.total;
    const breakdown = recommendations.breakdown;
    const consensus = calculateConsensus(recommendations);
    
    return `
        <div class="metric analyst-metric">
            <h3>Analyst Recommendations</h3>
            <div class="kpi-grid">
                <div class="kpi" title="Average analyst rating on a scale of 1-10">Consensus:</div>
                <div class="kpi-value">${consensus}/10</div>
                
                <div class="kpi" title="Number of analysts giving Strong Buy rating">Strong Buy:</div>
                <div class="kpi-value">${breakdown.strongBuy}</div>
                
                <div class="kpi" title="Number of analysts giving Buy rating">Buy:</div>
                <div class="kpi-value">${breakdown.buy}</div>
                
                <div class="kpi" title="Number of analysts giving Hold rating">Hold:</div>
                <div class="kpi-value">${breakdown.hold}</div>
                
                <div class="kpi" title="Number of analysts giving Sell rating">Sell:</div>
                <div class="kpi-value">${breakdown.sell}</div>
                
                <div class="kpi" title="Number of analysts giving Strong Sell rating">Strong Sell:</div>
                <div class="kpi-value">${breakdown.strongSell}</div>
            </div>
            <div class="analyst-bar-container" title="Distribution of analyst recommendations">
                <div class="analyst-bar">
                    <div class="strong-buy" style="width: ${(breakdown.strongBuy / total * 100).toFixed(1)}%"></div>
                    <div class="buy" style="width: ${(breakdown.buy / total * 100).toFixed(1)}%"></div>
                    <div class="hold" style="width: ${(breakdown.hold / total * 100).toFixed(1)}%"></div>
                    <div class="sell" style="width: ${(breakdown.sell / total * 100).toFixed(1)}%"></div>
                    <div class="strong-sell" style="width: ${(breakdown.strongSell / total * 100).toFixed(1)}%"></div>
                </div>
            </div>
        </div>`;
}

function calculateConsensus(recommendations) {
    const weights = {
        strongBuy: 10,
        buy: 7.5,
        hold: 5,
        sell: 2.5,
        strongSell: 0
    };
    
    const { breakdown, total } = recommendations;
    const weightedSum = (
        breakdown.strongBuy * weights.strongBuy +
        breakdown.buy * weights.buy +
        breakdown.hold * weights.hold +
        breakdown.sell * weights.sell +
        breakdown.strongSell * weights.strongSell
    );
    
    return (weightedSum / total).toFixed(1);
}

function calculateRiskLevel(stock) {
    const priceChange = Math.abs(parseFloat(stock.trends.priceChange));
    return priceChange > 2 ? 'high' : priceChange > 1 ? 'moderate' : 'low';
}

function formatNumber(num) {
    return Number(num).toFixed(2);
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

module.exports = {
    renderToFile,
    render,
    generateHtml
};