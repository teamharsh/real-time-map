const express = require("express");
const path = require("path");
const app = express();
const port = 3000;

const http = require("http");
const socketio = require("socket.io");

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

const server = http.createServer(app);
const io = socketio(server);

io.on("connection", (socket) => {
  socket.on("send-location", (data) => {
    io.emit("receive-location", { id: socket.id, ...data });
  });

  socket.on("disconnect", () => {
    io.emit("user-disconnect", socket.id);
  });
});

app.get("/", (req, res) => {
  res.render("index");
});

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
