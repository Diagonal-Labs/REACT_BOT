import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import '../../styles/interview.css';
import * as pdfjsLib from 'pdfjs-dist';
import { GlobalWorkerOptions } from 'pdfjs-dist/build/pdf';

// Set up the PDF.js worker source
// For the latest version:
GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const parsePDF = async (file) => {
  try {
    const pdfData = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: pdfData });
    const pdfDoc = await loadingTask.promise;
    
    let fullText = '';
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map(item => item.str)
        .join(' ');
      fullText += pageText + ' ';
    }
    return fullText.trim();
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw error;
  }
};

const parseFileToText = async (file) => {
  try {
    if (file.type === 'application/pdf') {
      return await parsePDF(file);
    } else if (file.type === 'text/plain') {
      const text = await file.text(); // Using the File API's text() method
      return text;
    } else if (file.type.includes('word')) {
      // For doc/docx files, we'll need to use FileReader
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
      });
    }
    throw new Error('Unsupported file type');
  } catch (error) {
    console.error('Error parsing file:', error);
    throw error;
  }
};

const UploadSection = ({ onUploadComplete, setUploadData }) => {
  const [jobTitle, setJobTitle] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState({
    resume: null,
    jobDescription: null,
  });
  
  const handleResumeUpload = async (acceptedFiles) => {
    try {
      const file = acceptedFiles[0];
      console.log('Uploading file:', file.name, 'Type:', file.type);
      
      const text = await parseFileToText(file);
      console.log('Extracted text:', text.substring(0, 100) + '...'); // Log first 100 chars
      
      setUploadData(prev => ({ ...prev, resumeText: text }));
      setUploadedFiles(prev => ({ ...prev, resume: file.name }));
    } catch (error) {
      console.error('Error processing resume:', error);
      // Handle the error appropriately, maybe show a toast message
    }
  };

  const handleJobDescriptionUpload = async (acceptedFiles) => {
    try {
      const file = acceptedFiles[0];
      console.log('Uploading job description:', file.name, 'Type:', file.type);
      
      const text = await parseFileToText(file);
      console.log('Extracted text:', text.substring(0, 100) + '...'); // Log first 100 chars
      
      setUploadData(prev => ({ ...prev, jobDescriptionText: text }));
      setUploadedFiles(prev => ({ ...prev, jobDescription: file.name }));
    } catch (error) {
      console.error('Error processing job description:', error);
      // Handle the error appropriately
    }
  };

  const { getRootProps: getResumeProps, getInputProps: getResumeInputProps } =
    useDropzone({
      onDrop: handleResumeUpload,
      accept: {
        'text/plain': ['.txt'],
        'application/pdf': ['.pdf'],
        'application/msword': ['.doc'],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      },
      multiple: false,
    });

  const { getRootProps: getJobProps, getInputProps: getJobInputProps } =
    useDropzone({
      onDrop: handleJobDescriptionUpload,
      accept: {
        'text/plain': ['.txt'],
        'application/pdf': ['.pdf'],
        'application/msword': ['.doc'],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      },
      multiple: false,
    });

  const handleRemoveFile = (fileType) => {
    setUploadedFiles((prev) => ({ ...prev, [fileType]: null }));
    setUploadData((prev) => ({
      ...prev,
      [fileType === 'resume' ? 'resumeText' : 'jobDescriptionText']: '',
    }));
  };

  return (
    <div className="upload-section">
      <h2>Welcome to Your AI Interview</h2>

      <div {...getResumeProps()} className="dropzone">
        <input {...getResumeInputProps()} />
        {!uploadedFiles.resume ? (
          <p>Drop your resume here or click to select</p>
        ) : (
          <div className="uploaded-file">
            <p className="uploaded-file-name">Uploaded: {uploadedFiles.resume}</p>
            <button
              className="remove-file"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveFile('resume');
              }}
            >
              Remove
            </button>
          </div>
        )}
      </div>

      <input
        type="text"
        placeholder="Enter job title"
        value={jobTitle}
        onChange={(e) => {
          setJobTitle(e.target.value);
          setUploadData((prev) => ({ ...prev, jobTitle: e.target.value }));
        }}
        className="job-title-input"
      />

      <div {...getJobProps()} className="dropzone">
        <input {...getJobInputProps()} />
        {!uploadedFiles.jobDescription ? (
          <p>Drop job description here or click to select (optional)</p>
        ) : (
          <div className="uploaded-file">
            <p className="uploaded-file-name">Uploaded: {uploadedFiles.jobDescription}</p>
            <button
              className="remove-file"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveFile('jobDescription');
              }}
            >
              Remove
            </button>
          </div>
        )}
      </div>

      <button
        onClick={onUploadComplete}
        className="start-button"
        disabled={!uploadedFiles.resume || !jobTitle}
      >
        Start Interview
      </button>
    </div>
  );
};

export default UploadSection;
