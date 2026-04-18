import "./logo.css";
import { Link } from "react-router-dom";

export default function Logo() {
  return (
    <Link to="/" className="logoLink link">
      <div className="logoContainer">
        <div className="logoIconWrapper">
          <i className="fas fa-leaf logoIcon"></i>
          <div className="logoPulse"></div>
        </div>
        <div className="logoText">
          <span className="logoAgro">Agro</span>
          <span className="logoLinkPart">Link</span>
        </div>
      </div>
    </Link>
  );
}
