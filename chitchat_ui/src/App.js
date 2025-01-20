import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

export default function App() {
  const [username, setUsername] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [users, setUsers] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [typingUser, setTypingUser] = useState(null);

  useEffect(() => {
    if (isLoggedIn) {
      socket.emit("login", username);

      socket.on("users", (onlineUsers) => {
        setUsers(onlineUsers);
      });

      socket.on("receiveMessage", (message) => {
        setMessages((prev) => [...prev, message]);
      });

      socket.on("typing", ({ sender, isTyping }) => {
        setTypingUser(isTyping ? sender : null);
      });
    }
  }, [isLoggedIn]);

  const handleSendMessage = () => {
    if (newMessage.trim() && currentChat) {
      const message = {
        sender: username,
        receiver: currentChat,
        text: newMessage,
      };
      socket.emit("sendMessage", message);
      setMessages((prev) => [...prev, message]);
      setNewMessage("");
      socket.emit("typing", { sender: username, receiver: currentChat, isTyping: false });
    }
  };

  const handleTyping = (isTyping) => {
    if (currentChat) {
      socket.emit("typing", { sender: username, receiver: currentChat, isTyping });
    }
  };

  return (
    <div className="h-screen bg-gray-100 flex">
      {!isLoggedIn ? (
        <div className="m-auto p-6 bg-white shadow-lg rounded-lg text-center">
          <h1 className="text-2xl font-bold mb-4">Login</h1>
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded mb-4"
          />
          <button
            onClick={() => setIsLoggedIn(true)}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Login
          </button>
        </div>
      ) : (
        <div className="flex w-full h-full">
          {/* Sidebar */}
          <div className="w-1/3 bg-white border-r">
            <div className="p-4 border-b">
              <h2 className="text-xl font-bold">Chats</h2>
            </div>
            <ul className="overflow-y-auto h-full">
              {users.map((user) => (
                <li
                  key={user.username}
                  onClick={() => setCurrentChat(user.username)}
                  className={`p-4 cursor-pointer flex items-center ${
                    currentChat === user.username ? "bg-green-100" : "hover:bg-gray-100"
                  }`}
                >
                  <span
                    className={`w-3 h-3 rounded-full mr-2 ${
                      user.online ? "bg-green-500" : "bg-gray-400"
                    }`}
                  ></span>
                  <span className="font-medium">{user.username}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Chat Window */}
          <div className="flex flex-col w-2/3 bg-gray-50">
            {currentChat ? (
              <>
                <div className="p-4 border-b flex justify-between items-center">
                  <h2 className="text-lg font-bold">{currentChat}</h2>
                  {typingUser === currentChat && (
                    <span className="text-sm text-gray-500">Typing...</span>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {messages
                    .filter(
                      (msg) =>
                        (msg.sender === username && msg.receiver === currentChat) ||
                        (msg.sender === currentChat && msg.receiver === username)
                    )
                    .map((msg, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg max-w-sm ${
                          msg.sender === username ? "ml-auto bg-green-200" : "mr-auto bg-white"
                        }`}
                      >
                        {msg.text}
                      </div>
                    ))}
                </div>
                <div className="p-4 border-t flex items-center">
                  <input
                    type="text"
                    placeholder="Type a message"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping(true);
                    }}
                    onBlur={() => handleTyping(false)}
                    className="flex-1 p-2 border border-gray-300 rounded mr-2"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Send
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Select a user to start chatting
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
