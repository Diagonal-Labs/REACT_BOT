import React, { useState, useRef } from 'react';
import '../../styles/interview.css';

const AudioRecorder = ({ onSubmit }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      streamRef.current.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const handleSubmit = () => {
    if (chunksRef.current.length > 0) {
      const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
      onSubmit(audioBlob);
      setAudioUrl(null);
      chunksRef.current = [];
    }
  };

  return (
    <div className="audio-recorder">
      {!isRecording && !audioUrl && (
        <button 
          className="record-button"
          onClick={startRecording}
        >
          Start Recording
        </button>
      )}

      {isRecording && (
        <button 
          className="stop-button recording"
          onClick={stopRecording}
        >
          Stop Recording
        </button>
      )}

      {audioUrl && (
        <div className="audio-playback">
          <audio src={audioUrl} controls />
          <button 
            className="submit-button"
            onClick={handleSubmit}
          >
            Submit Answer
          </button>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder; 