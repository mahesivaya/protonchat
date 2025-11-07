import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

// connect once
const socket = io("http://localhost:3001", { transports: ["websocket"] });

function App() {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    const handleReceiveMessage = (data) => {
      console.log("📩 Received message:", data);
      setChat((prev) => [...prev, data]);
    };

    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, []);

  const joinRoom = () => {
    if (username.trim() && room.trim()) {
      socket.emit("join_room", room);
      setJoined(true);
      console.log(`🟢 Joined room: ${room}`);
    }
  };

  const sendMessage = () => {
    if (message.trim()) {
      const messageData = {
        room,
        author: username,
        message,
        time: new Date().toLocaleTimeString(),
      };

      // Send to server only — don’t add locally
      socket.emit("send_message", messageData);
      setMessage("");
    }
  };

  if (!joined) {
    return (
      <div style={{ padding: "30px", textAlign: "center" }}>
        <h2>🔑 Join Chat Room</h2>
        <input
          placeholder="Enter your name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ marginRight: "10px" }}
        />
        <input
          placeholder="Room name"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          style={{ marginRight: "10px" }}
        />
        <button onClick={joinRoom}>Join</button>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "auto" }}>
      <h2>💬 Room: {room}</h2>
      <div
        style={{
          border: "1px solid #ccc",
          height: "300px",
          overflowY: "auto",
          padding: "10px",
          background: "#fafafa",
          marginBottom: "10px",
        }}
      >
        {chat.map((msg, i) => (
          <p key={i}>
            <strong>{msg.author}</strong>: {msg.message}{" "}
            <small style={{ color: "#888" }}>({msg.time})</small>
          </p>
        ))}
      </div>

      <input
        type="text"
        value={message}
        placeholder="Type a message..."
        onChange={(e) => setMessage(e.target.value)}
        style={{ width: "80%", marginRight: "10px" }}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default App;
