import "./verificationModal.css";
import { useContext, useState } from "react";
import { Context } from "../../context/Context";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function VerificationModal({ setShowModal }) {
  const { user, dispatch } = useContext(Context);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const handleVerify = async (e) => {
    e.preventDefault();
    setError(false);
    try {
      await axios.post("/auth/verify", {
        email: user.email,
        password: password,
      });
      dispatch({ type: "VERIFY_SUCCESS" });
      setShowModal(false);
      navigate("/settings");
    } catch (err) {
      setError(true);
    }
  };

  return (
    <div className="vModalContainer">
      <div className="vModalBackdrop" onClick={() => setShowModal(false)}></div>
      <div className="vModalWrapper fadeIn">
        <div className="vModalHeader">
          <div className="vModalIcon">
            <i className="fas fa-shield-alt"></i>
          </div>
          <h1 className="vModalTitle">Identity Verification</h1>
          <p className="vModalDesc">
            Please enter your password to access your secure account settings.
          </p>
        </div>
        <form className="vModalForm" onSubmit={handleVerify}>
          <label>Email</label>
          <input
            type="text"
            value={user.email}
            readOnly
            className="vModalInputDisabled"
          />
          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password..."
            autoFocus
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="vModalButton" type="submit">
            Verify & Continue
          </button>
          {error && (
            <div className="alert alert-error">
              <i className="fas fa-shield-alt"></i>
              <span>Access Denied: Wrong credentials!</span>
            </div>
          )}
        </form>
        <button className="vModalClose" onClick={() => setShowModal(false)}>
          <i className="fas fa-times"></i>
        </button>
      </div>
    </div>
  );
}
