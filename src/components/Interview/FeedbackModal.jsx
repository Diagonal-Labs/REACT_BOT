import React, { useState } from 'react';
import { auth } from "../firebase";
import '../../styles/interview.css';
import axios from 'axios';

const FeedbackModal = ({ sessionId, onClose }) => {
  const { currentUser } = auth.currentUser; 
  const [feedback, setFeedback] = useState({});

  const feedbackQuestions = [
    { id: 1, text: "How satisfied were you with the AI interview?", type: "rating", min: 1, max: 10 },
    { id: 2, text: "What feature or aspect of the AI interview did you find most valuable?", type: "text" },
    { id: 3, text: "What feature or aspect needs to be modified or fixed?", type: "text" },
    { id: 4, text: "What additional functionality would make this more valuable?", type: "text" },
    { id: 5, text: "How likely are you to recommend this to a friend?", type: "rating", min: 1, max: 10 },
    { id: 6, text: "Any other additional info? (Optional)", type: "text", optional: true }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.post(
        'https://us-central1-interview-bot-dev-434810.cloudfunctions.net/interview-bot-backend-dev',
        {
          action: 'submit_feedback',
          user_id: currentUser.uid,
          session_id: sessionId,
          email: currentUser.email,
          feedback
        }
      );

      if (response.data.status === 'Elaborate feedback submitted successfully') {
        alert('Thank you for your feedback! You will receive your evaluation and recording through email.');
        onClose();
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('There was an error submitting your feedback. Please try again.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="feedback-modal">
        <button className="close-button" onClick={onClose}>&times;</button>
        
        <h2>Interview Feedback</h2>
        <form onSubmit={handleSubmit}>
          {feedbackQuestions.map(question => (
            <div key={question.id} className="feedback-question">
              <label>{question.text}</label>
              
              {question.type === 'rating' ? (
                <div className="rating-container">
                  {[...Array(question.max - question.min + 1)].map((_, i) => (
                    <label key={i} className="rating-option">
                      <input
                        type="radio"
                        name={`q${question.id}`}
                        value={i + question.min}
                        onChange={(e) => setFeedback(prev => ({
                          ...prev,
                          [`q${question.id}`]: e.target.value
                        }))}
                        required={!question.optional}
                      />
                      {i + question.min}
                    </label>
                  ))}
                </div>
              ) : (
                <textarea
                  required={!question.optional}
                  onChange={(e) => setFeedback(prev => ({
                    ...prev,
                    [`q${question.id}`]: e.target.value
                  }))}
                />
              )}
            </div>
          ))}
          
          <button type="submit" className="submit-feedback-button">
            Submit Feedback
          </button>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal; 