import React, { useState } from "react";
import "./askExpert.css";

export default function AskExpert() {
  const [question, setQuestion] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    // Here you would send the question to backend or expert system
  };

  return (
    <div className="askExpert-container">
      <div className="askExpert-card">
        <h2 className="askExpert-title">
          <i className="fas fa-user-graduate"></i> Ask an Expert
        </h2>
        <p className="askExpert-desc">
          Get personalized answers from agricultural experts. Submit your question below and our team will respond soon!
        </p>
        {!submitted ? (
          <form className="askExpert-form" onSubmit={handleSubmit}>
            <textarea
              className="askExpert-input"
              placeholder="Type your question..."
              value={question}
              onChange={e => setQuestion(e.target.value)}
              required
              rows={4}
            />
            <button className="askExpert-btn" type="submit">
              <i className="fas fa-paper-plane"></i> Submit
            </button>
          </form>
        ) : (
          <div className="askExpert-success">
            <i className="fas fa-check-circle"></i>
            <span>Your question has been submitted!</span>
            <p>Our experts will reply as soon as possible.</p>
          </div>
        )}
      </div>
    </div>
  );
}
