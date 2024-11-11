// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCOW3V3UB_Ao5Z9mPZCa1SzbyLPpWioQ9Y",
    authDomain: "interview-bot-dev-434810.firebaseapp.com",
    projectId: "interview-bot-dev-434810",
    storageBucket: "interview-bot-dev-434810.appspot.com",
    messagingSenderId: "1053915770459",
    appId: "1:1053915770459:web:cbd702d94f895237c2597e",
    measurementId: "G-EPYN2K4MC2"
  };
  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const storage = firebase.storage();
  const db = firebase.firestore();
  
  // Initialize FirebaseUI Widget
  var ui = firebaseui.auth.AuthUI.getInstance() || new firebaseui.auth.AuthUI(auth);
  
  // FirebaseUI configuration
  var uiConfig = {
    callbacks: {
      signInSuccessWithAuthResult: function(authResult, redirectUrl) {
        // User signed in successfully.
        return false; // Do not redirect.
      },
      uiShown: function() {
        // The widget is rendered.
      }
    },
    signInFlow: 'popup',
    signInOptions: [
      firebase.auth.EmailAuthProvider.PROVIDER_ID,
      firebase.auth.GoogleAuthProvider.PROVIDER_ID,
      'apple.com',
    ],
    tosUrl: 'https://yourapp.com/terms',
    privacyPolicyUrl: 'https://yourapp.com/privacy',
  };
  
  // Set authentication persistence to NONE
  auth.setPersistence(firebase.auth.Auth.Persistence.NONE)
    .catch(function(error) {
      console.error('Error setting persistence:', error);
    });
  
  // Authentication state listener
  auth.onAuthStateChanged(function(user) {
      if (user) {
          document.getElementById('loginPage').style.display = 'none';
          document.getElementById('interviewPage').style.display = 'block';
          // Use the Firebase UID as the userId
          userId = user.uid;
          // Set the user's display name
          let displayName = user.displayName || user.email;
          document.getElementById('userName').textContent = displayName;
          // Create or validate user profile
          createOrValidateUserProfile(userId, user.email);
          // Initialize the UI for the interview process
          initializeUI();
      } else {
          document.getElementById('loginPage').style.display = 'block';
          document.getElementById('interviewPage').style.display = 'none';
          // Reset and start FirebaseUI Authentication
          ui.reset();
          ui.start('#firebaseui-auth-container', uiConfig);
      }
  });
  
  function initializeUI() {
      // Show resume, job title, and job description upload sections
      document.getElementById('resumeWrapper').style.display = 'block';
      document.getElementById('jobTitleWrapper').style.display = 'block'; // Add this line
      document.getElementById('jobDescriptionWrapper').style.display = 'block';
      
      // Show the submit button for uploads
      document.getElementById('submit').style.display = 'block';
      
      // Hide interview-related elements
      document.getElementById('question').style.display = 'none';
      document.getElementById('chatContainer').style.display = 'none';
      document.getElementById('startRecord').style.display = 'none';
      document.getElementById('stopRecord').style.display = 'none';
      document.getElementById('submitAnswer').style.display = 'none';
      document.getElementById('audioPlayback').style.display = 'none';
      
      // Hide processing message
      document.getElementById('processingMessage').style.display = 'none';
  
      // Create the description text
      const descriptionDiv = document.createElement('div');
      descriptionDiv.id = 'interviewDescription';
      descriptionDiv.innerHTML = `
          <h2>Welcome to Your AI Interview Session</h2>
          <p>Here's what you can expect:</p>
          <ol>
              <li>Upload your resume, enter the job title, and optionally upload the job description for the position you're interested in.</li>
              <li>Our AI assistant will analyze this information and generate 5 tailored interview questions.</li>
              <li>You'll be asked these questions one by one, and you can record your answers.</li>
              <li>At the end of the 5 responses, the AI will provide feedback on what you did well and areas for improvement.</li>
              <li>At the end of the interview, you'll receive an overall evaluation and suggested answers incorporating the feedback.</li>
          </ol>
          <p id="evaluationText">
              You will get an evaluation report similar to <span id="highlightedText" style="color: blue; cursor: pointer;">this</span>.
          </p>
  
          <!-- Modal Box -->
          <div id="evaluationModal" class="modal" style="display: none;">
              <div class="modal-content">
                  <span class="close-modal" id="closeEvaluationModal">&times;</span>
                  <h2>Evaluation Report Preview</h2>
                  <img src="https://storage.googleapis.com/interview-bot-dev-434810.appspot.com/eval_image.jpg" alt="Evaluation Report" style="width: 100%; height: auto;">
              </div>
          </div>
          <p>This process is designed to help you prepare effectively for your real interview. Good luck!</p>
      `;
      
      // Insert the description after the submit button
      const submitButton = document.getElementById('submit');
      submitButton.parentNode.insertBefore(descriptionDiv, submitButton.nextSibling);
  
      // Attach modal event listeners after elements are added
      document.getElementById("highlightedText").onclick = function() {
          document.getElementById("evaluationModal").style.display = "block";
      };
  
      document.getElementById("closeEvaluationModal").onclick = function() {
          document.getElementById("evaluationModal").style.display = "none";
      };
  
      window.onclick = function(event) {
          if (event.target == document.getElementById("evaluationModal")) {
              document.getElementById("evaluationModal").style.display = "none";
          }
      };
  
  }
  
  // Function to call backend API to create or validate user profile
  async function createOrValidateUserProfile(userId, email) {
    try {
      // Make an API request to the backend to create or validate the user profile
      const response = await axios.post('https://us-central1-interview-bot-dev-434810.cloudfunctions.net/interview-bot-backend-dev', {
        user_id: userId,
        email: email
      });
  
      // Log the response to know whether the profile was created or already exists
      console.log(response.data.status);  // Logs 'User profile created' or 'User profile already exists'
  
    } catch (error) {
      // Handle any errors that occur during the API call
      console.error('Error creating or validating user profile:', error);
    }
  }
  
  // Variables and event listeners
  let recorder;
  let stream;
  let recordedAudioBlob;
  let userId; // userId will be set after authentication
  let resumeText = '';
  let jobDescriptionText = '';
  let interviewComplete = false;
  let question_index = null;
  let sessionId = null; // To store the current session ID
  let firstQuestionAudio = null;
  let interviewInitializationPromise = null;
  let questionCounter = 0;
  let questionNumberForDisplay = 1;
  
  const submitButton = document.getElementById('submit');
  const startRecordButton = document.getElementById('startRecord');
  const stopRecordButton = document.getElementById('stopRecord');
  const submitAnswerButton = document.getElementById('submitAnswer');
  const audioPlayback = document.getElementById('audioPlayback');
  const questionDiv = document.getElementById('question');
  const errorDiv = document.getElementById('error');
  const resumeFile = document.getElementById('resumeFile');
  const jobDescriptionFile = document.getElementById('jobDescriptionFile');
  const resumeWrapper = document.getElementById('resumeWrapper');
  const jobDescriptionWrapper = document.getElementById('jobDescriptionWrapper');
  const processingMessage = document.getElementById('processingMessage');
  const userProfile = document.getElementById('userProfile');
  const userNameDisplay = document.getElementById('userName');
  const profileIcon = document.getElementById('profileIcon');
  const dropdownMenu = document.getElementById('dropdownMenu');
  const signOutButton = document.getElementById('signOutButton');
  const provideFeedbackBtn = document.getElementById('provideFeedbackBtn');
  const feedbackModal = document.getElementById('feedbackModal');
  const closeModal = document.querySelector('.close');
  const feedbackForm = document.getElementById('feedbackForm');
  const submitFeedbackBtn = document.getElementById('submitFeedback');
  const FIRST_QUESTION = "Tell me about yourself and why you are interested in this role";
  const FIRST_QUESTION_AUDIO_PATH = 'first_question_audio.txt';
  const TOTAL_QUESTIONS = 5; // Adjust this based on your total number of questions
  const feedbackQuestions = [
      { id: 1, text: "How satisfied were you with the AI interview?", type: "rating", min: 1, max: 10 },
      { id: 2, text: "What feature or aspect of the AI interview did you find most valuable?", type: "text" },
      { id: 3, text: "What feature or aspect of the AI interview needs to be modified or fixed to make it more relevant or valuable to you?", type: "text" },
      { id: 4, text: "What additional functionality would make this AI interview system more valuable for your interview preparation?", type: "text" },
      { id: 5, text: "How likely are you to recommend this to a friend?", type: "rating", min: 1, max: 10 },
      { id: 6, text: "Any other additional info you would like to share with the developers? (Optional)", type: "text", optional: true }
  ];
  
  
  submitButton.onclick = handleSubmit;
  startRecordButton.onclick = startRecording;
  stopRecordButton.onclick = stopRecording;
  submitAnswerButton.onclick = submitAnswer;
  resumeFile.onchange = handleResumeUpload;
  jobDescriptionFile.onchange = handleJobDescriptionUpload;
  provideFeedbackBtn.addEventListener('click', openFeedbackModal);
  closeModal.addEventListener('click', () => feedbackModal.style.display = 'none');
  submitFeedbackBtn.addEventListener('click', submitFeedback);
  
  
  // Handle profile icon click to toggle dropdown menu
  userProfile.onclick = function(event) {
    event.stopPropagation(); // Prevent the click from propagating to the document
    if (dropdownMenu.style.display === 'none' || dropdownMenu.style.display === '') {
      dropdownMenu.style.display = 'block';
    } else {
      dropdownMenu.style.display = 'none';
    }
  };
  
  // Close dropdown when clicking outside
  document.addEventListener('click', function(event) {
    var isClickInside = userProfile.contains(event.target);
  
    if (!isClickInside) {
      // The click was outside the userProfile element
      dropdownMenu.style.display = 'none';
    }
  });
  
  // Sign out button click handler
  signOutButton.onclick = handleLogout;
  
  function handleLogout() {
    auth.signOut().then(() => {
      // Sign-out successful.
      dropdownMenu.style.display = 'none';
      // The onAuthStateChanged listener will handle the UI changes
    }).catch((error) => {
      console.error('Logout Error:', error);
      logError(error, 'handleLogout');
    });
  }
  
  // Functions
  
  async function fetchTextFileContent(filePath) {
      try {
          // Use fetch to get the text file from the frontend
          const response = await fetch(filePath);
          
          if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
          }
  
          const fileContent = await response.text();
  
          if (fileContent) {
              return fileContent;
          } else {
              throw new Error('File content is empty');
          }
      } catch (error) {
          console.error('Error fetching text file content:', error);
          logError(error, 'fetchTextFileContent');
          return null;
      }
  }
  
  async function handleSubmit() {
      jobTitle = document.getElementById('jobTitle').value.trim();
      if (!resumeText || !jobTitle) {
          errorDiv.textContent = 'Please upload your resume and enter the job title.';
          return;
      }
  
      // Hide upload elements and show processing message
      document.getElementById('resumeWrapper').style.display = 'none';
      document.getElementById('jobTitleWrapper').style.display = 'none';
      document.getElementById('jobDescriptionWrapper').style.display = 'none';
      document.getElementById('submit').style.display = 'none';
      document.getElementById('interviewDescription').style.display = 'none';
      document.getElementById('processingMessage').style.display = 'block';
      // Ensure progress bar stays hidden during submission
      hideProgressBar(); 
    
      try {
          // Start fetching the audio file for the first question immediately
          const audioPromise = fetchTextFileContent('https://us-central1-interview-bot-dev-434810.cloudfunctions.net/interview-bot-frontend-dev/first_question_audio.txt');
  
          // Start the interview session asynchronously
          startInterviewAsync(userId, auth.currentUser.email, resumeText,jobTitle, jobDescriptionText);
  
          // Wait for the audio to be ready
          const audioContent = await audioPromise;
  
          if (!audioContent) {
              throw new Error('Failed to load audio content');
          }
  
          // Show interview elements
          document.getElementById('question').style.display = 'block';
          document.getElementById('chatContainer').style.display = 'block';
          document.getElementById('startRecord').style.display = 'block';
  
          // Display first question and play audio
          displayQuestion(FIRST_QUESTION);
          playAudioResponse(audioContent);
          
          // Update UI
          document.getElementById('processingMessage').style.display = 'none';
          
          // Set the initial question index
          question_index = 0;
  
          // Clear any error messages as the process was successful
          errorDiv.textContent = '';
  
      } catch (error) {
          logError(error, 'handleSubmit');
          document.getElementById('processingMessage').style.display = 'none';
          errorDiv.textContent = error.message || 'An error occurred. Please try again.';
          // Show the upload elements again to allow retry
          document.getElementById('resumeWrapper').style.display = 'block';
          document.getElementById('jobDescriptionWrapper').style.display = 'block';
          document.getElementById('submit').style.display = 'block';
      }
  }
  
  function getDeviceInfo() {
    const userAgent = navigator.userAgent;
    let device = "Unknown Device";
    let os = "Unknown OS";
    let browser = "Unknown Browser";
  
    // Check for mobile devices
    if (/android/i.test(userAgent)) {
      os = "Android";
    } else if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
      os = "iOS";
    } else if (/Macintosh/.test(userAgent)) {
      os = "MacOS";
    } else if (/Windows NT/.test(userAgent)) {
      os = "Windows";
    } else if (/Linux/.test(userAgent)) {
      os = "Linux";
    }
  
    // Device type
    if (/Mobile|iPhone|Android/.test(userAgent)) {
      device = "Mobile";
    } else if (/iPad/.test(userAgent)) {
      device = "Tablet";
    } else {
      device = "Desktop";
    }
  
    // Browser detection
    if (/chrome|crios|crmo/i.test(userAgent)) {
      browser = "Chrome";
    } else if (/firefox|fxios/i.test(userAgent)) {
      browser = "Firefox";
    } else if (/safari/i.test(userAgent) && !/chrome|crios|crmo/i.test(userAgent)) {
      browser = "Safari";
    } else if (/edge|edgios|edga/i.test(userAgent)) {
      browser = "Edge";
    } else if (/opera|opr\//i.test(userAgent)) {
      browser = "Opera";
    } else if (/msie|trident/i.test(userAgent)) {
      browser = "Internet Explorer";
    }
  
    return { device, os, browser };
  }
  
  function startInterviewAsync(userId, email, resume, jobTitle, jobDescription) {
      const { device, os, browser } = getDeviceInfo();  // Get device, OS, and browser information
  
      interviewInitializationPromise = axios.post('https://us-central1-interview-bot-dev-434810.cloudfunctions.net/interview-bot-backend-dev', {
          user_id: userId,
          email: email,
          resume: resume,
          job_title: jobTitle,
          job_description: jobDescription,
          action: 'start_interview',
          device: device,   // Add device information
          os: os,           // Add OS information
          browser: browser  // Add browser information
      })
      .then(response => {
          if (response.data.status === 'Interview started successfully') {
              sessionId = response.data.session_id;
              console.log('Interview session started successfully');
              return response.data;
          } else {
              throw new Error('Failed to start interview');
          }
      })
      .catch(error => {
          console.error('Error starting interview session:', error);
          logError(error, 'startInterviewAsync');
          throw error;
      });
  }
  
  //function to show progress
  function showProgressBar() {
      document.getElementById('progressBarContainer').style.display = 'flex';
  }
  
  // Function to hide progress bar
  function hideProgressBar() {
      document.getElementById('progressBarContainer').style.display = 'none';
  }
  const progress = document.getElementById("progress");
  const circles = document.querySelectorAll(".circle");
  let currentActive = 1; // Start with question 1
  function updateProgressBar() {
      // Set the active class for the current circle
      circles.forEach((circle, index) => {
          if (index < currentActive) {
              circle.classList.add('active');
          } else {
              circle.classList.remove('active');
          }
      });
  
      // Update the progress line width based on active circles
      const actives = document.querySelectorAll('.circle.active');
      progress.style.width = `${((actives.length - 1) / (circles.length - 1)) * 100}%`;
  }
  
  // Call this function to increment progress after each question is submitted
  function incrementProgress() {
      if (currentActive < circles.length) {
          currentActive++;
          updateProgressBar();
      }
  }
  
  
  // Initial setup - hide progress bar
  document.addEventListener('DOMContentLoaded', function() {
      hideProgressBar();
  });
  // Remove the event listener from the submit button since we're handling it in handleSubmit
  document.getElementById('submit').removeEventListener('click', function() {
      showProgressBar();
  });
  
  
  function displayQuestion(question) {
      questionDiv.innerHTML = '';
       showProgressBar();
  
      // Create and add the question number element
      const questionNumberElement = document.createElement('div');
      questionNumberElement.textContent = `Question ${questionNumberForDisplay}/5`;
      questionNumberElement.className = 'question-number';
      questionDiv.appendChild(questionNumberElement);
  
      // Create and add the actual question text
      const questionText = document.createElement('div');
      questionText.style.fontWeight = 'bold';
      questionText.textContent = question;
      questionText.className = 'question-text';
      questionDiv.appendChild(questionText);
  
      // Increment the question number after displaying the current question
      questionNumberForDisplay++;
  }
  
  function handleResumeUpload(event) {
      const file = event.target.files[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = async function (event) {
              const fileContent = event.target.result;
              if (file.name.endsWith('.pdf')) {
                  const pdf = await pdfjsLib.getDocument({ data: fileContent }).promise;
                  let text = '';
                  for (let i = 1; i <= pdf.numPages; i++) {
                      const page = await pdf.getPage(i);
                      const content = await page.getTextContent();
                      text += content.items.map(item => item.str).join(' ');
                  }
                  resumeText = text;
              } else {
                  const result = await mammoth.extractRawText({ arrayBuffer: fileContent });
                  resumeText = result.value;
              }
          };
          reader.readAsArrayBuffer(file);
      }
  }
  
  function handleJobDescriptionUpload(event) {
      const file = event.target.files[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = async function (event) {
              const fileContent = event.target.result;
              if (file.name.endsWith('.pdf')) {
                  const pdf = await pdfjsLib.getDocument({ data: fileContent }).promise;
                  let text = '';
                  for (let i = 1; i <= pdf.numPages; i++) {
                      const page = await pdf.getPage(i);
                      const content = await page.getTextContent();
                      text += content.items.map(item => item.str).join(' ');
                  }
                  jobDescriptionText = text;
              } else {
                  const result = await mammoth.extractRawText({ arrayBuffer: fileContent });
                  jobDescriptionText = result.value;
              }
          };
          reader.readAsArrayBuffer(file);
      }
  }
  
  function getSupportedMimeType() {
      const types = [
          'audio/webm;codecs=opus',
          'audio/ogg;codecs=opus',
          'audio/webm',
          'audio/ogg',
          'audio/mp4',
          'audio/mpeg'
      ];
  
      for (let i = 0; i < types.length; i++) {
          if (MediaRecorder.isTypeSupported(types[i])) {
              return types[i];
          }
      }
      return null;
  }
  
  function startRecording() {
      navigator.mediaDevices.getUserMedia({ audio: true })
          .then(function(s) {
              stream = s; // Save the stream to stop it later
  
              const mimeType = getSupportedMimeType();
              let options = { type: 'audio' };
  
              if (mimeType && typeof MediaRecorder !== 'undefined') {
                  options.mimeType = mimeType;
                  options.recorderType = RecordRTC.MediaStreamRecorder;
                  console.log(`Using MediaStreamRecorder with mimeType: ${mimeType}`);
              } else {
                  // Use StereoAudioRecorder as a fallback
                  options.recorderType = RecordRTC.StereoAudioRecorder;
                  options.mimeType = 'audio/wav';
                  console.log('Using StereoAudioRecorder with mimeType: audio/wav');
              }
  
              recorder = RecordRTC(stream, options);
  
              recorder.startRecording();
  
              // Update UI elements
              startRecordButton.style.display = 'none';
              stopRecordButton.style.display = 'block';
              stopRecordButton.classList.add('recording');
          })
          .catch(function(error) {
              console.error('Error accessing microphone:', error);
              logError(error, 'startRecording');
          });
  }
  
  function stopRecording() {
      recorder.stopRecording(function() {
          recordedAudioBlob = recorder.getBlob();
  
          // Release the microphone
          if (stream) {
              stream.getTracks().forEach(track => track.stop());
          }
  
          const audioUrl = URL.createObjectURL(recordedAudioBlob);
          audioPlayback.src = audioUrl;
          audioPlayback.style.display = 'block';
  
          // Update UI elements
          stopRecordButton.classList.remove('recording');
          stopRecordButton.style.display = 'none';
          submitAnswerButton.style.display = 'block';
      });
  }
  
  
  async function submitAnswer() {
      if (!recordedAudioBlob) {
          errorDiv.textContent = 'No audio recorded. Please record your answer before submitting.';
          return;
      }
  
      // Increment the question counter
      questionCounter++;
  
      // Log the current question counter and total questions
      console.log(`Current question: ${questionCounter}, Total questions: ${TOTAL_QUESTIONS}`);
  
      try {
          // Check if the interview initialization is still in progress
          if (interviewInitializationPromise) {
              await interviewInitializationPromise;
          }
  
          if (!sessionId) {
              throw new Error('Interview session not initialized properly');
          }
  
          // Check if this is the last question
          if (questionCounter >= TOTAL_QUESTIONS) {
              // Show loading bar for evaluation without showing processing message
              toggleEvaluationLoadingBar(true, 'Thank you for completing the interview. Your evaluation is in progress. Please wait, it may take a few moments as we process your answers.');
          } else {
              // Show processing message for non-final questions
              document.getElementById('processingMessage').style.display = 'block';
          }
  
          document.getElementById('submitAnswer').style.display = 'none';
  
          // Start audio upload process
          uploadAudio(recordedAudioBlob, userId, question_index);
  
          // Request next question or evaluation
          const response = await axios.post('https://us-central1-interview-bot-dev-434810.cloudfunctions.net/interview-bot-backend-dev', {
              user_id: userId,
              session_id: sessionId,
              question_index: question_index,
              audio_pending: true
          });
  
          if (response.data.interview_complete) {
              // Handle the completion of the interview
              displayEvaluation(response.data.text);
              toggleEvaluationLoadingBar(false);
              interviewComplete = true;
              document.getElementById('audioPlayback').style.display = 'none';
          } else {
              // Hide processing message for non-final questions
              document.getElementById('processingMessage').style.display = 'none';
              
              // Update question index
              question_index = response.data.question_index;
  
              // Display next question and play audio
              displayQuestion(response.data.text);
              playAudioResponse(response.data.audio);
  
              // Increment progress bar for the current question
              incrementProgress();
  
              // Reset UI for next question
              document.getElementById('audioPlayback').style.display = 'none';
              document.getElementById('startRecord').style.display = 'block';
              document.getElementById('submitAnswer').style.display = 'none';
          }
      } catch (error) {
          document.getElementById('processingMessage').style.display = 'none';
          toggleEvaluationLoadingBar(false);
          
          // Log the error to the console
          console.error('Error in submitAnswer:', error);
          logError(error, 'submitAnswer');
          const errorDiv = document.getElementById('error');
          errorDiv.textContent = 'An error occurred while submitting your answer. Please try again.';
          errorDiv.style.display = 'block';
      }
  }
  
  function toggleEvaluationLoadingBar(show, message = '') {
      console.log('toggleEvaluationLoadingBar called:', show, message);
      const wrapper = document.getElementById('evaluationLoadingWrapper');
      const bar = document.getElementById('evaluationLoadingBar').firstElementChild;
      const text = document.getElementById('evaluationLoadingText');
      // Hide progress bar during evaluation
      hideProgressBar();
      
      console.log('Elements:', wrapper, bar, text);
  
      if (show) {
          wrapper.style.display = 'block';
          text.textContent = message;
          
          // Reset and animate the loading bar
          bar.style.width = '0%';
          let width = 0;
          const totalDuration = 45000; // 45 seconds
          const intervalDuration = 100; // Update every 100ms
          const steps = totalDuration / intervalDuration;
          const increment = 100 / steps;
  
          const interval = setInterval(() => {
              if (width >= 100) {
                  clearInterval(interval);
              } else {
                  width += increment;
                  bar.style.width = width + '%';
              }
          }, intervalDuration);
      } else {
          wrapper.style.display = 'none';
          text.textContent = '';
          // Clear any ongoing animation
          if (bar) {
              bar.style.width = '0%';
          }
      }
  }
  
  
  let audioUploadQueue = [];
  
  async function uploadAudio(audioBlob, userId, currentQuestionIndex) {
      audioUploadQueue.push({ audioBlob, userId, currentQuestionIndex });
      if (audioUploadQueue.length === 1) {
          await processAudioUploadQueue();
      }
  }
  
  async function processAudioUploadQueue() {
      while (audioUploadQueue.length > 0) {
          const { audioBlob, userId, currentQuestionIndex } = audioUploadQueue[0];
  
          try {
              // Create a FormData object to send the audio file
              const formData = new FormData();
  
              // Get the MIME type of the audioBlob (e.g., 'audio/mp4' or 'audio/wav')
              const audioMimeType = audioBlob.type; // Ensure this matches the Blob's actual type
  
              // Set the file extension based on the MIME type
              let fileExtension = '.wav'; // Default to .wav
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
              formData.append('session_id', sessionId);
              formData.append('question_index', currentQuestionIndex);
              formData.append('audio_file', 'true');  // Flag to indicate audio file is present
  
              // Send the audio directly to the backend
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
  
              audioUploadQueue.shift(); // Remove the processed item
          } catch (error) {
              console.error('Error sending audio:', error);
              logError(error, 'processAudioUploadQueue');
              audioUploadQueue.shift();
          }
      }
  }
  
  
  function playAudioResponse(audioBase64) {
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
  }
  
  function displayEvaluation(formattedEvaluation) {
      const chatContainer = document.getElementById('chatContainer');
      const questionDiv = document.getElementById('question');
      questionDiv.innerHTML = ''; // Clear the last question
  
      const evaluationDiv = document.createElement('div');
      evaluationDiv.className = 'bot-message evaluation';
  
      // Split the evaluation into sections
      const sections = formattedEvaluation.split(/Answer \d+:|Overall Feedback:|Overall Scoring:/);
  
      // Create HTML content
      let htmlContent = `<h2>${sections[0].trim()}</h2>`; // This is the "Thank you" message
  
      // Process each answer's feedback
      for (let i = 1; i < sections.length - 2; i++) {
          htmlContent += `<h3>Answer ${i}:</h3>`;
          htmlContent += sections[i].replace(/\n/g, '<br>');
      }
  
      // Add Overall Feedback and Scoring
      htmlContent += `<h3>Overall Feedback:</h3>${sections[sections.length - 2].replace(/\n/g, '<br>')}`;
      htmlContent += `<h3>Overall Scoring:</h3>${sections[sections.length - 1].replace(/\n/g, '<br>')}`;
  
      evaluationDiv.innerHTML = htmlContent;
      chatContainer.appendChild(evaluationDiv);
  
      // Show the feedback button after displaying the evaluation
      provideFeedbackBtn.style.display = 'block';
      document.getElementById('feedbackInfo').style.display = 'block';
  
  }
  
  // Function to open the feedback modal and populate questions
  function openFeedbackModal() {
      feedbackForm.innerHTML = ''; // Clear previous questions
  
      feedbackQuestions.forEach(question => {
          const questionDiv = document.createElement('div');
          questionDiv.style.marginBottom = '15px';
  
          // Create and append the question label
          const label = document.createElement('label');
          label.textContent = question.text;
          questionDiv.appendChild(label);
          questionDiv.appendChild(document.createElement('br'));
  
          if (question.type === 'rating') {
              // Create a container for radio buttons
              const radioContainer = document.createElement('div');
              radioContainer.className = 'radio-container'; // Add a class for styling
  
              // Determine the range for rating questions
              const min = question.min || 1;
              const max = question.max || 5;
  
              for (let i = min; i <= max; i++) {
                  const radioWrapper = document.createElement('div');
                  radioWrapper.className = 'radio-wrapper'; // Optional: for individual radio styling
  
                  const radio = document.createElement('input');
                  radio.type = 'radio';
                  radio.name = `q${question.id}`;
                  radio.value = i;
                  radio.required = !question.optional; // Set required if not optional
                  radio.id = `q${question.id}_option${i}`; // Assign a unique ID
  
                  const radioLabel = document.createElement('label');
                  radioLabel.htmlFor = radio.id;
                  radioLabel.textContent = ` ${i}`;
  
                  radioWrapper.appendChild(radio);
                  radioWrapper.appendChild(radioLabel);
                  radioContainer.appendChild(radioWrapper);
              }
  
              questionDiv.appendChild(radioContainer);
          } else if (question.type === 'text') {
              // Create a textarea for text-based questions
              const textarea = document.createElement('textarea');
              textarea.name = `q${question.id}`;
              textarea.rows = 4;
              textarea.cols = 50;
              textarea.required = !question.optional; // Set required if not optional
              textarea.placeholder = 'Your answer here...';
  
              questionDiv.appendChild(textarea);
          }
  
          feedbackForm.appendChild(questionDiv);
      });
  
      feedbackModal.style.display = 'block';
  }
  
  
  // Function to submit feedback
  async function submitFeedback() {
      const feedback = {};
      let allRequiredFieldsFilled = true;
  
      feedbackQuestions.forEach(question => {
          let answer = '';
  
          if (question.type === 'rating') {
              const selectedOption = document.querySelector(`input[name="q${question.id}"]:checked`);
              if (selectedOption) {
                  answer = selectedOption.value;
              }
          } else if (question.type === 'text') {
              const textarea = document.querySelector(`textarea[name="q${question.id}"]`);
              if (textarea) {
                  answer = textarea.value.trim();
              }
          }
  
          // Assign the answer to the feedback object
          feedback[`q${question.id}`] = answer;
  
          // Check if required fields are filled
          if (!question.optional && !answer) {
              allRequiredFieldsFilled = false;
          }
      });
  
      if (!allRequiredFieldsFilled) {
          alert('Please fill out all required fields before submitting.');
          return;
      }
  
      try {
          const currentUser = firebase.auth().currentUser;
          const userEmail = currentUser ? currentUser.email : 'Email not available';
  
          const response = await axios.post('https://us-central1-interview-bot-dev-434810.cloudfunctions.net/interview-bot-backend-dev', {
              action: 'submit_feedback',
              user_id: userId,
              session_id: sessionId,
              email: userEmail,
              feedback: feedback
          });
  
          if (response.data.status === 'Elaborate feedback submitted successfully') {
              alert('Thank you for your feedback! You will recieve your evaluation and recording through email');
              feedbackModal.style.display = 'none';
          } else {
              throw new Error('Failed to submit feedback');
          }
      } catch (error) {
          console.error('Error submitting feedback:', error);
          logError(error, 'submitFeedback');
          alert('There was an error submitting your feedback. Please try again.');
      }
  }
  
  document.addEventListener('DOMContentLoaded', function() {
      const thumbsUp = document.getElementById('thumbsUp');
      const thumbsDown = document.getElementById('thumbsDown');
      const quickFeedbackModal = document.getElementById('quickFeedbackModal');
      const closeQuickFeedback = document.getElementById('closeQuickFeedback');
      const submitQuickFeedback = document.getElementById('submitQuickFeedback');
      const quickFeedbackTitle = document.getElementById('quickFeedbackTitle');
      const quickFeedbackPrompt = document.getElementById('quickFeedbackPrompt');
      const quickFeedbackText = document.getElementById('quickFeedbackText');
  
      let feedbackType = '';
  
      thumbsUp.addEventListener('click', () => openQuickFeedbackModal('positive'));
      thumbsDown.addEventListener('click', () => openQuickFeedbackModal('negative'));
      closeQuickFeedback.addEventListener('click', closeQuickFeedbackModal);
      submitQuickFeedback.addEventListener('click', handleQuickFeedbackSubmit);
  
      function openQuickFeedbackModal(type) {
          feedbackType = type;
          if (type === 'positive') {
              quickFeedbackTitle.textContent = 'Positive Feedback';
              quickFeedbackPrompt.textContent = 'Can you tell us what went well?';
          } else {
              quickFeedbackTitle.textContent = 'Negative Feedback';
              quickFeedbackPrompt.textContent = 'Can you tell us what did not go well?';
          }
          quickFeedbackModal.style.display = 'block';
      }
  
      function closeQuickFeedbackModal() {
          quickFeedbackModal.style.display = 'none';
          quickFeedbackText.value = '';
      }
  
      async function handleQuickFeedbackSubmit() {
          const feedbackText = quickFeedbackText.value.trim();
          if (!feedbackText) {
              alert('Please provide some feedback before submitting.');
              return;
          }
  
          try {
              const response = await axios.post('https://us-central1-interview-bot-dev-434810.cloudfunctions.net/interview-bot-backend-dev', {
                  action: 'submit_quick_feedback',
                  user_id: userId,
                  session_id: sessionId,
                  feedback_type: feedbackType,
                  feedback_text: feedbackText,
                  feedback_context: getFeedbackContext()
              });
  
              if (response.data.status === 'Quick feedback submitted successfully') {
                  alert('Thank you for your feedback!');
                  closeQuickFeedbackModal();
              } else {
                  throw new Error('Failed to submit feedback');
              }
          } catch (error) {
              console.error('Error submitting feedback:', error);
              logError(error, 'handleQuickFeedbackSubmit');
              alert('There was an error submitting your feedback. Please try again.');
          }
      }
  
      function getFeedbackContext() {
          if (document.getElementById('resumeWrapper')?.style?.display !== 'none') {
              return 'Resume Submission';
          } else if (typeof questionNumberForDisplay !== 'undefined' && questionNumberForDisplay > 0) {
              return `Question ${questionNumberForDisplay - 1}`;
          } else if (document.getElementById('evaluationLoadingWrapper')?.style?.display !== 'none') {
              return 'Evaluation';
          } else {
              return 'Unknown';
          }
      }
  });
  
  
  // Error Logging Function
  async function logError(error, functionName) {
      try {
          const userId = auth.currentUser ? auth.currentUser.uid : 'unknown_user';
          const deviceInfo = getDeviceInfo();
          const errorLog = {
              userId: userId,
              functionName: functionName,
              timestamp: firebase.firestore.FieldValue.serverTimestamp(),
              errorMessage: error.message || 'No error message',
              errorStack: error.stack || 'No stack trace',
              device: deviceInfo.device,
              os: deviceInfo.os,
              browser: deviceInfo.browser
          };
  
          // Log to the general 'errorLogs' collection
          await db.collection('errorLogs_interview').add(errorLog);
          console.log('Error logged successfully in errorLogs collection:', errorLog);
  
          // If user is known, also log under the user's document in the 'users' collection
          if (userId !== 'unknown_user') {
              // Create userErrorLog without the userId field
              const { userId, ...userErrorLog } = errorLog; 
              await db.collection('users').doc(userId).collection('errorLogs').add(userErrorLog);
              console.log(`Error logged successfully under user '${userId}' in users/${userId}/errorLogs collection:`, userErrorLog);
          }
      } catch (err) {
          console.error('Failed to log error:', err);
      }
  }
  