import React, { useState, useEffect } from 'react';
import { auth } from "../firebase";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import UploadSection from './UploadSection';
import ProgressBar from './ProgressBar';
import QuestionDisplay from './QuestionDisplay';
import AudioRecorder from './AudioRecorder';
import Evaluation from './Evaluation';

const Interview = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [audioUploadQueue, setAudioUploadQueue] = useState([]);
  const [interviewState, setInterviewState] = useState({
    stage: 'upload',
    sessionId: null,
    currentQuestion: null,
    questionIndex: 0,
    totalQuestions: 5,
    evaluation: null,
    isProcessing: false,
    processingMessage: '',
    error: null,
    audioResponse: null
  });

  const [uploadData, setUploadData] = useState({
    resumeText: '',
    jobTitle: '',
    jobDescriptionText: '',
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        console.log("No user logged in");
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);


  const uploadAudio = async (audioBlob, userId, currentQuestionIndex) => {
    const newQueue = [...audioUploadQueue, { audioBlob, userId, currentQuestionIndex }];
    setAudioUploadQueue(newQueue);
    
    if (newQueue.length === 1) {
      await processAudioUploadQueue();
    }
  };

  const processAudioUploadQueue = async () => {
    while (audioUploadQueue.length > 0) {
      const { audioBlob, userId, currentQuestionIndex } = audioUploadQueue[0];

      try {
        const formData = new FormData();
        const audioMimeType = audioBlob.type;

        // Determine file extension
        let fileExtension = '.wav';
        if (audioMimeType === 'audio/webm' || audioMimeType === 'audio/webm;codecs=opus') {
          fileExtension = '.webm';
        } else if (audioMimeType === 'audio/mp4') {
          fileExtension = '.mp4';
        } else if (audioMimeType === 'audio/ogg' || audioMimeType === 'audio/ogg;codecs=opus') {
          fileExtension = '.ogg';
        } else if (audioMimeType === 'audio/x-m4a') {
          fileExtension = '.m4a';
        } else {
          console.warn(`Unsupported audio format: ${audioMimeType}. Defaulting to .wav`);
        }

        formData.append('audio_mime_type_frontend', audioMimeType);
        formData.append('audio', audioBlob, `${userId}_${Date.now()}${fileExtension}`);
        formData.append('user_id', userId);
        formData.append('session_id', interviewState.sessionId);
        formData.append('question_index', currentQuestionIndex);
        formData.append('audio_file', 'true');

        const response = await axios.post(
          'https://us-central1-interview-bot-dev-434810.cloudfunctions.net/interview-bot-backend-dev',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        console.log('Audio sent successfully:', response.data);

        // Remove the processed item from queue
        setAudioUploadQueue(prev => prev.slice(1));
      } catch (error) {
        console.error('Error sending audio:', error);
        // Remove the failed item from queue
        setAudioUploadQueue(prev => prev.slice(1));
      }
    }
  };

  const playAudioResponse = (audioBase64) => {
    if (!audioBase64) {
      console.error('No audio data received');
      return;
    }
    const audio = new Audio('data:audio/wav;base64,' + audioBase64);
    audio.oncanplaythrough = () => {
      console.log('Audio loaded successfully');
      audio.play().catch(e => console.error('Error playing audio:', e));
    };
    audio.onerror = (e) => {
      console.error('Error loading audio:', e);
    };
  };

  const handleUploadSubmit = async () => {
    try {
      // Check if user is authenticated
      if (!currentUser) {
        console.error('No user logged in');
        navigate('/login');
        return;
      }

      // Validate required fields
      if (!uploadData.resumeText || !uploadData.jobTitle) {
        console.error('Resume and job title are required');
        // Show error message to user
        return;
      }

      // Log the resume text to console
      console.log("Resume Text to be sent:", uploadData.resumeText);

      // uploadData.resumeText = "Data Engineer";
      const response = await axios.post(
        'https://us-central1-interview-bot-dev-434810.cloudfunctions.net/interview-bot-backend-dev',
        {
          user_id: currentUser.uid,
          email: currentUser.email,
          resume: uploadData.resumeText,
          job_title: uploadData.jobTitle,
          job_description: uploadData.jobDescriptionText,
          action: 'start_interview',
          device: 'web',
          os: navigator.platform,
          browser: navigator.userAgent
        }
      );

      if (response.data.status === 'Interview started successfully') {
        setInterviewState(prev => ({
          ...prev,
          stage: 'interview',
          sessionId: response.data.session_id,
          currentQuestion: "Tell me about yourself and why you are interested in this role"
        }));
      }
    } catch (error) {
      console.error('Error starting interview:', error);
      // Show error message to user
    }
  };

  const handleAnswerSubmit = async (audioBlob) => {
    if (!audioBlob) {
      console.error('No audio recorded');
      // You might want to add state for error handling and display
      return;
    }
  
    try {
      if (!interviewState.sessionId) {
        throw new Error('Interview session not initialized properly');
      }
  
      // Update question index
      const newQuestionIndex = interviewState.questionIndex + 1;
      
      // Check if this is the last question
      const isLastQuestion = newQuestionIndex >= interviewState.totalQuestions;
  
      // Update UI state to show processing
      setInterviewState(prev => ({
        ...prev,
        isProcessing: true,
        processingMessage: isLastQuestion 
          ? "Thank you for completing the interview. Your evaluation is in progress. Please wait, it may take a few moments as we process your answers."
          : "Processing your answer..."
      }));
  
      // Start audio upload process (you'll need to implement this)
      await uploadAudio(audioBlob, currentUser.uid, interviewState.questionIndex);

      // Request next question or evaluation
      const response = await axios.post(
        'https://us-central1-interview-bot-dev-434810.cloudfunctions.net/interview-bot-backend-dev',
        {
          user_id: currentUser.uid,
          session_id: interviewState.sessionId,
          question_index: interviewState.questionIndex,
          audio_pending: true
        }
      );

      if (response.data.audio) {
        playAudioResponse(response.data.audio);
      }
  
      if (response.data.interview_complete) {
        // Handle interview completion
        setInterviewState(prev => ({
          ...prev,
          stage: 'evaluation',
          isProcessing: false,
          evaluation: response.data.text
        }));
      } else {
        // Handle next question
        setInterviewState(prev => ({
          ...prev,
          questionIndex: response.data.question_index,
          currentQuestion: response.data.text,
          isProcessing: false,
          audioResponse: response.data.audio // If you're playing audio responses
        }));
      }
  
    } catch (error) {
      console.error('Error in handleAnswerSubmit:', error);
      setInterviewState(prev => ({
        ...prev,
        isProcessing: false,
        error: 'An error occurred while submitting your answer. Please try again.'
      }));
    }
};  

  if (!currentUser) {
    return (
      <div className="loading-container">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="interview-container">
      {interviewState.error && (
        <div className="error-message">
          {interviewState.error}
        </div>
      )}
  
      {interviewState.isProcessing && (
        <div className="processing-message">
          {interviewState.processingMessage}
        </div>
      )}
  
      {interviewState.stage === 'upload' && (
        <UploadSection 
          onUploadComplete={handleUploadSubmit}
          setUploadData={setUploadData}
        />
      )}
  
      {interviewState.stage === 'interview' && !interviewState.isProcessing && (
        <>
          <ProgressBar 
            current={interviewState.questionIndex + 1}
            total={interviewState.totalQuestions}
          />
          <QuestionDisplay 
            question={interviewState.currentQuestion}
            questionNumber={interviewState.questionIndex + 1}
          />
          <AudioRecorder onSubmit={handleAnswerSubmit} />
        </>
      )}
  
      {interviewState.stage === 'evaluation' && (
        <Evaluation 
          evaluation={interviewState.evaluation}
          sessionId={interviewState.sessionId}
        />
      )}
    </div>
  );
};

export default Interview;