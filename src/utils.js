function getRecommendationClass(recommendation) {
    const classMap = {
        'Strong Buy': 'strong-buy',
        'Buy': 'buy',
        'Hold': 'hold',
        'Sell': 'sell',
        'Strong Sell': 'strong-sell'
    };
    return classMap[recommendation] || '';
}

function getRecommendationFromScore(score) {
    if (score >= 7.5) return 'Strong Buy';
    if (score >= 6.5) return 'Buy';
    if (score >= 4.5) return 'Hold';
    if (score >= 3.5) return 'Sell';
    return 'Strong Sell';
}

function formatPrice(price) {
    return price ? `$${Number(price).toFixed(2)}` : 'N/A';
}

function formatPercentage(value) {
    if (!value) return 'N/A';
    const sign = value > 0 ? '+' : '';
    return `${sign}${Number(value).toFixed(2)}%`;
}

function generatePriceInfo(stock) {
    if (!stock?.companyInfo?.currentPrice) {
        return `
            <div class="metric price-metric">
                <h3>Price Information</h3>
                <div class="kpi-grid">
                    <div class="kpi">Price data unavailable</div>
                </div>
            </div>
        `;
    }

    const { currentPrice, dayChange, marketCap, dayRange } = stock.companyInfo;

    return `
        <div class="metric price-metric">
            <h3>Price Information</h3>
            <div class="kpi-grid">
                <div class="kpi" title="Current trading price of the stock">Current Price:</div>
                <div class="kpi-value">${formatPrice(currentPrice)}</div>
                
                <div class="kpi" title="Percentage change in price over the last trading day">Day Change:</div>
                <div class="kpi-value ${dayChange > 0 ? 'positive' : 'negative'}">
                    ${formatPercentage(dayChange)}
                </div>
                
                <div class="kpi" title="Total market value of the company">Market Cap:</div>
                <div class="kpi-value">${marketCap}</div>
                
                <div class="kpi" title="Price range during the current trading day">Day Range:</div>
                <div class="kpi-value">
                    ${dayRange?.low && dayRange?.high 
                        ? `${formatPrice(dayRange.low)} - ${formatPrice(dayRange.high)}`
                        : 'N/A'}
                </div>
            </div>
        </div>
    `;
}

function generatePriceTargets(stock) {
    if (!stock.yahooAnalysis?.priceTargets) return '';

    const currentPrice = stock.companyInfo.currentPrice;
    const {high, low, mean, median, numberOfAnalysts} = stock.yahooAnalysis.priceTargets;
    
    // Skip if we don't have enough data
    if (!high || !low || !mean || !median) return '';

    // Calculate percentage differences for coloring
    const meanDiff = ((mean - currentPrice) / currentPrice) * 100;
    const medianDiff = ((median - currentPrice) / currentPrice) * 100;

    return `
        <div class="metric">
            <h3>Price Targets</h3>
            <div class="kpi-grid">
                <div class="kpi" title="Highest analyst price target">Highest Target:</div>
                <div class="kpi-value">$${high.toFixed(2)}</div>
                
                <div class="kpi" title="Average price target">Mean Target:</div>
                <div class="kpi-value ${meanDiff > 0 ? 'positive' : 'negative'}">
                    $${mean.toFixed(2)} (${meanDiff > 0 ? '+' : ''}${meanDiff.toFixed(1)}%)
                </div>
                
                <div class="kpi" title="Median price target">Median Target:</div>
                <div class="kpi-value ${medianDiff > 0 ? 'positive' : 'negative'}">
                    $${median.toFixed(2)} (${medianDiff > 0 ? '+' : ''}${medianDiff.toFixed(1)}%)
                </div>
                
                <div class="kpi" title="Lowest analyst price target">Lowest Target:</div>
                <div class="kpi-value">$${low.toFixed(2)}</div>
            </div>
            <div class="price-target-bar">
                <div class="current-price-marker" 
                     style="left: ${((currentPrice - low) / (high - low) * 100)}%"
                     title="Current: $${currentPrice.toFixed(2)}">•</div>
                <div class="target-range" 
                     style="left: ${((low - low) / (high - low) * 100)}%; 
                            width: ${((high - low) / (high - low) * 100)}%"
                     title="Target range: $${low.toFixed(2)} - $${high.toFixed(2)}"></div>
            </div>
            <div class="analyst-coverage">
                Based on ${numberOfAnalysts} analyst${numberOfAnalysts !== 1 ? 's' : ''}
            </div>
        </div>
    `;
}

function generateAnalystInfo(stock) {
    if (!stock?.analystRecommendations) return '';

    const { consensusScore, breakdown, total } = stock.analystRecommendations;
    const { strongBuy, buy, hold, sell, strongSell } = breakdown;

    return `
        <div class="metric analyst-metric">
            <h3>Analyst Recommendations</h3>
            <div class="kpi-grid">
                <div class="kpi" title="Average analyst rating on a scale of 1-10">Consensus:</div>
                <div class="kpi-value">${consensusScore.toFixed(1)}/10</div>
                
                <div class="kpi" title="Number of analysts giving Strong Buy rating">Strong Buy:</div>
                <div class="kpi-value">${strongBuy}</div>
                
                <div class="kpi" title="Number of analysts giving Buy rating">Buy:</div>
                <div class="kpi-value">${buy}</div>
                
                <div class="kpi" title="Number of analysts giving Hold rating">Hold:</div>
                <div class="kpi-value">${hold}</div>
                
                <div class="kpi" title="Number of analysts giving Sell rating">Sell:</div>
                <div class="kpi-value">${sell}</div>
                
                <div class="kpi" title="Number of analysts giving Strong Sell rating">Strong Sell:</div>
                <div class="kpi-value">${strongSell || 0}</div>
            </div>
            ${generateAnalystBar(breakdown, total)}
        </div>
    `;
}

function generateAnalystBar(breakdown, total) {
    const { strongBuy, buy, hold, sell, strongSell = 0 } = breakdown;
    
    const percentages = {
        strongBuy: (strongBuy / total) * 100,
        buy: (buy / total) * 100,
        hold: (hold / total) * 100,
        sell: (sell / total) * 100,
        strongSell: (strongSell / total) * 100
    };

    return `
        <div class="analyst-bar-container" title="Distribution of analyst recommendations">
            <div class="analyst-bar">
                <div class="strong-buy" style="width: ${percentages.strongBuy}%"></div>
                <div class="buy" style="width: ${percentages.buy}%"></div>
                <div class="hold" style="width: ${percentages.hold}%"></div>
                <div class="sell" style="width: ${percentages.sell}%"></div>
                <div class="strong-sell" style="width: ${percentages.strongSell}%"></div>
            </div>
        </div>
    `;
}

function generateTechnicalSection(stock) {
    if (!stock?.technicalIndicators || !stock?.trends?.tradingMetrics) return '';

    const { rsi, macdSignal, trendStrength } = stock.technicalIndicators;
    const { support, resistance } = stock.trends.tradingMetrics;

    return `
        <div class="technical-metrics">
            <div class="metric">
                <h3>Technical Indicators</h3>
                <div class="kpi-grid">
                    <div class="kpi" title="Relative Strength Index - measures momentum (0-100)">RSI:</div>
                    <div class="kpi-value">${rsi}</div>
                    
                    <div class="kpi" title="Moving Average Convergence Divergence signal">MACD Signal:</div>
                    <div class="kpi-value ${macdSignal.toLowerCase().includes('bullish') ? 'positive' : 'negative'}">
                        ${macdSignal}
                    </div>
                    
                    <div class="kpi" title="Price level where buying pressure is expected">Support Level:</div>
                    <div class="kpi-value">${formatPrice(support)}</div>
                    
                    <div class="kpi" title="Price level where selling pressure is expected">Resistance Level:</div>
                    <div class="kpi-value">${formatPrice(resistance)}</div>
                </div>
            </div>
            <div class="metric">
                <h3>Analysis Summary</h3>
                <p title="Comprehensive analysis of all factors">${generateExplanation(stock)}</p>
            </div>
        </div>
    `;
}

function generateExplanation(stock) {
    const explanations = [];
    
    explanations.push(`Technical Analysis: ${stock.technicalIndicators.macdSignal} trend with RSI at ${stock.technicalIndicators.rsi}`);
    
    if (stock.trends?.priceChange) {
        explanations.push(`Trading between support (${formatPrice(stock.trends.tradingMetrics.support)}) and resistance (${formatPrice(stock.trends.tradingMetrics.resistance)})`);
    }

    explanations.push(`${stock.companyInfo.marketCap} stock with ${stock.technicalIndicators.trendStrength}% trend strength`);

    return explanations.join('. ') + '.';
}

function generateMetricsSection(stock) {
    return `
        <div class="metrics">
            ${generatePriceInfo(stock)}
            ${generatePriceTargets(stock)}
            ${generateAnalystInfo(stock)}
        </div>
    `;
}

module.exports = {
    getRecommendationClass,
    getRecommendationFromScore,
    formatPrice,
    formatPercentage,
    generatePriceInfo,
    generatePriceTargets,
    generateAnalystInfo,
    generateTechnicalSection,
    generateAnalystBar,
    generateExplanation,
    generateMetricsSection,
    formatAnalystBreakdown(recommendations) {
        const { strongBuy, buy, hold, sell } = recommendations.breakdown;
        return `${strongBuy}/${buy}/${hold}/${sell}`;
    }
}; 