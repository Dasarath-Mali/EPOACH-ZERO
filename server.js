const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ---- DATABASE CONNECTION ----
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "YOUR_MYSQL_PASSWORD",
    database: "edu_connect"
});

db.connect((err) => {
    if (err) {
        console.error("❌ MySQL Connection Failed:", err.message);
        return;
    }
    console.log("✅ Connected to MySQL Database");
});

// ---- LOGIN API ----
app.post("/login", (req, res) => {
    const { role, id, password } = req.body;

    if (!role || !id || !password) {
        return res.json({ success: false, message: "Missing fields" });
    }

    // Only allow known tables for safety
    const allowedRoles = ["teachers", "students", "parents"];
    if (!allowedRoles.includes(role)) {
        return res.json({ success: false, message: "Invalid role" });
    }

    const query = `SELECT * FROM ${role} WHERE id = ? AND password = ? LIMIT 1`;

    db.query(query, [id, password], (err, results) => {
        if (err) {
            console.error("Query Error:", err);
            return res.json({ success: false });
        }

        if (results.length > 0) {
            return res.json({ success: true });
        } else {
            return res.json({ success: false });
        }
    });
});

// ---- START SERVER ----
app.listen(3000, () => {
    console.log("🚀 Server running at http://localhost:3000");
});