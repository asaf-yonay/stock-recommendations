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

function generatePriceInfo(stock) {
    // Early return if required data is missing
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
                <div class="kpi-value">$${currentPrice?.toFixed(2) || 'N/A'}</div>
                
                <div class="kpi" title="Percentage change in price over the last trading day">Day Change:</div>
                <div class="kpi-value ${dayChange > 0 ? 'positive' : 'negative'}">
                    ${dayChange ? `${dayChange > 0 ? '+' : ''}${dayChange.toFixed(2)}%` : 'N/A'}
                </div>
                
                <div class="kpi" title="Total market value of the company">Market Cap:</div>
                <div class="kpi-value">${marketCap || 'N/A'}</div>
                
                <div class="kpi" title="Price range during the current trading day">Day Range:</div>
                <div class="kpi-value">
                    ${dayRange?.low && dayRange?.high 
                        ? `$${dayRange.low.toFixed(2)} - $${dayRange.high.toFixed(2)}`
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

function generateAnalystBar(breakdown) {
    if (!breakdown) return '';

    const total = (breakdown.strongBuy || 0) + 
                 (breakdown.buy || 0) + 
                 (breakdown.hold || 0) + 
                 (breakdown.sell || 0) + 
                 (breakdown.strongSell || 0);

    if (total === 0) return '';

    const getWidth = (count) => ((count || 0) / total * 100).toFixed(1);

    return `
        <div class="analyst-bar">
            <div class="strong-buy" style="width: ${getWidth(breakdown.strongBuy)}%"></div>
            <div class="buy" style="width: ${getWidth(breakdown.buy)}%"></div>
            <div class="hold" style="width: ${getWidth(breakdown.hold)}%"></div>
            <div class="sell" style="width: ${getWidth(breakdown.sell)}%"></div>
            <div class="strong-sell" style="width: ${getWidth(breakdown.strongSell)}%"></div>
        </div>
    `;
}

function generateAnalystInfo(stock) {
    const consensusScore = stock.analystRecommendations?.consensusScore;
    const breakdown = stock.analystRecommendations?.breakdown || {};
    
    return `
        <div class="metric analyst-metric">
            <h3>Analyst Recommendations</h3>
            <div class="kpi-grid">
                <div class="kpi" title="Average analyst rating on a scale of 1-10">Consensus:</div>
                <div class="kpi-value">${consensusScore ? consensusScore.toFixed(1) : 'N/A'}/10</div>
                
                <div class="kpi" title="Number of analysts giving Strong Buy rating">Strong Buy:</div>
                <div class="kpi-value">${breakdown.strongBuy || 0}</div>
                
                <div class="kpi" title="Number of analysts giving Buy rating">Buy:</div>
                <div class="kpi-value">${breakdown.buy || 0}</div>
                
                <div class="kpi" title="Number of analysts giving Hold rating">Hold:</div>
                <div class="kpi-value">${breakdown.hold || 0}</div>
                
                <div class="kpi" title="Number of analysts giving Sell rating">Sell:</div>
                <div class="kpi-value">${breakdown.sell || 0}</div>
                
                <div class="kpi" title="Number of analysts giving Strong Sell rating">Strong Sell:</div>
                <div class="kpi-value">${breakdown.strongSell || 0}</div>
            </div>
            <div class="analyst-bar-container" title="Distribution of analyst recommendations">
                ${generateAnalystBar(stock.analystRecommendations?.breakdown)}
            </div>
        </div>
    `;
}

function generateTechnicalSection(stock) {
    return `
        <div class="technical-metrics">
            <div class="metric">
                <h3>Technical Indicators</h3>
                <div class="kpi-grid">
                    <div class="kpi" title="Relative Strength Index - measures momentum (0-100)">RSI:</div>
                    <div class="kpi-value">${stock.technicalIndicators.rsi}</div>
                    
                    <div class="kpi" title="Moving Average Convergence Divergence signal">MACD Signal:</div>
                    <div class="kpi-value ${stock.technicalIndicators.macdSignal === 'Bullish' ? 'positive' : 'negative'}">
                        ${stock.technicalIndicators.macdSignal}
                    </div>
                    
                    <div class="kpi" title="Price level where buying pressure is expected">Support Level:</div>
                    <div class="kpi-value">$${stock.trends.tradingMetrics.support.toFixed(2)}</div>
                    
                    <div class="kpi" title="Price level where selling pressure is expected">Resistance Level:</div>
                    <div class="kpi-value">$${stock.trends.tradingMetrics.resistance.toFixed(2)}</div>
                </div>
            </div>
            <div class="metric">
                <h3>Analysis Summary</h3>
                <p title="Comprehensive analysis of all factors">${generateExplanation(stock)}</p>
            </div>
        </div>
    `;
}

function generateExplanation(analysis) {
    const explanations = [];
    
    // Technical Analysis
    explanations.push(`Technical Analysis: ${analysis.technicalIndicators.macdSignal} trend with RSI at ${analysis.technicalIndicators.rsi}`);
    
    // Price Movement
    if (Math.abs(analysis.trends.priceChange) > 2) {
        explanations.push(
            analysis.trends.priceChange > 0 
                ? `Strong positive price movement of ${analysis.trends.priceChange.toFixed(2)}%`
                : `Price decline of ${Math.abs(analysis.trends.priceChange).toFixed(2)}%`
        );
    }

    // Risk Assessment
    const riskLevel = analysis.riskMetrics.overallRisk > 0.7 ? 'high' : 
                     analysis.riskMetrics.overallRisk > 0.3 ? 'moderate' : 'low';
    explanations.push(`Risk level is ${riskLevel} based on volatility and momentum metrics`);

    // Trading Range
    explanations.push(`Trading between support ($${analysis.trends.tradingMetrics.support.toFixed(2)}) and resistance ($${analysis.trends.tradingMetrics.resistance.toFixed(2)})`);

    // Market Cap Context
    explanations.push(`${analysis.companyInfo.marketCap} stock with ${analysis.technicalIndicators.trendStrength}% trend strength`);

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
    generatePriceInfo,
    generateAnalystInfo,
    generateTechnicalSection,
    generateAnalystBar,
    generateExplanation,
    generatePriceTargets,
    generateMetricsSection,
    formatAnalystBreakdown(recommendations) {
        const { strongBuy, buy, hold, sell } = recommendations.breakdown;
        return `${strongBuy}/${buy}/${hold}/${sell}`;
    }
}; 