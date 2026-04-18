import { Link } from "react-router-dom";
import "./login.css";
import { useRef, useContext, useState, useEffect } from "react";
import { Context } from "../../context/Context";
import axios from "axios";
import { validateEmail } from "../../utils/validation";

export default function Login() {
  const emailRef = useRef();
  const passwordRef = useRef();
  const { dispatch, isFetching } = useContext(Context);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [deactivatedMsg, setDeactivatedMsg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Show deactivation message if redirected from a forced logout
  useEffect(() => {
    const msg = sessionStorage.getItem("deactivatedMessage");
    if (msg) {
      setDeactivatedMsg(msg);
      sessionStorage.removeItem("deactivatedMessage");
    }
  }, []);

  const validateField = (fieldName, value) => {
    const newErrors = { ...errors };

    switch (fieldName) {
      case "email":
        if (!value) {
          newErrors.email = "Email is required";
        } else if (!validateEmail(value)) {
          newErrors.email = "Please enter a valid email address";
        } else {
          delete newErrors.email;
        }
        break;
      case "password":
        if (!value) {
          newErrors.password = "Password is required";
        } else {
          delete newErrors.password;
        }
        break;
      default:
        break;
    }

    setErrors(newErrors);
  };

  const handleBlur = (fieldName) => {
    setTouched({ ...touched, [fieldName]: true });
    if (fieldName === "email") validateField("email", emailRef.current.value);
    if (fieldName === "password") validateField("password", passwordRef.current.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting) return;
    
    setErrors({});
    setIsSubmitting(true);

    const email = emailRef.current.value;
    const password = passwordRef.current.value;

    const newErrors = {};

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      setIsSubmitting(false);
      newErrors.password = "Password is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    dispatch({ type: "LOGIN_START" });
    try {
      const res = await axios.post("/auth/login", {
        email,
        password,
      });
      dispatch({ type: "LOGIN_SUCCESS", payload: res.data });
      
      // Explicitly write to sessionStorage before forcing a page reload
      // to avoid a race condition with Context.js's useEffect
      sessionStorage.setItem("user", JSON.stringify(res.data));

      // Redirect based on role
      if (res.data.isAdmin || res.data.role === "admin") {
        window.location.replace("/admin");
      } else {
        window.location.replace("/");
      }
    } catch (err) {
      dispatch({ type: "LOGIN_FAILURE" });
      const errorData = err.response?.data;
      if (errorData?.errors) {
        setErrors(errorData.errors);
      } else {
        const errorMsg = typeof errorData === "string" 
          ? errorData 
          : "Something went wrong!";
        setErrors({ general: errorMsg });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login fadeIn">
      <div className="loginCard">
        <div className="loginBranding">
          <i className="fas fa-leaf"></i>
          <h2>Agro<span>Link</span></h2>
          <p>Welcome back to the community</p>
        </div>
        <form className="loginForm" onSubmit={handleSubmit}>
          {deactivatedMsg && (
            <div className="alert alert-warning" style={{ marginBottom: 16 }}>
              <i className="fas fa-ban"></i>
              <span>{deactivatedMsg}</span>
            </div>
          )}
          
          <label>Email</label>
          <input
            className={`loginInput ${errors.email ? "error" : ""}`}
            type="email"
            placeholder="Enter your email..."
            ref={emailRef}
            onBlur={() => handleBlur("email")}
          />
          {errors.email && (
            <span className="loginFieldError">
              <i className="fas fa-exclamation-circle"></i>
              {errors.email}
            </span>
          )}
          
          <label>Password</label>
          <input
            className={`loginInput ${errors.password ? "error" : ""}`}
            type="password"
            placeholder="Enter your password..."
            ref={passwordRef}
            onBlur={() => handleBlur("password")}
          />
          {errors.password && (
            <span className="loginFieldError">
              <i className="fas fa-exclamation-circle"></i>
              {errors.password}
            </span>
          )}
          
          <button className="loginButton" type="submit" disabled={isSubmitting || isFetching}>
            {isSubmitting || isFetching ? "Authenticating..." : "Sign In"}
          </button>
          
          {errors.general && (
            <div className="alert alert-error">
              <i className="fas fa-exclamation-circle"></i>
              <span>{String(errors.general)}</span>
            </div>
          )}
        </form>
      </div>
      <Link className="loginRegisterButton" to="/register" style={{ textDecoration: 'none' }}>
        Create Account
      </Link>
    </div>
  );
}
