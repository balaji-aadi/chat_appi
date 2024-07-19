import "../App.css";
import moment from "moment";

// eslint-disable-next-line react/prop-types
const Messages = ({ user, time_date, message, classs }) => {
  if (user) {
    return (
      <main className={`messageBox ${classs}`}>
        <span
          style={{ color: " #06cf9c", fontWeight: "600" }}
        >{`${user}`}</span>
        <span>{`${message}`}</span>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            fontSize: "15px",
          }}
        >
          {" "}
          {`${moment(time_date).format("LT")}`}
        </span>
      </main>
    );
  } else {
    return <main className={`messageBox ${classs}`}>{`${message}`}</main>;
  }
};

export default Messages;
