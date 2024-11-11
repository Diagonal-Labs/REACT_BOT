import React, { useState } from 'react';
import FeedbackModal from './FeedbackModal';
import '../../styles/interview.css';

const Evaluation = ({ evaluation, sessionId }) => {
  const [showFeedback, setShowFeedback] = useState(false);

  const formatEvaluation = (text) => {
    try {
      // Split the evaluation into sections
      const sections = text.split(/Answer \d+:|Overall Feedback:|Overall Scoring:/);

      return (
        <div className="bot-message evaluation">
          {/* Thank you message */}
          <h2>{sections[0].trim()}</h2>

          {/* Process each answer's feedback */}
          {sections.slice(1, -2).map((section, index) => (
            <div key={`answer-${index}`} className="evaluation-section">
              <h3>Answer {index + 1}:</h3>
              {section.split('\n').map((line, lineIndex) => (
                <React.Fragment key={`line-${lineIndex}`}>
                  {line}
                  <br />
                </React.Fragment>
              ))}
            </div>
          ))}

          {/* Overall Feedback */}
          <div className="evaluation-section">
            <h3>Overall Feedback:</h3>
            {sections[sections.length - 2].split('\n').map((line, index) => (
              <React.Fragment key={`feedback-${index}`}>
                {line}
                <br />
              </React.Fragment>
            ))}
          </div>

          {/* Overall Scoring */}
          <div className="evaluation-section">
            <h3>Overall Scoring:</h3>
            {sections[sections.length - 1].split('\n').map((line, index) => (
              <React.Fragment key={`scoring-${index}`}>
                {line}
                <br />
              </React.Fragment>
            ))}
          </div>
        </div>
      );
    } catch (error) {
      console.error('Error formatting evaluation:', error);
      return <p>{evaluation}</p>; // Fallback to display raw evaluation
    }
  };

  return (
    <div className="evaluation-container">
      <div className="evaluation-content">
        {formatEvaluation(evaluation)}
      </div>
      
      <div className="feedback-section">
        <button 
          className="feedback-button"
          onClick={() => setShowFeedback(true)}
        >
          Provide Feedback
        </button>
        <div id="feedbackInfo" style={{ display: 'block' }}>
          {/* Add any feedback info text here */}
        </div>
      </div>

      {showFeedback && (
        <FeedbackModal 
          sessionId={sessionId}
          onClose={() => setShowFeedback(false)}
        />
      )}
    </div>
  );
};

export default Evaluation;