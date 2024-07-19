import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { MainContext } from "../context/MainContext";
import { io } from "socket.io-client";
import "../App.css";
import { useNavigate } from "react-router-dom";
import Messages from "./Messages";
import ReactScrollToBottom from "react-scroll-to-bottom";
import { FaArrowUp } from "react-icons/fa6";

const Socket = () => {
  const { allMessages, setAllMessages } = useContext(MainContext);
  const [message, setMessage] = useState("");
  const [storedSocketId, setStoredSocketId] = useState("");
  const user = localStorage.getItem("user");
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const userId = parseInt(localStorage.getItem("id"));
  const [status, setStatus] = useState([]);

  const socket = useMemo(() => {
    setStoredSocketId(localStorage.getItem("socketId"));
    const options = storedSocketId
      ? { query: { socketId: storedSocketId } }
      : {};
    return io("http://localhost:8001", options);
  }, [storedSocketId]);

  // Fetch messages from the API
  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:8001/api/messages");
      const data = await response.json();
      setAllMessages(data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }, [setAllMessages]);

  const fetchAllUsers = useCallback(async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/user/all");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }, [setUsers]);

  const fetchAllUsersStatus = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:8001/api/status");
      const status = await response.json();
      setStatus(status);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
    fetchAllUsers();
    fetchAllUsersStatus();
  }, [fetchAllUsers, fetchAllUsersStatus, fetchMessages, setAllMessages]);

  const handleMessage = () => {
    const senderSocketId = localStorage.getItem("socketId");
    const senderId = users.filter((item) =>
      item.full_name === user ? item : null
    );

    const receiverId = activeUser?.id;
    const receiverSocketId = activeUser?.socket_id;
    const newMessage = {
      senderSocketId,
      senderId: senderId[0]?.id,
      receiverSocketId,
      receiverId,
      message,
    };
    socket.emit("message", newMessage);
    fetchMessages();
    setMessage("");
  };

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("socketId");
    localStorage.removeItem("email");
    setAllMessages([]);
    navigate("/login");
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else {
      navigate("/");
    }
  }, [navigate, user]);

  useEffect(() => {
    socket.on("receive-message", () => {
      fetchMessages();
    });
  }, [fetchMessages, socket]);

  useEffect(() => {
    if (!storedSocketId) {
      socket.on("connect", () => {
        console.log(`${user} is connected with ${socket.id}`);
        localStorage.setItem("socketId", socket.id);
      });
    }

    socket.emit("joined", { user, storedSocketId, userId });

    if (!user) {
      socket.off();
      socket.disconnect();
      localStorage.removeItem("socketId");
      localStorage.removeItem("email");
      localStorage.removeItem("user");
      localStorage.removeItem("id");
    }

    return () => {
      socket.off();
      socket.disconnect();
      localStorage.removeItem("socketId");
      localStorage.removeItem("email");
      localStorage.removeItem("user");
      localStorage.removeItem("id");
    };
  }, [socket, storedSocketId, user, userId]);

  useEffect(() => {
    socket.on("user-connected", () => {
      fetchAllUsersStatus();
    });
    socket.on("user-disconnected", () => {
      fetchAllUsersStatus();
    });

    return () => {
      socket.off("user-connected");
      socket.off("user-disconnected");
    };
  }, [socket, fetchAllUsersStatus]);

  if (!user) {
    return <p>loading..</p>;
  }

  const handleUserData = (userData) => {
    setActiveUser(userData);
  };

  return (
    <main className="main__container">
      <section className="chat__heading__main">
        {user && <span>Profile : {user} </span>}
        <button className="log__out" onClick={handleLogout}>
          Log out
        </button>
      </section>
      <main className="chat__container">
        <section className="chat__input__container">
          <section className="chat__section2">
            {activeUser && (
              <span>
                {activeUser?.full_name}

                {status.some(
                  (stat) =>
                    stat.user_id === activeUser?.id && stat.is_active === true
                ) ? (
                  <span
                    style={{
                      color: "green",
                      fontWeight: "500",
                      fontSize: "10px",
                    }}
                  >
                    online
                  </span>
                ) : (
                  <span
                    style={{
                      color: "red",
                      fontWeight: "500",
                      fontSize: "10px",
                    }}
                  >
                    offline
                  </span>
                )}
              </span>
            )}
          </section>
          <ReactScrollToBottom className="chat__messages">
            {allMessages
              .filter(
                (item) =>
                  (item.receiver_id === userId &&
                    item.sender_id === activeUser?.id) ||
                  (item.sender_id === userId &&
                    item.receiver_id === activeUser?.id)
              )
              .map((item, ind) => (
                <div key={ind}>
                  <Messages
                    user={
                      item.sender_id === userId ? "" : activeUser?.full_name
                    }
                    message={item.message}
                    time_date={item.created_at}
                    classs={item.sender_id === userId ? "right" : "left"}
                  />
                </div>
              ))}
          </ReactScrollToBottom>
          <section className="chat__input__section3">
            <textarea
              type="text"
              placeholder="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />

            <button onClick={handleMessage}>
              <FaArrowUp style={{ fontSize: "1rem" }} />
            </button>
          </section>
        </section>

        <section className="users__container">
          {users.map((userVal, ind) => (
            <div key={ind} className="users__data">
              <button
                onClick={() => handleUserData(userVal)}
                className={`users__data ${
                  activeUser === userVal ? "active" : ""
                }`}
                style={{ position: "relative" }}
              >
                {userVal.full_name}
                <span style={{ fontSize: "12px" }}></span>
                <span style={{ color: "brown", marginLeft: "0.5rem" }}>
                  {userVal?.full_name === user ? (
                    <span style={{ fontSize: "0.8rem" }}>(me)</span>
                  ) : (
                    ""
                  )}
                </span>
              </button>
            </div>
          ))}
        </section>
      </main>
    </main>
  );
};

export default Socket;
