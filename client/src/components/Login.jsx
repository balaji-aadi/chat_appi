import "../App.css";
import "../context/MainContext";
import { useFormik } from "formik";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const initialValues = {
    email: "",
    password: "",
  };

  const { values, handleSubmit, handleChange } = useFormik({
    initialValues,
    //   validationSchema: signUpSchema,
    onSubmit: async (values, action) => {
      const { email, password } = values;
      try {
        const loginRes = await axios.post(
          "http://127.0.0.1:8000/api/user/login",
          {
            email,
            password,
          },
          { withCredentials: true }
        );

        localStorage.setItem("socketId", loginRes.data?.socket_id);
        localStorage.setItem("email", loginRes.data?.email);
        localStorage.setItem("user", loginRes.data?.user);
        localStorage.setItem("id", loginRes.data?.id);
        toast.success("Login Successful");
      } catch (err) {
        console.log(err);
      } finally {
        navigate("/");
      }
      action.resetForm();
    },
  });

  return (
    <div className="login__container">
      <h1>Login</h1>
      <form className="login__input__container" onSubmit={handleSubmit}>
        <input
          type="email"
          className="login__input"
          name="email"
          value={values.email}
          placeholder="Enter your email"
          onChange={handleChange}
          required
        />
        <input
          type="password"
          className="login__input"
          name="password"
          value={values.password}
          placeholder="Enter your Password"
          onChange={handleChange}
          required
        />
        {/* <select
          className="login__input"
          value={userRole}
          placeholder="Enter your Role"
          onChange={(e) => setUserRole(e.target.value)}
        >
          <option value="Customer">Customer</option>
          <option value="Store">Store</option>
          <option value="Delivery Man">Delivery Man</option>
        </select> */}

        <button className="login__btn" type="submit">
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;
