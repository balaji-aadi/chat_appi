import "../App.css";
import moment from "moment";

// eslint-disable-next-line react/prop-types
const Messages = ({ user, time_date, message, classs,file }) => {
  console.log(message)
  if (user && user !== "date") {
    return (
      <main className={`messageBox ${classs}`}>
        {/* <span
          style={{ color: " #06cf9c", fontWeight: "600" }}
        >{`${user}`}</span> */}
        <span>{`${message}`}</span>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            fontSize: "10px",
          }}
        >
          {" "}
          {`${moment(time_date).format("LT")}`}
        </span>
      </main>
    );
  } else if (user === "date") {
    return <main className={`messageBox ${classs}`}>{message}</main>;
  } else if (file) {
    return <main className={`messageBox ${classs}`}>
      <img src={message} alt="img" className="message__image"/>
      <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            fontSize: "10px",
            paddingLeft: "2rem",
          }}
        >
          {`${moment(time_date).format("LT")}`}
        </span>
        
    </main>
  }else {
    return (
      <main className={`messageBox ${classs}`}>
        <span>{`${message}`}</span>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            fontSize: "10px",
            paddingLeft: "2rem",
          }}
        >
          {`${moment(time_date).format("LT")}`}
        </span>
      </main>
    );
  }
};

export default Messages;
