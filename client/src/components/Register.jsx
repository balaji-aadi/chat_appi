import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./register.css";
import { useFormik } from "formik";
import axios from "axios";
import { toast } from "react-toastify";

const Register = () => {
  const initialValues = {
    full_name: "",
    email: "",
    password: "",
  };

  const navigate = useNavigate();
  const [passwordShow] = useState(false);

  const { values, errors, touched, handleSubmit, handleBlur, handleChange } =
    useFormik({
      initialValues,
      //   validationSchema: signUpSchema,
      onSubmit: async (values, action) => {
        const { full_name, email, password } = values;
        try {
          const registerRes = await axios.post(
            "http://127.0.0.1:8000/api/user/register",
            {
              full_name,
              email,
              password,
            },
            { withCredentials: true }
          );

          console.log(registerRes.status);

          if (registerRes.status === 201) {
            try {
              const res = await axios.post(
                "http://127.0.0.1:8001/generate-socket-id",
                { email },
                { withCredentials: true }
              );
              console.log(res.data);

              if (res.status === 201) {
                navigate("/");
              }
            } catch (err) {
              console.log(err);
            }
          }

          toast.success("Register Successful");
        } catch (err) {
          console.log(err);
        }
        action.resetForm();
      },
    });

  return (
    <div className="Register_container">
      <div className="register_container">
        <div className="auth_logo"></div>

        <div className="auth_heading">
          <h1>Sign Up</h1>
          <p>Welcome onboard! Lets create an account.</p>
        </div>

        <form className="register_inputContainer" onSubmit={handleSubmit}>
          <label htmlFor="">Name</label>
          <input
            type="name"
            placeholder="Enter Your name"
            name="full_name"
            value={values.full_name}
            onChange={handleChange}
            onBlur={handleBlur}
          />
          {errors.full_name && touched.full_name ? (
            <p className="form-error"> {errors.full_name} </p>
          ) : (
            ""
          )}
          <label htmlFor="">Email</label>
          <input
            type="email"
            placeholder="Enter Your Email"
            name="email"
            value={values.email}
            onChange={handleChange}
            onBlur={handleBlur}
          />
          {errors.email && touched.email ? (
            <p className="form-error"> {errors.email} </p>
          ) : (
            ""
          )}

          {/* This is the password section */}
          <div className="password_form">
            <label htmlFor="">Password</label>
            <input
              type={passwordShow ? "text" : "password"}
              placeholder="Enter Your Password"
              name="password"
              value={values.password}
              onChange={handleChange}
              onBlur={handleBlur}
            />
          </div>

          {errors.password && touched.password ? (
            <p className="form-error"> {errors.password} </p>
          ) : (
            ""
          )}

          {/* This is the confirm password section */}
          <div className="auth_btns">
            <button className="btn1" type="submit">
              Sign Up
            </button>
            {/* <div className="btn2">
            <img src="/Social_icon.png" alt="" />
            Sign in with Google
          </div> */}
          </div>
          <div className="auth_links">
            <p>Already have an account?</p>
            <Link to="/login">Sign in</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
