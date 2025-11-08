// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST"],
  },
});

let users = {}; // { username: socket.id }

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  socket.on("join_room", ({ username, room }) => {
    users[username] = socket.id;
    socket.join(room);
    console.log(`👤 ${username} joined ${room}`);
    io.emit("users_online", Object.keys(users));
  });

  socket.on("send_message", (data) => {
    io.to(data.room).emit("receive_message", data); // includes sender
  });
  
  socket.on("send_private_message", ({ from, to, message }) => {
    const targetSocketId = users[to];
    if (targetSocketId) {
      const data = {
        from,
        to,
        message,
        time: new Date().toLocaleTimeString(),
      };
      // send to both sender and receiver
      io.to(users[from]).emit("receive_private_message", data);
      io.to(targetSocketId).emit("receive_private_message", data);
    }
  });
  

  socket.on("disconnect", () => {
    const username = Object.keys(users).find(
      (key) => users[key] === socket.id
    );
    if (username) {
      delete users[username];
      io.emit("users_online", Object.keys(users));
      console.log(`❌ ${username} disconnected`);
    }
  });
});

server.listen(3001, () => {
  console.log("🚀 Server running on http://localhost:3001");
});
