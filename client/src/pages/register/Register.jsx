import { useState } from "react"
import "./register.css"
import { Link } from "react-router-dom"
import axios from "axios"
import FarmImageUpload from "../../components/farmImageUpload/FarmImageUpload"
import { 
  validateEmail, 
  validatePhone, 
  validatePassword, 
  getPasswordStrength,
  getPasswordStrengthLabel,
  formatPhoneNumber 
} from "../../utils/validation"


export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [role, setRole] = useState("user");
  const [description, setDescription] = useState("");
  const [farmImages, setFarmImages] = useState([]);
  
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [success, setSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate field on blur
  const validateField = (fieldName, value) => {
    const newErrors = { ...errors };

    switch (fieldName) {
      case "name":
        if (!value || value.trim() === "") {
          newErrors.name = "Name is required";
        } else {
          delete newErrors.name;
        }
        break;
      case "email":
        if (!value) {
          newErrors.email = "Email is required";
        } else if (!validateEmail(value)) {
          newErrors.email = "Please enter a valid email address";
        } else {
          delete newErrors.email;
        }
        break;
      case "phone":
        const phoneValidation = validatePhone(value);
        if (!phoneValidation.isValid) {
          newErrors.phone = phoneValidation.error;
        } else {
          delete newErrors.phone;
        }
        break;
      case "password":
        const passwordValidation = validatePassword(value);
        if (!passwordValidation.isValid && value) {
          newErrors.password = passwordValidation.errors;
        } else {
          delete newErrors.password;
        }
        break;
      case "confirmPassword":
        if (!value) {
          newErrors.confirmPassword = "Please confirm your password";
        } else if (value !== password) {
          newErrors.confirmPassword = "Passwords do not match";
        } else {
          delete newErrors.confirmPassword;
        }
        break;
      case "description":
        if (role === "expert" && (!value || value.trim() === "")) {
          newErrors.description = "Please provide a description about your expertise";
        } else {
          delete newErrors.description;
        }
        break;
      case "farmImages":
        if (role === "expert" && (!value || value.length < 3)) {
          newErrors.farmImages = "Minimum 3 farm images required for expert verification";
        } else {
          delete newErrors.farmImages;
        }
        break;
      default:
        break;
    }

    setErrors(newErrors);
  };

  const handleBlur = (fieldName) => {
    setTouched({ ...touched, [fieldName]: true });
    if (fieldName === "name") validateField("name", name);
    if (fieldName === "email") validateField("email", email);
    if (fieldName === "phone") validateField("phone", phone);
    if (fieldName === "password") validateField("password", password);
    if (fieldName === "confirmPassword") validateField("confirmPassword", confirmPassword);
    if (fieldName === "description") validateField("description", description);
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    setPhone(value);
    if (touched.phone) validateField("phone", value);
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    if (touched.password) validateField("password", value);
    // Also revalidate confirm password if it has been touched
    if (touched.confirmPassword && confirmPassword) {
      validateField("confirmPassword", confirmPassword);
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);
    if (touched.confirmPassword) validateField("confirmPassword", value);
  };

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    if (newRole === "expert") {
      validateField("description", description);
    } else {
      delete errors.description;
      delete errors.farmImages;
      setFarmImages([]);
      setErrors(errors);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting) return;
    
    setErrors({});
    setIsSubmitting(true);

    // Validate all fields
    const newErrors = {};

    if (!name || name.trim() === "") {
      newErrors.name = "Name is required";
    }

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.isValid) {
      newErrors.phone = phoneValidation.error;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.errors;
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (role === "expert") {
      if (!description.trim()) {
        newErrors.description = "Please provide a description about your expertise";
      }
      if (!farmImages || farmImages.length < 3) {
        newErrors.farmImages = "Minimum 3 farm images required for expert verification";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await axios.post("/auth/register", {
        name,
        email,
        phone,
        password,
        confirmPassword,
        role,
        ...(role === "expert" ? { description, farmImages } : {}),
      });
      
      if (res.data && res.data.pendingApproval) {
        setSuccess("Your expert account has been created! Please wait for admin approval of your farm images before you can log in.");
        // Clear form
        setName("");
        setEmail("");
        setPhone("");
        setPassword("");
        setConfirmPassword("");
        setDescription("");
        setFarmImages([]);
      } else {
        res.data && window.location.replace("/login");
      }
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.errors) {
        setErrors(errorData.errors);
      } else {
        const errorMsg = typeof errorData === "string" 
          ? errorData 
          : "Something went wrong during registration!";
        setErrors({ general: errorMsg });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordStrength = getPasswordStrength(password);
  const passwordStrengthLabel = getPasswordStrengthLabel(passwordStrength);

  return (
    <div className="register fadeIn">
      <div className="registerCard">
        <div className="registerBranding">
          <i className="fas fa-leaf"></i>
          <h2>Agro<span>Link</span></h2>
          <p>Join our organic community</p>
        </div>
        <form className="registerForm" onSubmit={handleSubmit}>
          <label>Account Type</label>
          <div className="registerRoleSelector">
            <button
              type="button"
              className={`registerRoleBtn${role === "user" ? " active" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleRoleChange("user");
              }}
            >
              <i className="fas fa-user"></i>
              <span>Normal User</span>
            </button>
            <button
              type="button"
              className={`registerRoleBtn${role === "expert" ? " active" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleRoleChange("expert");
              }}
            >
              <i className="fas fa-user-tie"></i>
              <span>Expert</span>
            </button>
          </div>
          {role === "expert" && (
            <>
              <label>About You</label>
              <textarea
                className={`registerInput registerTextarea ${errors.description ? "error" : ""}`}
                placeholder="Describe your expertise, qualifications, and experience..."
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => handleBlur("description")}
              />
              {errors.description && (
                <span className="registerFieldError">
                  <i className="fas fa-exclamation-circle"></i>
                  {errors.description}
                </span>
              )}

              <FarmImageUpload
                images={farmImages}
                onChange={setFarmImages}
                error={errors.farmImages}
                minImages={3}
                maxImages={10}
                disabled={isSubmitting}
              />

              <div className="registerExpertNote">
                <i className="fas fa-info-circle"></i>
                <span>Expert accounts require admin approval of your farm images before you can log in.</span>
              </div>
            </>
          )}
          
          <label>Full Name *</label>
          <input
            className={`registerInput ${errors.name ? "error" : ""}`}
            type="text"
            placeholder="Enter your full name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => handleBlur("name")}
          />
          {errors.name && (
            <span className="registerFieldError">
              <i className="fas fa-exclamation-circle"></i>
              {errors.name}
            </span>
          )}

          <label>Email *</label>
          <input
            className={`registerInput ${errors.email ? "error" : ""}`}
            type="email"
            placeholder="Enter your email..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => handleBlur("email")}
          />
          {errors.email && (
            <span className="registerFieldError">
              <i className="fas fa-exclamation-circle"></i>
              {errors.email}
            </span>
          )}

          <label>Phone Number *</label>
          <input
            className={`registerInput ${errors.phone ? "error" : ""}`}
            type="tel"
            placeholder="Enter your 10-digit phone number..."
            value={phone}
            onChange={handlePhoneChange}
            onBlur={() => handleBlur("phone")}
          />
          {errors.phone && (
            <span className="registerFieldError">
              <i className="fas fa-exclamation-circle"></i>
              {errors.phone}
            </span>
          )}

          <label>Password *</label>
          <div className="registerInputWrapper">
            <input
              className={`registerInput ${errors.password ? "error" : ""}`}
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password..."
              value={password}
              onChange={handlePasswordChange}
              onBlur={() => handleBlur("password")}
            />
            <i
              className={`registerEyeIcon fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowPassword(!showPassword);
              }}
            />
          </div>
          
          {/* Password Requirements Display */}
          {password && (
            <div className="registerPasswordRequirements">
              <div className="registerStrengthBar">
                <div
                  className={`registerStrengthFill strength-${passwordStrength}`}
                  style={{ width: `${(passwordStrength / 5) * 100}%` }}
                ></div>
              </div>
              <span className={`registerStrengthLabel strength-${passwordStrength}`}>
                Strength: {passwordStrengthLabel}
              </span>
              <ul className="registerRequirementsList">
                <li className={password.length >= 8 ? "met" : ""}>
                  <i className={`fas ${password.length >= 8 ? "fa-check" : "fa-times"}`}></i>
                  At least 8 characters
                </li>
                <li className={/[A-Z]/.test(password) ? "met" : ""}>
                  <i className={`fas ${/[A-Z]/.test(password) ? "fa-check" : "fa-times"}`}></i>
                  One uppercase letter (A-Z)
                </li>
                <li className={/[a-z]/.test(password) ? "met" : ""}>
                  <i className={`fas ${/[a-z]/.test(password) ? "fa-check" : "fa-times"}`}></i>
                  One lowercase letter (a-z)
                </li>
                <li className={/[0-9]/.test(password) ? "met" : ""}>
                  <i className={`fas ${/[0-9]/.test(password) ? "fa-check" : "fa-times"}`}></i>
                  One number (0-9)
                </li>
                <li className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? "met" : ""}>
                  <i className={`fas ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? "fa-check" : "fa-times"}`}></i>
                  One special character (!@#$%^&*...)
                </li>
              </ul>
            </div>
          )}
          
          {errors.password && typeof errors.password === "object" && (
            <div className="registerFieldError">
              <i className="fas fa-exclamation-circle"></i>
              {errors.password.join(", ")}
            </div>
          )}

          <label>Confirm Password *</label>
          <div className="registerInputWrapper">
            <input
              className={`registerInput ${errors.confirmPassword ? "error" : ""}`}
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm your password..."
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              onBlur={() => handleBlur("confirmPassword")}
            />
            <i
              className={`registerEyeIcon fas ${showConfirm ? "fa-eye-slash" : "fa-eye"}`}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowConfirm(!showConfirm);
              }}
            />
          </div>
          {errors.confirmPassword && (
            <span className="registerFieldError">
              <i className="fas fa-exclamation-circle"></i>
              {errors.confirmPassword}
            </span>
          )}

          <button className="registerButton" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating Account..." : role === "expert" ? "Submit for Approval" : "Create Account"}
          </button>

          {success && (
            <div className="alert alert-success">
              <i className="fas fa-check-circle"></i>
              <span>{success}</span>
            </div>
          )}

          {errors.general && (
            <div className="alert alert-error">
              <i className="fas fa-exclamation-circle"></i>
              <span>{String(errors.general)}</span>
            </div>
          )}
        </form>
      </div>
      <Link className="registerLoginButton" to="/login" style={{ textDecoration: 'none' }}>
        Sign In
      </Link>
    </div>
  );
}
