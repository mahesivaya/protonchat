import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3001", { transports: ["websocket"] });

function App() {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [message, setMessage] = useState("");
  const [joined, setJoined] = useState(false);
  const [usersOnline, setUsersOnline] = useState([]);

  const [roomMessages, setRoomMessages] = useState({});
  const [dmMessages, setDmMessages] = useState({});
  const [currentView, setCurrentView] = useState("room");

  useEffect(() => {
    // 🏠 Room messages
    socket.on("receive_message", (data) => {
      setRoomMessages((prev) => {
        const msgs = prev[data.room] || [];
        return { ...prev, [data.room]: [...msgs, data] };
      });
    });

    // 💌 Private messages
    socket.on("receive_private_message", (data) => {
      const partner = data.from === username ? data.to : data.from;
      setDmMessages((prev) => {
        const msgs = prev[partner] || [];
        return { ...prev, [partner]: [...msgs, data] };
      });
    });

    // 👥 Online users
    socket.on("users_online", (users) => {
      setUsersOnline(users);
    });

    return () => {
      socket.off("receive_message");
      socket.off("receive_private_message");
      socket.off("users_online");
    };
  }, [username]);

  const joinRoom = () => {
    if (username.trim() && room.trim()) {
      socket.emit("join_room", { username, room });
      setJoined(true);
      setCurrentView("room");
    }
  };

  const sendMessage = () => {
    if (!message.trim()) return;

    if (currentView === "room") {
      // 🏠 Send room message
      const msg = {
        room,
        author: username,
        message,
        time: new Date().toLocaleTimeString(),
      };
      socket.emit("send_message", msg);
      // ❌ DO NOT locally add msg here — server sends it back
    } else {
      // 💌 Send direct message
      const msg = {
        from: username,
        to: currentView,
        message,
        time: new Date().toLocaleTimeString(),
      };
      socket.emit("send_private_message", msg);
      // ❌ Do NOT add locally — server echoes back to sender
    }

    setMessage("");
  };

  if (!joined) {
    return (
      <div style={{ padding: "30px", textAlign: "center" }}>
        <h2>Join Chat</h2>
        <input
          placeholder="Your name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          placeholder="Room name"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
        />
        <button onClick={joinRoom}>Join</button>
      </div>
    );
  }

  const messagesToDisplay =
    currentView === "room"
      ? roomMessages[room] || []
      : dmMessages[currentView] || [];

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "sans-serif" }}>
      {/* Sidebar */}
      <div
        style={{
          width: "220px",
          borderRight: "1px solid #ccc",
          padding: "10px",
          background: "#f9f9f9",
        }}
      >
        <h4>💬 Chats</h4>
        <div
          onClick={() => setCurrentView("room")}
          style={{
            padding: "5px",
            marginBottom: "10px",
            cursor: "pointer",
            background: currentView === "room" ? "#ddd" : "transparent",
          }}
        >
          🏠 Room: {room}
        </div>

        <h4>👥 Direct Messages</h4>
        {usersOnline.map(
          (user) =>
            user !== username && (
              <div
                key={user}
                onClick={() => setCurrentView(user)}
                style={{
                  padding: "5px",
                  cursor: "pointer",
                  background:
                    currentView === user ? "#ddd" : "transparent",
                }}
              >
                {user}
              </div>
            )
        )}
      </div>

      {/* Chat Window */}
      <div style={{ flex: 1, padding: "20px" }}>
        <h3>
          {currentView === "room"
            ? `🏠 Room: ${room}`
            : `💌 Chat with ${currentView}`}
        </h3>
        <div
          style={{
            border: "1px solid #ccc",
            height: "400px",
            overflowY: "auto",
            padding: "10px",
            background: "#fafafa",
          }}
        >
          {messagesToDisplay.map((msg, i) => (
            <p key={i}>
              <strong>{msg.author || msg.from}</strong>: {msg.message}{" "}
              <small style={{ color: "#888" }}>({msg.time})</small>
            </p>
          ))}
        </div>

        <div style={{ marginTop: "10px" }}>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            style={{ width: "80%", marginRight: "10px" }}
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
}

export default App;
