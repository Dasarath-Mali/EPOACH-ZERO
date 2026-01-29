const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(express.json());

// ===============================
// DATABASE CONNECTION
// ===============================

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "abcd1234",
    database: "EDU_DB"
});

db.connect(err => {
    if (err) {
        console.error("❌ MySQL failed:", err.message);
        return;
    }
    console.log("✅ MySQL connected");
});

// ===============================
// LOGIN API (TEACHER / STUDENT / PARENT)
// ===============================

app.post("/login", (req, res) => {
    const { role, id, password } = req.body;

    if (!role || !id || !password)
        return res.json({ success:false, message:"Missing fields" });

    const allowed = ["teachers","students","parents"];
    if (!allowed.includes(role))
        return res.json({ success:false, message:"Invalid role" });

    const query = `SELECT * FROM ${role} WHERE id=? AND password=? LIMIT 1`;

    db.query(query,[id,password],(err,result)=>{
        if(err){
            console.error(err);
            return res.json({success:false});
        }

        if(result.length>0)
            res.json({success:true});
        else
            res.json({success:false});
    });
});

// ===============================
// GEMINI AI CHAT API
// ===============================

const GEMINI_KEY = "YOUR_GEMINI_API_KEY";

app.post("/chat", async (req,res)=>{
    try{
        const userMessage = req.body.message;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
          {
            method:"POST",
            headers:{ "Content-Type":"application/json" },
            body: JSON.stringify({
              contents:[{ parts:[{ text:userMessage }] }]
            })
          }
        );

        const data = await response.json();

        const aiReply =
          data.candidates?.[0]?.content?.parts?.[0]?.text || 
          "No AI response";

        // Save chat to DB
        const logQuery = "INSERT INTO chat_logs (prompt, reply) VALUES (?,?)";

        db.query(logQuery,[userMessage, aiReply], err=>{
            if(err) console.error("Chat log error:",err);
        });

        res.json({ reply: aiReply });

    }catch(err){
        console.error(err);
        res.status(500).json({ reply:"AI server error" });
    }
});

// ===============================
// GET CHAT HISTORY (OPTIONAL)
// ===============================

app.get("/chat-history",(req,res)=>{
    db.query(
        "SELECT * FROM chat_logs ORDER BY id DESC LIMIT 50",
        (err,rows)=>{
            if(err) return res.json([]);
            res.json(rows);
        }
    );
});

// ===============================
// START SERVER
// ===============================

app.listen(3000, ()=>{
    console.log("🚀 Server running at http://localhost:3000");
});
