import "./header.css"
import { Link } from "react-router-dom"

export default function Header() {
  return (
    <div className='header'>
      <img
        className="headerImg"
        src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=3432&auto=format&fit=crop"
        alt="AgroLink Banner"
      />
      <div className="headerOverlay"></div>
      <div className="headerContent">
        <div className="headerBadge">
          <i className="fas fa-leaf"></i>
          <span>AgroLink Community</span>
        </div>
        <h1 className="headerTitle">
          Where Farmers &amp;<br />
          <span>Knowledge Grow</span>
        </h1>
        <p className="headerSubtitle">
          Discover insights, share experiences, and connect with a thriving community of agricultural enthusiasts.
        </p>
        <div className="headerActions">
          <Link className="headerBtn headerBtnPrimary" to="/write">
            <i className="fas fa-pen"></i>
            Start Writing
          </Link>
          <a className="headerBtn headerBtnSecondary" href="#posts">
            <i className="fas fa-compass"></i>
            Explore Posts
          </a>
        </div>
        <div className="headerStats">
          <div className="headerStat">
            <span className="headerStatNum">500+</span>
            <span className="headerStatLabel">Articles</span>
          </div>
          <div className="headerStatDivider"></div>
          <div className="headerStat">
            <span className="headerStatNum">1.2k</span>
            <span className="headerStatLabel">Farmers</span>
          </div>
          <div className="headerStatDivider"></div>
          <div className="headerStat">
            <span className="headerStatNum">50+</span>
            <span className="headerStatLabel">Topics</span>
          </div>
        </div>
      </div>
    </div>
  )
}
