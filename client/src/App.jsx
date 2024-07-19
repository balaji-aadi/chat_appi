import "./App.css";
import Login from "./components/Login";
import {
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";
import Socket from "./components/Socket";
import Register from "./components/Register";

const App = () => {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <>
        <Route path="/" element={<Socket />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
      </>
    )
  );
  return (
    <div>
      <RouterProvider router={router} />
    </div>
  );
};

export default App;
