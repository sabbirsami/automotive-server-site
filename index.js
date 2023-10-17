const express = require("express");
const cors = require("cors");
const path = require("path");
const port = process.env.PORT || 5000;
const app = express();

// MIDDLEWARE
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "/index.html"));
});

app.listen(port, () => {
    console.log("Server started at http://localhost:" + port);
});
