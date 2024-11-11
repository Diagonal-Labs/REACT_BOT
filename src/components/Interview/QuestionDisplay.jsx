import React from 'react';
import '../../styles/interview.css';

const QuestionDisplay = ({ question, questionNumber }) => {
  return (
    <div className="question-display">
      <div className="question-number">
        Question {questionNumber}/5
      </div>
      <div className="question-text">
        {question}
      </div>
    </div>
  );
};

export default QuestionDisplay; 