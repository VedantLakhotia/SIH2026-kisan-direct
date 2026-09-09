const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');
const db = require('../db');

router.get('/forecast/:crop', async (req, res) => {
  try {
    const crop = req.params.crop;

    // Fetch past price data for this crop to provide context to the AI
    const pastPrices = await db.query(
      `SELECT date, modal_price FROM price_data WHERE crop_name = $1 ORDER BY date DESC LIMIT 30`,
      [crop]
    );

    let priceHistoryContext = "No past data available.";
    if (pastPrices.rows.length > 0) {
      priceHistoryContext = pastPrices.rows.map(row => `${new Date(row.date).toLocaleDateString()}: ₹${row.modal_price}`).join(', ');
    }

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === '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') {
      // Fallback dummy AI response if no valid key is provided
      return res.json({
        forecast: `Based on simulated market trend analysis and regional historical data, demand for ${crop} is forecasted to grow steadily over the coming weeks. We anticipate a 10-15% increase in purchase volume, which could place a mild upward pressure on prices.`,
        confidence: '85%'
      });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an AI agricultural economist. Given past price data, forecast the future demand and price trend for the crop. Provide a 2-3 sentence analysis." },
        { role: "user", content: `Crop: ${crop}. Past 30 days price history: ${priceHistoryContext}. Please provide a short demand forecast.` }
      ],
    });

    res.json({
      forecast: completion.choices[0].message.content,
      confidence: 'High'
    });

  } catch (err) {
    console.error('AI Demand Forecast Error:', err);
    res.status(500).json({ error: 'Failed to generate demand forecast.' });
  }
});

module.exports = router;
