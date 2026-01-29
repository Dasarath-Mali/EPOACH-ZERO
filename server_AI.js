const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const multer = require("multer");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

// ⚠️ PUT REAL KEY HERE
const API_KEY = "AIzaSyA7VgsKbK5u7LMYYVpqWIcXWz1DW6BURlI";

// ---------------- TEXT CHAT ----------------
app.post("/chat", async (req, res) => {
  try {
    const userText = req.body.message;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userText }] }]
        })
      }
    );

    const data = await response.json();
    console.log("RAW:", data);

    if (data.error) {
      return res.json({ reply: "API error: " + data.error.message });
    }

    if (!data.candidates || !data.candidates.length) {
      return res.json({ reply: "No AI response. Try again." });
    }

    const reply = data.candidates[0].content.parts[0].text;

    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.json({ reply: "Backend crashed." });
  }
});

// ---------------- IMAGE ----------------
app.post("/analyze-image", upload.single("image"), async (req, res) => {
  try {
    const imgBase64 = fs.readFileSync(req.file.path, "base64");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: "Describe this image" },
              { inline_data: { mime_type: "image/jpeg", data: imgBase64 } }
            ]
          }]
        })
      }
    );

    const data = await response.json();
    console.log("IMAGE RAW:", data);

    if (data.error) {
      return res.json({ reply: "Image API error." });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "No image response";

    fs.unlinkSync(req.file.path);

    res.json({ reply });

  } catch {
    res.json({ reply: "Image processing failed." });
  }
});

app.listen(3001, () => {
  console.log("AI Server running at http://localhost:3001");
});
