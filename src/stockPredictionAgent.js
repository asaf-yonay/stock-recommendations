const finnhub = require('finnhub');
const { getRecommendationClass } = require('./utils');

// Define your API key here
const API_KEY = 'cudu12hr01qiosq15e7gcudu12hr01qiosq15e80'; // Replace with your actual API key

class StockPredictionAgent {
    constructor(apiKey) {
        if (!apiKey) {
            throw new Error('Finnhub API key is required');
        }

        // Initialize Finnhub client according to latest docs
        const finnhubClient = new finnhub.DefaultApi();
        finnhub.ApiClient.instance.authentications['api_key'].apiKey = apiKey;
        this.finnhubClient = finnhubClient;
        
        this.stockData = {};
        this.newsData = {};
    }

    async fetchStockData(symbol) {
        try {
            const [quote, companyProfile] = await Promise.all([
                this.fetchQuote(symbol),
                this.fetchCompanyProfile(symbol)
            ]);

            if (!quote || !companyProfile) {
                return null;
            }

            return {
                quote,
                companyProfile
            };
        } catch (error) {
            console.error('Error fetching stock data:', error);
            return null;
        }
    }

    async fetchQuote(symbol) {
        return new Promise((resolve, reject) => {
            this.finnhubClient.quote(symbol, (error, data) => {
                if (error) {
                    console.error('Quote error:', error);
                    reject(error);
                } else {
                    resolve(data);
                }
            });
        });
    }

    async fetchCompanyProfile(symbol) {
        return new Promise((resolve, reject) => {
            this.finnhubClient.companyProfile2({ symbol }, (error, data) => {
                if (error) {
                    console.error('Company profile error:', error);
                    reject(error);
                } else {
                    resolve(data);
                }
            });
        });
    }

    async fetchAnalystRecommendations(symbol) {
        return new Promise((resolve, reject) => {
            this.finnhubClient.recommendationTrends(symbol, (error, data) => {
                if (error) {
                    console.error('Analyst recommendations error:', error);
                    reject(error);
                } else {
                    // Get the most recent month's recommendations
                    const latestRec = data && data[0] ? data[0] : null;
                    if (latestRec) {
                        console.log(`Analyst recommendations for ${symbol}:`, latestRec);
                        resolve({
                            consensusScore: this.calculateConsensusScore(latestRec),
                            breakdown: {
                                strongBuy: latestRec.strongBuy || 0,
                                buy: latestRec.buy || 0,
                                hold: latestRec.hold || 0,
                                sell: latestRec.sell || 0,
                                strongSell: latestRec.strongSell || 0
                            },
                            total: latestRec.strongBuy + latestRec.buy + latestRec.hold + 
                                  latestRec.sell + latestRec.strongSell
                        });
                    } else {
                        resolve(null);
                    }
                }
            });
        });
    }

    calculateConsensusScore(recommendations) {
        const total = recommendations.strongBuy + recommendations.buy + 
                     recommendations.hold + recommendations.sell + recommendations.strongSell;
        
        if (total === 0) return 5; // Neutral if no recommendations

        return (
            (recommendations.strongBuy * 10 +
             recommendations.buy * 7.5 +
             recommendations.hold * 5 +
             recommendations.sell * 2.5 +
             recommendations.strongSell * 0) / total
        );
    }

    analyzeTrends(stockData) {
        const prices = stockData.historicalData.map(day => day.close);
        
        const priceChange = ((prices[0] - prices[prices.length - 1]) / prices[prices.length - 1]) * 100;
        const volatility = this.calculateVolatility(prices);
        const momentum = this.calculateMomentum(prices);
        
        return { priceChange, volatility, momentum };
    }

    calculateVolatility(prices) {
        const returns = prices.slice(1).map((price, i) => 
            (price - prices[i]) / prices[i]
        );
        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
        return Math.sqrt(variance);
    }

    calculateMomentum(prices) {
        const shortTerm = (prices[0] - prices[6]) / prices[6]; // 7-day momentum
        const longTerm = (prices[0] - prices[29]) / prices[29]; // 30-day momentum
        return (shortTerm + longTerm) / 2;
    }

    analyzeNews(newsData) {
        if (!newsData.feed) return 0;
        
        const sentimentScore = newsData.feed
            .slice(0, 10) // Consider last 10 news items
            .reduce((score, item) => {
                return score + (parseFloat(item.overall_sentiment_score) || 0);
            }, 0) / 10;
        
        return sentimentScore;
    }

    async analyzeTicker(symbol) {
        try {
            console.log(`Starting analysis for ${symbol}...`);
            
            // Remove Yahoo Finance from parallel requests
            const [stockData, analystRecs] = await Promise.all([
                this.fetchStockData(symbol),
                this.fetchAnalystRecommendations(symbol)
            ]);
            
            if (!stockData) {
                console.error(`No stock data available for ${symbol}`);
                return null;
            }

            const trends = {
                priceChange: stockData.quote.dp || 0,
                volatility: Math.abs(stockData.quote.dp || 0) / 100,
                momentum: (stockData.quote.dp || 0) / 100,
                tradingMetrics: {
                    support: stockData.quote.c * 0.95,
                    resistance: stockData.quote.c * 1.05
                }
            };

            const riskMetrics = {
                volatilityRisk: trends.volatility,
                momentumRisk: Math.abs(trends.momentum),
                overallRisk: (trends.volatility + Math.abs(trends.momentum)) / 2
            };

            const prediction = this.generatePrediction(trends, riskMetrics, analystRecs);

            return {
                symbol,
                prediction,
                recommendation: this.getRecommendation(prediction),
                trends,
                riskMetrics,
                analystRecommendations: analystRecs,
                technicalIndicators: {
                    rsi: this.calculateRSI(trends),
                    macdSignal: trends.momentum > 0 ? 'Bullish' : 'Bearish',
                    trendStrength: Math.abs(trends.momentum * 100)
                },
                companyInfo: {
                    name: stockData.companyProfile.name || symbol,
                    currentPrice: stockData.quote.c,
                    dayChange: stockData.quote.dp,
                    marketCap: this.formatMarketCap(stockData.companyProfile.marketCapitalization),
                    dayRange: {
                        low: stockData.quote.l,
                        high: stockData.quote.h
                    }
                }
            };
        } catch (error) {
            console.error(`Error in analyzeTicker for ${symbol}:`, error);
            throw error;
        }
    }

    formatMarketCap(marketCap) {
        if (!marketCap) return 'N/A';
        if (marketCap >= 1000) return `$${(marketCap/1000).toFixed(1)}T`;
        if (marketCap >= 1) return `$${marketCap.toFixed(1)}B`;
        return `$${(marketCap * 1000).toFixed(1)}M`;
    }

    calculateRSI(trends) {
        // Simplified RSI calculation
        return (50 + (trends.momentum * 50)).toFixed(2);
    }

    generatePrediction(trends, riskMetrics, analystRecs) {
        // Base score starts at 5 (neutral)
        let score = 5;

        // Technical factors (-3 to +3)
        score += (trends.momentum * 3);
        
        // Risk adjustment (-1 to 0)
        score -= riskMetrics.overallRisk;

        // Analyst impact (if available)
        if (analystRecs && analystRecs.consensusScore) {
            score = (score + analystRecs.consensusScore) / 2;
        }

        // Ensure score stays within 1-10 range
        return Math.max(1, Math.min(10, score));
    }

    getRecommendation(score) {
        if (score >= 8) return 'Strong Buy';
        if (score >= 6) return 'Buy';
        if (score > 4) return 'Hold';
        if (score > 2) return 'Sell';
        return 'Strong Sell';
    }
}

// Create instance with the API key constant defined above
const agent = new StockPredictionAgent(API_KEY);
module.exports = agent; 