import { createContext, useState } from "react";

export const MainContext = createContext();

// eslint-disable-next-line react/prop-types
export const MainContextProvider = ({ children }) => {
  const [allMessages, setAllMessages] = useState([]);

  return (
    <MainContext.Provider value={{ allMessages, setAllMessages }}>
      {children}
    </MainContext.Provider>
  );
};
