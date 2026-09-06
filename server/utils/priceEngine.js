const db = require('../db');

async function getMandiPrices(crop) {
  try {
    const res = await db.query(
      `SELECT * FROM price_data 
       WHERE crop_name = $1 
       ORDER BY date DESC, market_name ASC 
       LIMIT 20`,
      [crop]
    );
    return res.rows;
  } catch (error) {
    console.error('Error fetching mandi prices:', error);
    return [];
  }
}

async function getRecommendedPrice(crop, grade, quantity) {
  try {
    const prices = await getMandiPrices(crop);
    if (!prices || prices.length === 0) {
      return {
        recommended_price: 0,
        min_market: 0,
        max_market: 0,
        avg_market: 0,
        trend: 'stable',
        reasoning: 'No market data available.'
      };
    }

    const todayPrices = prices.filter(p => new Date(p.date).toDateString() === new Date().toDateString());
    const yesterdayPrices = prices.filter(p => new Date(p.date).toDateString() === new Date(Date.now() - 86400000).toDateString());

    const activePrices = todayPrices.length > 0 ? todayPrices : prices;
    
    let sumModal = 0, minMarket = Infinity, maxMarket = -Infinity;
    activePrices.forEach(p => {
      const modal = parseFloat(p.modal_price);
      sumModal += modal;
      if (modal < minMarket) minMarket = modal;
      if (modal > maxMarket) maxMarket = modal;
    });
    
    let avgMarket = activePrices.length > 0 ? sumModal / activePrices.length : 0;

    let avgYesterday = 0;
    if (yesterdayPrices.length > 0) {
      let sum = 0;
      yesterdayPrices.forEach(p => sum += parseFloat(p.modal_price));
      avgYesterday = sum / yesterdayPrices.length;
    }

    let trend = 'stable';
    if (avgYesterday > 0) {
      if (avgMarket > avgYesterday * 1.05) trend = 'up';
      else if (avgMarket < avgYesterday * 0.95) trend = 'down';
    }

    let recommended = avgMarket;
    let reasoning = `Base market average: ₹${avgMarket.toFixed(2)}/kg.`;

    if (grade === 'A') { recommended *= 1.10; reasoning += ' Grade A premium (+10%).'; }
    else if (grade === 'C') { recommended *= 0.85; reasoning += ' Grade C discount (-15%).'; }

    if (quantity > 500) {
      recommended *= 0.95;
      reasoning += ' Volume discount (>500kg, -5%).';
    }

    return {
      recommended_price: Math.round(recommended * 100) / 100,
      min_market: minMarket === Infinity ? 0 : minMarket,
      max_market: maxMarket === -Infinity ? 0 : maxMarket,
      avg_market: Math.round(avgMarket * 100) / 100,
      trend,
      reasoning
    };

  } catch (error) {
    console.error('Error calculating recommended price:', error);
    throw error;
  }
}

const axios = require('axios');

async function refreshPrices() {
  try {
    const apiKey = process.env.DATA_GOV_API_KEY;
    
    if (!apiKey || apiKey === 'your_real_key_goes_here') {
      console.log('Skipping real API fetch: No DATA_GOV_API_KEY provided in .env');
      return;
    }

    console.log('Fetching live prices from data.gov.in (Agmarknet)...');
    
    // This is the standard data.gov.in resource ID for daily mandi prices
    const resourceId = '9ef84268-d588-465a-a308-a864a43d0070';
    const url = `https://api.data.gov.in/resource/${resourceId}?api-key=${apiKey}&format=json&limit=500`;

    const response = await axios.get(url);
    const records = response.data.records;

    if (!records || records.length === 0) {
      console.log('No records returned from the API today.');
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    // Get the unique crops we care about to update
    const res = await db.query(`SELECT DISTINCT crop_name FROM price_data`);
    const myCrops = res.rows.map(r => r.crop_name.toLowerCase());

    for (let record of records) {
      // data.gov.in fields: commodity, market, min_price, max_price, modal_price
      const cropName = record.commodity;
      const marketName = record.market;
      
      // Only insert crops we actually support/care about in our app
      if (cropName && myCrops.includes(cropName.toLowerCase())) {
        const minPrice = parseFloat(record.min_price) / 100; // API usually returns prices per Quintal (100kg), we need per kg
        const maxPrice = parseFloat(record.max_price) / 100;
        const modalPrice = parseFloat(record.modal_price) / 100;

        // Skip if price is invalid
        if (isNaN(modalPrice) || modalPrice <= 0) continue;

        await db.query(
          `INSERT INTO price_data (crop_name, market_name, min_price, max_price, modal_price, date)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [cropName, marketName, minPrice, maxPrice, modalPrice, today]
        );
      }
    }
    
    console.log('Successfully refreshed prices from Agmarknet!');
  } catch (error) {
    console.error('Error refreshing prices from API:', error.message);
  }
}

module.exports = {
  getMandiPrices,
  getRecommendedPrice,
  refreshPrices
};
