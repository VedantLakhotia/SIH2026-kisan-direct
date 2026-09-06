const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const { OpenAI } = require('openai');

const upload = multer({ dest: 'uploads/temp/' });

router.post('/listing', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded.' });
    }

    if (!process.env.OPENAI_API_KEY) {
      // Mock response if no key
      return res.json({ crop: 'Tomatoes', quantity: 100, price: 40, grade: 'A' });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    // Whisper translation/transcription
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: 'whisper-1',
      language: req.query.lang === 'hi' ? 'hi' : 'en'
    });

    const text = transcription.text;
    
    // GPT extraction
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant. Extract farming listing details from text. Return only JSON with keys: crop, quantity (number), price (number), grade (A/B/C)." },
        { role: "user", content: `Extract details from this text: "${text}"` }
      ],
      response_format: { type: "json_object" }
    });

    const data = JSON.parse(completion.choices[0].message.content);
    
    // Clean up temp file
    fs.unlinkSync(req.file.path);

    res.json(data);
  } catch (err) {
    console.error('Voice API error:', err);
    res.json({ crop: 'Unknown', quantity: 0, price: 0, grade: 'B' }); // Fallback
  }
});

module.exports = router;
