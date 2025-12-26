const express = require("express");
const { PORT } = require("./config");

function startServer() {
  const app = express();

  app.get("/", (req, res) => res.send("Bot is alive ✅"));

  app.listen(PORT, () => console.log(`Keep-alive server running on port ${PORT}`));
}

module.exports = { startServer };
