const finnhub = require('finnhub');
const { getRecommendationFromScore } = require('./utils');

const API_KEY = 'cudu12hr01qiosq15e7gcudu12hr01qiosq15e80';

class StockPredictionAgent {
    constructor(apiKey) {
        if (!apiKey) {
            throw new Error('Finnhub API key is required');
        }

        const finnhubClient = new finnhub.DefaultApi();
        finnhub.ApiClient.instance.authentications['api_key'].apiKey = apiKey;
        this.finnhubClient = finnhubClient;
    }

    async fetchStockData(symbol) {
        try {
            const [quote, companyProfile] = await Promise.all([
                this.fetchQuote(symbol),
                this.fetchCompanyProfile(symbol)
            ]);

            return quote && companyProfile ? { quote, companyProfile } : null;
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
                    const latestRec = data && data[0] ? data[0] : null;
                    if (latestRec) {
                        const total = latestRec.strongBuy + latestRec.buy + 
                                    latestRec.hold + latestRec.sell + latestRec.strongSell;
                        
                        const consensusScore = (
                            (latestRec.strongBuy * 10 +
                             latestRec.buy * 7.5 +
                             latestRec.hold * 5 +
                             latestRec.sell * 2.5 +
                             latestRec.strongSell * 0) / total
                        );

                        resolve({
                            consensusScore,
                            breakdown: {
                                strongBuy: latestRec.strongBuy || 0,
                                buy: latestRec.buy || 0,
                                hold: latestRec.hold || 0,
                                sell: latestRec.sell || 0,
                                strongSell: latestRec.strongSell || 0
                            },
                            total
                        });
                    } else {
                        resolve(null);
                    }
                }
            });
        });
    }

    async analyzeTicker(symbol) {
        try {
            console.log(`Starting analysis for ${symbol}...`);
            
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

            const prediction = this.generatePrediction(trends, analystRecs);

            return {
                symbol,
                prediction,
                recommendation: getRecommendationFromScore(prediction),
                trends,
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
        return (50 + (trends.momentum * 50)).toFixed(2);
    }

    generatePrediction(trends, analystRecs) {
        let score = 5;
        score += (trends.momentum * 3);
        
        if (analystRecs?.consensusScore) {
            score = (score + analystRecs.consensusScore) / 2;
        }

        return Math.max(1, Math.min(10, score));
    }
}

const agent = new StockPredictionAgent(API_KEY);
module.exports = agent; 