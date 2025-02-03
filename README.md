# Stock Market Analysis Tool

A real-time stock market analysis tool that provides technical indicators, analyst recommendations, and AI-driven predictions for a curated list of software and technology stocks.

## Getting Started

### Installation 

## Project Structure

### Main Files
- `index.js`: Entry point of the application. Handles the main execution flow and command-line arguments for mock/live data modes.

### Source Files (`/src`)

#### Core Components

##### `config.js`
- Contains the list of tracked stocks (30 major software and technology companies)
- Stocks are alphabetically sorted and categorized
- Used as a single source of truth for which stocks to analyze

##### `stockPredictionAgent.js`
- Main analysis engine using Finnhub API
- Handles:
  - Stock quote fetching
  - Company profile data
  - Analyst recommendations
  - Technical indicators calculation
  - Price prediction generation
- Provides comprehensive analysis including:
  - RSI (Relative Strength Index)
  - MACD signals
  - Support/Resistance levels
  - Market trends

##### `utils.js`
- Shared utility functions for the entire application
- Handles:
  - HTML generation for different metrics sections
  - Data formatting (prices, percentages, market cap)
  - Recommendation classification
  - Score-to-recommendation conversion
- Contains all reusable UI components and formatting logic

##### `htmlRenderer.js`
- Generates the final HTML output
- Features:
  - Responsive stock list layout
  - Technical indicators display
  - Price and analyst information
  - Interactive elements (expandable details)
  - Signal indicators for significant changes

### Scripts (`/src/scripts`)

##### `refreshData.js`
- Handles data refresh operations
- Supports both live and mock data modes
- Updates the cache with latest stock information

### Data Flow

1. **Data Collection** (`refreshData.js`):
   - Fetches real-time data from Finnhub API
   - Updates local cache

2. **Analysis** (`stockPredictionAgent.js`):
   - Processes raw data
   - Generates technical indicators
   - Calculates predictions

3. **Rendering** (`htmlRenderer.js` + `utils.js`):
   - Formats data for display
   - Generates HTML output
   - Applies styling and interactivity

### Features

- Real-time stock data analysis
- Technical indicators (RSI, MACD)
- Analyst recommendations
- Support/Resistance levels
- Price predictions
- Interactive UI with expandable details
- Change indicators for significant movements
- Mock data support for testing

### Dependencies

- `finnhub`: Stock market API client
- `axios`: HTTP client for API requests
- `node-fetch`: Fetch API for Node.js
- `cross-env`: Cross-platform environment variables (dev dependency)

## Development

The project uses a modular architecture with clear separation of concerns:
- Data fetching and analysis (`stockPredictionAgent.js`)
- UI generation (`htmlRenderer.js`, `utils.js`)
- Configuration (`config.js`)
- Cache management (`/services/cache.js`)

To modify the stock list, update `config.js`. For UI changes, modify `utils.js` and `htmlRenderer.js`. Analysis logic can be adjusted in `stockPredictionAgent.js`. 