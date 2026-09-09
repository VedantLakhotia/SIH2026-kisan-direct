const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

// Try to load OpenAI — it's optional (used for smart extraction when credits are available)
let OpenAI;
try {
  ({ OpenAI } = require('openai'));
} catch (e) {
  console.log('OpenAI package not installed — will use regex extraction only.');
}

const upload = multer({ dest: 'uploads/temp/' });

// Map uploaded file MIME types to proper extensions for Sarvam
const MIME_TO_EXT = {
  'audio/webm': 'webm',
  'video/webm': 'webm',
  'audio/ogg': 'ogg',
  'audio/mp4': 'mp4',
  'audio/x-m4a': 'm4a',
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/wav': 'wav',
  'audio/wave': 'wav',
  'audio/x-wav': 'wav',
  'audio/flac': 'flac',
  'audio/aac': 'aac',
  'application/octet-stream': 'webm', // fallback
};

router.post('/listing', upload.single('audio'), async (req, res) => {
  try {
    // ── Validate input ──────────────────────────────────────────
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded.' });
    }

    console.log('[Voice] Received file:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    if (!process.env.SARVAM_API_KEY) {
      fs.unlinkSync(req.file.path);
      return res.status(500).json({ error: 'Missing SARVAM_API_KEY in server/.env' });
    }

    // ── 1. Send audio to Sarvam AI for speech-to-text ───────────
    const ext = MIME_TO_EXT[req.file.mimetype] || 'webm';
    const filename = `audio.${ext}`;
    const contentType = req.file.mimetype || 'audio/webm';

    const form = new FormData();
    form.append('file', fs.createReadStream(req.file.path), {
      filename,
      contentType,
    });
    form.append('model', 'saaras:v3');
    form.append('mode', 'translate');

    console.log('[Voice] Sending to Sarvam AI…', { filename, contentType, size: req.file.size });

    let text = '';
    try {
      const sarvamRes = await axios.post(
        'https://api.sarvam.ai/speech-to-text',
        form,
        {
          headers: {
            ...form.getHeaders(),
            'api-subscription-key': process.env.SARVAM_API_KEY,
          },
          timeout: 30000,
        }
      );
      text = (sarvamRes.data.transcript || '').trim();
      console.log('[Voice] Sarvam transcript:', text);
    } catch (apiErr) {
      const detail = apiErr.response?.data || apiErr.message;
      console.error('[Voice] Sarvam API error:', detail);
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(502).json({
        error: 'Speech recognition failed. Please speak clearly and try again.',
      });
    }

    // Handle empty transcript (silence / noise)
    if (!text) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.json({
        transcript: '',
        parsed: { crop: null, quantity: null, price: null, grade: null },
      });
    }

    // ── 2. Extract structured data from transcript ──────────────
    let parsedData = null;

    // Try OpenAI first (only if package is available and key has credits)
    if (
      OpenAI &&
      process.env.OPENAI_API_KEY &&
      process.env.OPENAI_API_KEY !== 'your_openai_api_key_here'
    ) {
      try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'Extract farming listing details from the user text. Return ONLY JSON: { "crop": string, "quantity": number, "price": number, "grade": "A"|"B"|"C" }. Use null for missing values.',
            },
            { role: 'user', content: text },
          ],
          response_format: { type: 'json_object' },
        });
        parsedData = JSON.parse(completion.choices[0].message.content);
        console.log('[Voice] OpenAI extraction:', parsedData);
      } catch (err) {
        console.warn('[Voice] OpenAI failed, using regex fallback:', err.message);
      }
    }

    // Regex fallback — always runs when OpenAI didn't produce valid results
    if (!parsedData || !parsedData.crop) {
      parsedData = extractWithRegex(text);
      console.log('[Voice] Regex extraction:', parsedData);
    }

    // ── Cleanup and respond ─────────────────────────────────────
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    res.json({
      transcript: text,
      parsed: parsedData,
    });
  } catch (err) {
    console.error('[Voice] Unexpected error:', err);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Regex-based extraction (no external API needed) ──────────────
function extractWithRegex(text) {
  const result = { crop: null, quantity: null, price: null, grade: null };
  const lower = text.toLowerCase();

  // Crop detection — includes plurals & common Sarvam transcription variants
  const cropPatterns = [
    [/\b(tomato(?:e?s)?)\b/i, 'Tomato'],
    [/\b(onion(?:s)?)\b/i, 'Onion'],
    [/\b(potato(?:e?s)?)\b/i, 'Potato'],
    [/\b(cabbage(?:s)?)\b/i, 'Cabbage'],
    [/\b(cauliflower(?:s)?)\b/i, 'Cauliflower'],
    [/\b(wheat)\b/i, 'Wheat'],
    [/\b(rice)\b/i, 'Rice'],
    [/\b(spinach)\b/i, 'Spinach'],
    [/\b(mango(?:e?s)?)\b/i, 'Mango'],
    [/\b(banana(?:s)?)\b/i, 'Banana'],
    [/\b(garlic)\b/i, 'Garlic'],
    [/\b(peas?)\b/i, 'Peas'],
    [/\b(chilli(?:e?s)?|chili(?:e?s)?)\b/i, 'Chilli'],
    [/\b(brinjal(?:s)?|eggplant(?:s)?)\b/i, 'Brinjal'],
    [/\b(okra|lady\s*finger(?:s)?|bhindi)\b/i, 'Okra'],
    [/\b(carrot(?:s)?)\b/i, 'Carrot'],
    [/\b(sugarcane)\b/i, 'Sugarcane'],
  ];

  for (const [pattern, name] of cropPatterns) {
    if (pattern.test(lower)) {
      result.crop = name;
      break;
    }
  }

  // Quantity — "100 kg", "50 kilos", "200 kilogram"
  const qtyMatch = text.match(/(\d+)\s*(?:kg|kgs|kilo(?:s|gram|grams)?)\b/i);
  if (qtyMatch) result.quantity = parseInt(qtyMatch[1], 10);

  // Price — "30 rupees", "₹50", "50 rs", "30 per kilo", "Rs. 40"
  const priceMatch = text.match(
    /(?:₹|rs\.?\s*|rupees?\s*)?(\d+)\s*(?:rupees?|rs\.?|per\s*(?:kg|kilo(?:gram)?)|₹)|\b(?:₹|rs\.?)\s*(\d+)/i
  );
  if (priceMatch) {
    result.price = parseInt(priceMatch[1] || priceMatch[2], 10);
  }

  // Grade — "grade A", "Grade B", "grade C"
  const gradeMatch = text.match(/grade\s*([a-c])/i);
  if (gradeMatch) result.grade = gradeMatch[1].toUpperCase();

  return result;
}

module.exports = router;
