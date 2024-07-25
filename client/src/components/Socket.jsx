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
import { ImageDisplay } from "./ImageDisplay";
import { FaPlus } from "react-icons/fa";

const Socket = () => {
  const { allMessages, setAllMessages } = useContext(MainContext);
  const [message, setMessage] = useState("");
  const [storedSocketId, setStoredSocketId] = useState("");
  const user = localStorage.getItem("user");
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const userId = parseInt(localStorage.getItem("id"));
  const [status, setStatus] = useState([]);
  const [file, setFiles] = useState([]);
  const [preview, setPreview] = useState([]);
  const [typing, setTyping] = useState(false);
  const [typingUser, setTypingUser] = useState("");
  const [fileData, setFileData] = useState([]);
  const [displayImage, setDisplayImage] = useState(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState();

  const socket = useMemo(() => {
    setStoredSocketId(localStorage.getItem("socketId"));
    const options = storedSocketId
      ? { query: { socketId: storedSocketId } }
      : {};
    return io("http://localhost:8001", options);
  }, [storedSocketId]);

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
    fetchAllUsers();
    fetchAllUsersStatus();
    fetchAllFiles();
  }, [fetchAllFiles, fetchAllUsers, fetchAllUsersStatus]);

  const handleFileChange = (e) => {
    const selectedImages = Array.from(e.target.files);
    setFiles((prevImages) => [...prevImages, ...selectedImages]);

    const readFiles = selectedImages.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result);
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readFiles).then((newPreviews) => {
      setPreview((prevPreviews) => [...prevPreviews, ...newPreviews]);
      setIsImageModalOpen(true);
    });

    e.target.value = null;
  };

  // Function to upload file
  const uploadFiles = async (files, senderId, receiverId) => {
    setIsImageModalOpen(false);
    const formData = new FormData();

    Array.from(files).forEach((file) => {
      formData.append("files", file);
    });
    formData.append("receiverId", receiverId);
    formData.append("senderId", senderId);

    try {
      const response = await axios.post(
        "http://localhost:8001/api/v1/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const progress = (progressEvent.loaded / progressEvent.total) * 100;
            console.log("file uploading progress is : ", progress);
            setProgress(progress);
          },
        }
      );
      const filePaths = response.data.filePaths;

      Array.from(files).map((file) => ({
        preview: URL.createObjectURL(file),
      }));

      const preview = filePaths.map((item) => ({
        receiverId,
        senderId,
        filePath: item,
      }));

      return preview;
    } catch (error) {
      console.error("Error uploading files:", error);
      throw error;
    }
  };

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

    try {
      if (file?.length > 0 && !message) {
        setIsLoading(true);
        try {
          const newFileData = await uploadFiles(file, senderId, receiverId);
          newFileData.forEach((fileData) => {
            socket.emit("file-upload", fileData);
          });
        } catch (err) {
          console.log(err);
        } finally {
          setIsLoading(false);
          setFiles([]);
          setPreview([]);
        }
      }

      if (message && file?.length <= 0) {
        socket.emit("message", newMessage);
        setMessage("");
      }

      if (file?.length > 0 && message) {
        setIsLoading(true);
        socket.emit("message", newMessage);
        setMessage("");
        try {
          const newFileData = await uploadFiles(file, senderId, receiverId);

          newFileData.forEach((fileData) => {
            socket.emit("file-upload", fileData);
          });
        } catch (err) {
          console.log(err);
        } finally {
          setFiles([]);
          setPreview([]);
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error("Error handling message:", error);
    }
  };

  const navigate = useNavigate();
  console.log(file);

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
    if (file?.length < 1) {
      setIsImageModalOpen(false);
    }
  }, [file]);

  useEffect(() => {
    socket.on("receive-message", () => {
      socket.on("get-all-messages", (msg) => {
        // console.log("message of all are : ", msg);
        setAllMessages(msg);
      });
    });
  }, [setAllMessages, socket]);

  useEffect(() => {
    if (!storedSocketId) {
      socket.on("connect", () => {
        console.log(`${user} is connected with ${socket.id}`);
        localStorage.setItem("socketId", socket.id);
      });
    }

    socket.emit("joined", { user, storedSocketId, userId });
    socket.on("get-all-messages", (msg) => {
      setAllMessages(msg);
    });

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
  }, [setAllMessages, socket, storedSocketId, user, userId]);

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
      if (data.receiver === userId) {
        setTypingUser(data.user);
        setTyping(true);
        setTimeout(() => setTyping(false), 3000);
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

  const groupedMessages = groupMessagesByDate(
    allMessages.filter(
      (item) =>
        (item.receiver_id === userId && item.sender_id === activeUser?.id) ||
        (item.sender_id === userId && item.receiver_id === activeUser?.id)
    )
  );

  const messagesWithDates = [];

  Object.entries(groupedMessages).forEach(([date, messages]) => {
    messagesWithDates.push({ type: "date", date });
    messages.forEach((message) => {
      messagesWithDates.push({ type: "message", ...message });
    });
  });

  const handleTyping = () => {
    const senderId = users.filter((item) =>
      item.full_name === user ? item : null
    );

    const receiverId = activeUser?.id;
    socket.emit("typing", { sender: senderId, receiver: receiverId });
  };

  console.log(preview);
  console.log(messagesWithDates);

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
            {!isImageModalOpen ? (
              <ReactScrollToBottom className="chat__messages">
                {messagesWithDates.map((item, ind) =>
                  item.type === "date" ? (
                    <Messages
                      key={ind}
                      user={"date"}
                      message={item.date}
                      classs={"message-date"}
                    />
                  ) : item.file ? (
                    <Messages
                      key={ind}
                      
                      message={item.file}
                      time_date={item.created_at}
                      classs={item.sender_id === userId ? "right" : "left"}
                      file = {true}
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

                {isLoading && progress ? 
                preview.map((src, index) => (
                      <img
                        key={index}
                        src={src}
                        alt={`Preview ${index}`}
                        loading="lazy"
                        style={{
                          backgroundImage: isLoading
                            ? "url(https://ucarecdn.com/faff2888-016b-4c54-9870-25f9a21129f5/-/preview/1600x900/-/blur/500/)"
                            : src,
                            filter: isLoading ? `blur(${(1 - progress / 100) * 10}px)` : 'none',
                        }}
                        className={`preview__image ${isLoading ? 'loading' : ''}`}
                      />
                    ))
                  : null}
                  
              </ReactScrollToBottom>
            ) : (
              <section className="file__modal__container">
                <i onClick={() => setIsImageModalOpen(false)}>
                  <RxCross2 />
                </i>
                <div className="file__name__img">
                  <span>{file?.name}</span>

                  <div className="image__display">
                    {file.map((image, index) => (
                      <div key={index} className="images__storing__container">
                        <ImageDisplay
                          image={image}
                          setFiles={setFiles}
                          index={index}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <section className="multiple__images__add__remove">
                  <label htmlFor="attachment" className="multiple__images__add">
                    <FaPlus />
                  </label>
                </section>
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
                  name="image"
                  multiple
                  onChange={(e) => handleFileChange(e)}
                  style={{ display: "none" }}
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
