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

function getRiskClass(risk) {
    if (risk < 0.3) return 'risk-low';
    if (risk < 0.7) return 'risk-medium';
    return 'risk-high';
}

function generatePriceInfo(stock) {
    return `
        <div class="metric">
            <h3>Price Information</h3>
            <div class="kpi-grid">
                <div class="kpi">Current Price:</div>
                <div class="kpi-value">$${stock.companyInfo.currentPrice.toFixed(2)}</div>
                <div class="kpi">Day Change:</div>
                <div class="kpi-value ${stock.companyInfo.dayChange > 0 ? 'positive' : 'negative'}">
                    ${stock.companyInfo.dayChange > 0 ? '+' : ''}${stock.companyInfo.dayChange.toFixed(2)}%
                </div>
                <div class="kpi">Market Cap:</div>
                <div class="kpi-value">${stock.companyInfo.marketCap}</div>
                <div class="kpi">Day Range:</div>
                <div class="kpi-value">$${stock.companyInfo.dayRange.low.toFixed(2)} - $${stock.companyInfo.dayRange.high.toFixed(2)}</div>
            </div>
        </div>
    `;
}

function generateAnalystBar(breakdown) {
    if (!breakdown) return '';
    
    const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
    if (total === 0) return '';

    return `
        <div class="analyst-segment analyst-strong-buy" style="width: ${(breakdown.strongBuy / total * 100)}%"></div>
        <div class="analyst-segment analyst-buy" style="width: ${(breakdown.buy / total * 100)}%"></div>
        <div class="analyst-segment analyst-hold" style="width: ${(breakdown.hold / total * 100)}%"></div>
        <div class="analyst-segment analyst-sell" style="width: ${((breakdown.sell + breakdown.strongSell) / total * 100)}%"></div>
    `;
}

function generateAnalystInfo(stock) {
    return `
        <div class="metric">
            <h3>Analyst Recommendations</h3>
            <div class="kpi-grid">
                <div class="kpi">Consensus:</div>
                <div class="kpi-value">${stock.analystRecommendations?.consensusScore.toFixed(1) || 'N/A'}/10</div>
                <div class="kpi">Coverage:</div>
                <div class="kpi-value">${stock.analystRecommendations?.total || 0} analysts</div>
            </div>
            <div class="analyst-bar">
                ${generateAnalystBar(stock.analystRecommendations?.breakdown)}
            </div>
            <div class="kpi-grid" style="font-size: 0.8em; margin-top: 5px;">
                <div>Strong Buy: ${stock.analystRecommendations?.breakdown?.strongBuy || 0}</div>
                <div>Buy: ${stock.analystRecommendations?.breakdown?.buy || 0}</div>
                <div>Hold: ${stock.analystRecommendations?.breakdown?.hold || 0}</div>
                <div>Sell: ${stock.analystRecommendations?.breakdown?.sell || 0}</div>
            </div>
        </div>
    `;
}

function generateRiskInfo(stock) {
    return `
        <div class="metric">
            <h3>Risk Assessment</h3>
            <div class="kpi-grid">
                <div class="kpi">Volatility Risk:</div>
                <div class="kpi-value">
                    ${(stock.riskMetrics.volatilityRisk * 10).toFixed(1)}%
                    <div class="risk-meter">
                        <div class="risk-level ${getRiskClass(stock.riskMetrics.volatilityRisk)}" 
                             style="width: ${stock.riskMetrics.volatilityRisk * 100}%">
                        </div>
                    </div>
                </div>
                <div class="kpi">Momentum Risk:</div>
                <div class="kpi-value">
                    ${(stock.riskMetrics.momentumRisk * 10).toFixed(1)}%
                    <div class="risk-meter">
                        <div class="risk-level ${getRiskClass(stock.riskMetrics.momentumRisk)}"
                             style="width: ${stock.riskMetrics.momentumRisk * 100}%">
                        </div>
                    </div>
                </div>
                <div class="kpi">Overall Risk:</div>
                <div class="kpi-value">
                    ${(stock.riskMetrics.overallRisk * 10).toFixed(1)}%
                    <div class="risk-meter">
                        <div class="risk-level ${getRiskClass(stock.riskMetrics.overallRisk)}"
                             style="width: ${stock.riskMetrics.overallRisk * 100}%">
                        </div>
                    </div>
                </div>
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
                    <div class="kpi">RSI:</div>
                    <div class="kpi-value">${stock.technicalIndicators.rsi}</div>
                    <div class="kpi">MACD Signal:</div>
                    <div class="kpi-value ${stock.technicalIndicators.macdSignal === 'Bullish' ? 'positive' : 'negative'}">
                        ${stock.technicalIndicators.macdSignal}
                    </div>
                    <div class="kpi">Support Level:</div>
                    <div class="kpi-value">$${stock.trends.tradingMetrics.support.toFixed(2)}</div>
                    <div class="kpi">Resistance Level:</div>
                    <div class="kpi-value">$${stock.trends.tradingMetrics.resistance.toFixed(2)}</div>
                </div>
            </div>
            <div class="metric">
                <h3>Analysis Summary</h3>
                <p>${generateExplanation(stock)}</p>
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

module.exports = {
    getRecommendationClass,
    getRiskClass,
    generateAnalystBar,
    generateExplanation,
    generateAnalystInfo,
    generateRiskInfo,
    generatePriceInfo,
    generateTechnicalSection
}; 