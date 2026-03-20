import express from 'express';
import multer from 'multer';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Set up Multer for form data parsing, storing files in memory buffer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Main chat endpoint
app.post('/api/chat', upload.single('media'), async (req, res) => {
  try {
    const message = req.body.message || '';
    const file = req.file;

    // Use gemini-1.5-pro for complex logic and robust multimodal support
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    // System instruction to format output as structured life-saving actions
    const systemPrompt = `You are a critical Life-Saving Action Converter. Your mission is to take unstructured, messy inputs (e.g., voice text, traffic info, weather data, news, chaotic medical history, emergency photos) and INSTANTLY convert them into structured, verified, and life-saving actions.

Return your response in clean Markdown with the following STRICT sections:
### 🧭 Current Situation Insight
Briefly and objectively state what the emergency/situation is based on the input.

### 💡 Recommended Actions
A numbered list of clear, informative, and immediate steps to secure life and safety safely.

### 🛡️ Secondary Verification & Follow-up
What professional services to contact (911, poison control, etc.) or subsequent steps to stabilize the situation. Keep it concise.

Do NOT add fluff. Be authoritative, clear, and reassuring.`;

    const parts = [
      { text: systemPrompt },
      { text: `User Input: ${message || "No text provided, please analyze the attached media."}` }
    ];

    if (file) {
      parts.push({
        inlineData: {
          data: file.buffer.toString('base64'),
          mimeType: file.mimetype
        }
      });
    }

    const result = await model.generateContent({
      contents: [{ role: "user", parts: parts }],
    });

    const responseText = result.response.text();
    res.json({ response: responseText });
  } catch (error) {
    console.error("Error generating content:", error);
    res.status(500).json({ error: "Failed to process request." });
  }
});

app.listen(port, () => {
  console.log(`Action Engine running on http://localhost:${port}`);
});
