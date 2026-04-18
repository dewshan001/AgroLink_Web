import { useState } from "react";
import "./contact.css";
import Sidebar from "../../components/sidebar/Sidebar";

export default function Contact() {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="contact fadeIn">
      <div className="contactWrapper">
        <div className="contactContent">
          <div className="contactHero">
            <i className="fas fa-envelope contactHeroIcon"></i>
            <h1 className="contactTitle">Get in Touch</h1>
            <p className="contactSubtitle">
              Have a question or want to collaborate? We'd love to hear from you.
            </p>
          </div>

          {sent ? (
            <div className="contactSuccess">
              <i className="fas fa-check-circle"></i>
              <h3>Message Sent!</h3>
              <p>Thank you for reaching out. We'll get back to you soon.</p>
            </div>
          ) : (
            <form className="contactForm" onSubmit={handleSubmit}>
              <div className="contactRow">
                <div className="contactField">
                  <label>Name</label>
                  <input type="text" placeholder="Your name..." required />
                </div>
                <div className="contactField">
                  <label>Email</label>
                  <input type="email" placeholder="Your email..." required />
                </div>
              </div>
              <div className="contactField">
                <label>Subject</label>
                <input type="text" placeholder="What's this about?" required />
              </div>
              <div className="contactField">
                <label>Message</label>
                <textarea rows="5" placeholder="Tell us how we can help..." required />
              </div>
              <button className="contactButton" type="submit">
                <i className="fas fa-paper-plane"></i>
                Send Message
              </button>
            </form>
          )}
        </div>
        <Sidebar />
      </div>
    </div>
  );
}
