import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { MainContext } from "../context/MainContext";
import { io } from "socket.io-client";
import "../App.css";
import { useNavigate } from "react-router-dom";
import Messages from "./Messages";
import ReactScrollToBottom from "react-scroll-to-bottom";
import { FaArrowUp } from "react-icons/fa6";
import { CgAttachment } from "react-icons/cg";
import moment from "moment";
import { RiPhoneFill } from "react-icons/ri";
import logo from "../assets/rabbit.jpg";
import axios from "axios";
import Loader from "./Loader";
import { RxCross2 } from "react-icons/rx";

const Socket = () => {
  const { allMessages, setAllMessages } = useContext(MainContext);
  const [message, setMessage] = useState("");
  const [storedSocketId, setStoredSocketId] = useState("");
  const user = localStorage.getItem("user");
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const userId = parseInt(localStorage.getItem("id"));
  const [status, setStatus] = useState([]);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [typing, setTyping] = useState(false);
  const [typingUser, setTypingUser] = useState("");
  const [fileData, setFileData] = useState([]);
  const [displayImage, setDisplayImage] = useState(null);

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
      const response = await fetch("http://localhost:8001/api/v1/get/messages");
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
      const response = await fetch("http://localhost:8001/api/v1/get/status");
      const status = await response.json();
      setStatus(status);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }, []);

  const fetchAllFiles = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:8001/api/v1/get/files");
      const file = await response.json();
      setFileData(file);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
    fetchAllUsers();
    fetchAllUsersStatus();
    fetchAllFiles();
  }, [fetchAllFiles, fetchAllUsers, fetchAllUsersStatus, fetchMessages]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDisplayImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
    setFile(file);
    setPreview(URL.createObjectURL(file));
  };

  // const handleMessage = () => {
  //   const senderSocketId = localStorage.getItem("socketId");
  //   const sender = users.find((item) => item.full_name === user);
  //   const senderId = sender?.id;

  //   const receiverId = activeUser?.id;
  //   const receiverSocketId = activeUser?.socket_id;
  //   const newMessage = {
  //     senderSocketId,
  //     senderId: senderId[0]?.id,
  //     receiverSocketId,
  //     receiverId,
  //     message,
  //   };

  //   let newFileData = null;

  //   if (file) {
  //     const formData = new FormData();
  //     formData.append("file", file);
  //     formData.append("receiverId", receiverId);
  //     formData.append("senderId", senderId[0]?.id);

  //     axios
  //       .post("http://localhost:8001/api/v1/upload", formData)
  //       .then((response) => {
  //         const filePath = response.data.filePath;

  //         newFileData = {
  //           receiverId,
  //           senderId: senderId[0]?.id,
  //           filePath,
  //           preview,
  //         };

  //         socket.emit("file-upload", newFileData);
  //         fetchMessages();
  //         setFile(null);
  //         setPreview(null);
  //       })
  //       .catch((error) => {
  //         console.error("Error uploading file:", error);
  //       });
  //   } else {
  //     socket.emit("message", newMessage);
  //     fetchMessages();
  //     setMessage("");
  //   }

  //   // socket.emit("message", newMessage);
  //   // socket.emit("file-upload", newFileData);
  //   // fetchMessages();
  //   // setMessage("");
  // };

  const handleMessage = async () => {
    const senderSocketId = localStorage.getItem("socketId");
    const sender = users.find((item) => item.full_name === user);
    const senderId = sender?.id;

    const receiverId = activeUser?.id;
    const receiverSocketId = activeUser?.socket_id;

    const newMessage = {
      senderSocketId,
      senderId,
      receiverSocketId,
      receiverId,
      message,
    };

    let newFileData = null;

    const uploadFile = async (file, senderId, receiverId) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("receiverId", receiverId);
      formData.append("senderId", senderId);

      try {
        const response = await axios.post(
          "http://localhost:8001/api/v1/upload",
          formData
        );
        const filePath = response.data.filePath;

        return {
          receiverId,
          senderId,
          filePath,
          preview,
        };
      } catch (error) {
        console.error("Error uploading file:", error);
        throw error;
      }
    };

    if (file && !message) {
      try {
        newFileData = await uploadFile(file, senderId, receiverId);
        socket.emit("file-upload", newFileData);
        setFile(null);
        setPreview(null);
      } catch (error) {
        return;
      }
    }

    if (message && !file) {
      socket.emit("message", newMessage);
      setMessage("");
    }

    if (file && message) {
      try {
        newFileData = await uploadFile(file, senderId, receiverId);
        socket.emit("file-upload", newFileData);
        setFile(null);
        setPreview(null);
      } catch (error) {
        return;
      }
      socket.emit("message", newMessage);
      setMessage("");
    }

    fetchMessages();
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

  useEffect(() => {
    socket.on("typing", (data) => {
      console.log(data);
      if (data.receiver === userId) {
        setTypingUser(data.user);
        setTyping(true);
        setTimeout(() => setTyping(false), 3000);
        console.log(data);
      }
    });

    return () => {
      socket.off("typing");
    };
  }, [activeUser?.id, socket, userId]);

  if (!user) {
    return <Loader />;
  }

  const handleUserData = (userData) => {
    setActiveUser(userData);
  };

  const groupMessagesByDate = (messages) => {
    return messages.reduce((groupedMessages, message) => {
      const date = new Date(message.created_at);
      const today = moment().startOf("day");
      const messageDate = moment(date).startOf("day");
      let dateKey;

      if (messageDate.isSame(today, "day")) {
        dateKey = "Today";
      } else if (messageDate.isSame(today.clone().subtract(1, "day"), "day")) {
        dateKey = "Yesterday";
      } else if (messageDate.isSame(today, "week")) {
        dateKey = messageDate.format("dddd");
      } else {
        dateKey = messageDate.format("DD MMMM YYYY");
      }

      if (!groupedMessages[dateKey]) {
        groupedMessages[dateKey] = [];
      }
      groupedMessages[dateKey].push(message);

      return groupedMessages;
    }, {});
  };
  const groupFileMessagesByDate = (messages) => {
    return messages.reduce((groupedMessages, message) => {
      const date = new Date(message.created_at);
      const today = moment().startOf("day");
      const messageDate = moment(date).startOf("day");
      let dateKey;

      if (messageDate.isSame(today, "day")) {
        dateKey = "Today";
      } else if (messageDate.isSame(today.clone().subtract(1, "day"), "day")) {
        dateKey = "Yesterday";
      } else if (messageDate.isSame(today, "week")) {
        dateKey = messageDate.format("dddd");
      } else {
        dateKey = messageDate.format("DD MMMM YYYY");
      }

      if (!groupedMessages[dateKey]) {
        groupedMessages[dateKey] = [];
      }
      groupedMessages[dateKey].push(message);

      return groupedMessages;
    }, {});
  };

  const groupedMessages = groupMessagesByDate(
    allMessages.filter(
      (item) =>
        (item.receiver_id === userId && item.sender_id === activeUser?.id) ||
        (item.sender_id === userId && item.receiver_id === activeUser?.id)
    )
  );
  const groupedFileMessages = groupFileMessagesByDate(
    fileData.filter(
      (item) =>
        (item.receiverid === userId && item.senderid === activeUser?.id) ||
        (item.senderid === userId && item.receiverid === activeUser?.id)
    )
  );

  const mergedGroupedMessages = {};

  // Function to merge grouped messages by date
  const mergeGroupedMessages = (source) => {
    Object.entries(source).forEach(([date, messages]) => {
      if (!mergedGroupedMessages[date]) {
        mergedGroupedMessages[date] = [];
      }
      mergedGroupedMessages[date] =
        mergedGroupedMessages[date].concat(messages);
    });
  };

  // Merge both grouped messages and file messages
  mergeGroupedMessages(groupedMessages);
  mergeGroupedMessages(groupedFileMessages);

  console.log("mergedGroupedMessages", mergedGroupedMessages);

  // Create a single array with dates and messages
  const messagesWithDates = [];

  Object.entries(mergedGroupedMessages).forEach(([date, messages]) => {
    messagesWithDates.push({ type: "date", date });
    messages.forEach((message) => {
      messagesWithDates.push({ type: "message", ...message });
    });
  });

  console.log("messagesWithDates", messagesWithDates);

  const handleTyping = () => {
    const senderId = users.filter((item) =>
      item.full_name === user ? item : null
    );

    const receiverId = activeUser?.id;
    socket.emit("typing", { sender: senderId, receiver: receiverId });
  };

  return (
    <main className="main__container">
      <main className="chat__container">
        {activeUser ? (
          <section className="chat__input__container">
            <section className="chat__section2">
              {activeUser && (
                <span>
                  {activeUser?.full_name}
                  {typing && activeUser?.id === typingUser[0]?.id ? (
                    <p
                      style={{
                        color: "white",
                        fontSize: "10px",
                        fontWeight: "100",
                      }}
                    >
                      typing....
                    </p>
                  ) : status.some(
                      (stat) =>
                        stat.user_id === activeUser?.id &&
                        stat.is_active === true
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
              {activeUser && (
                <span className="phone">
                  <RiPhoneFill />
                </span>
              )}
            </section>
            {!file ? (
              <ReactScrollToBottom className="chat__messages">
                {messagesWithDates.map((item, ind) =>
                  item.type === "date" ? (
                    <Messages
                      key={ind}
                      user={"date"}
                      message={item.date}
                      classs={"message-date"}
                    />
                  ) : (
                    <Messages
                      key={ind}
                      user={
                        item.sender_id === userId ? "" : activeUser?.full_name
                      }
                      message={item.message}
                      time_date={item.created_at}
                      classs={item.sender_id === userId ? "right" : "left"}
                    />
                  )
                )}
              </ReactScrollToBottom>
            ) : (
              <section className="file__modal__container">
                <i>
                  <RxCross2 onClick={() => setFile(null)} />
                </i>
                <div className="file__name__img">
                  <span>{file.name}</span>
                  <img
                    src={displayImage}
                    alt="Selected"
                    style={{ width: "500px", height: "auto" }}
                  />
                </div>
              </section>
            )}
            {activeUser && (
              <section className="chat__input__section3">
                <label htmlFor="attachment" className="attachment">
                  <CgAttachment />
                </label>
                <input
                  type="file"
                  id="attachment"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />

                <textarea
                  type="text"
                  placeholder="message"
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value), handleTyping();
                  }}
                />

                <button onClick={handleMessage}>
                  <FaArrowUp style={{ fontSize: "1rem" }} />
                </button>
              </section>
            )}
          </section>
        ) : (
          <section
            className="chat__input__container"
            style={{
              backgroundColor: "#222e35",
              height: "100vh",
              color: "white",
            }}
          >
            Welcome to chat Appi
            <img src={`http://localhost:8001${fileData[0]?.file}`} alt="img" />
          </section>
        )}

        <section className="users__containers">
          <section className="chat__heading__main">
            {user && <span>Profile : {user} </span>}
            <button className="log__out" onClick={handleLogout}>
              Log out
            </button>
          </section>
          <section className="users__container">
            {users.map((userVal, ind) => (
              <div key={ind} className="users__data">
                <img src={logo} alt="demo_person" className="image__user" />
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
        </section>
      </main>
    </main>
  );
};

export default Socket;
