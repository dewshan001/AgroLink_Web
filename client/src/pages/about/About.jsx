import "./about.css";
import Sidebar from "../../components/sidebar/Sidebar";

export default function About() {
  return (
    <div className="about fadeIn">
      <div className="aboutWrapper">
        <div className="aboutContent">
          <div className="aboutHero">
            <i className="fas fa-leaf aboutHeroIcon"></i>
            <h1 className="aboutTitle">About AgroLink</h1>
            <p className="aboutSubtitle">
              Connecting farmers, experts, and communities through the power of knowledge.
            </p>
          </div>

          <div className="aboutSection">
            <div className="aboutCard">
              <i className="fas fa-seedling aboutCardIcon"></i>
              <h3>Our Mission</h3>
              <p>
                AgroLink is a platform dedicated to sharing agricultural knowledge, 
                empowering farmers with modern insights, and building a sustainable future 
                for communities around the world.
              </p>
            </div>
            <div className="aboutCard">
              <i className="fas fa-users aboutCardIcon"></i>
              <h3>Our Community</h3>
              <p>
                We bring together farmers, agronomists, researchers, and enthusiasts 
                to share experiences, innovations, and practical solutions for 
                everyday agricultural challenges.
              </p>
            </div>
            <div className="aboutCard">
              <i className="fas fa-globe aboutCardIcon"></i>
              <h3>Our Vision</h3>
              <p>
                A world where every farmer has access to the best knowledge and tools 
                to cultivate thriving crops while preserving our planet's precious ecosystems.
              </p>
            </div>
          </div>
        </div>
        <Sidebar />
      </div>
    </div>
  );
}
