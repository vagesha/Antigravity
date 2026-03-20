const chatForm = document.getElementById('chat-form');
const textInput = document.getElementById('text-input');
const mediaInput = document.getElementById('media-input');
const filePreviewContainer = document.getElementById('file-preview-container');
const fileNameDisplay = document.getElementById('file-name');
const removeFileBtn = document.getElementById('remove-file-btn');
const chatContainer = document.getElementById('chat-container');
const sendBtn = document.getElementById('send-btn');
const voiceBtn = document.getElementById('voice-btn');

let isRecording = false;

// Speech Recognition Setup
window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
if (window.SpeechRecognition) {
  recognition = new window.SpeechRecognition();
  recognition.interimResults = true;
  recognition.continuous = false;

  recognition.onresult = (e) => {
    const transcript = Array.from(e.results)
      .map(result => result[0])
      .map(result => result.transcript)
      .join('');
    textInput.value = transcript;
  };

  recognition.onerror = (e) => {
    console.error('Speech recognition error', e.error);
    stopRecording();
  };

  recognition.onend = () => {
    stopRecording();
  };
} else {
  voiceBtn.style.display = 'none'; // Not supported
}

voiceBtn.addEventListener('click', () => {
  if (!recognition) return;
  if (isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
});

function startRecording() {
  recognition.start();
  isRecording = true;
  voiceBtn.classList.add('recording');
  textInput.placeholder = "Listening...";
}

function stopRecording() {
  recognition.stop();
  isRecording = false;
  voiceBtn.classList.remove('recording');
  textInput.placeholder = "Type situation or attach media...";
}

mediaInput.addEventListener('change', () => {
  if (mediaInput.files.length > 0) {
    fileNameDisplay.textContent = mediaInput.files[0].name;
    filePreviewContainer.classList.remove('hidden');
  } else {
    filePreviewContainer.classList.add('hidden');
  }
});

removeFileBtn.addEventListener('click', () => {
  mediaInput.value = "";
  filePreviewContainer.classList.add('hidden');
});

function addMessage(text, isUser = false, isHtml = false) {
  const msgDiv = document.createElement('div');
  msgDiv.classList.add('message', isUser ? 'user' : 'bot');
  
  // Remove welcome message on first usage
  const welcome = document.querySelector('.welcome-message');
  if (welcome) welcome.remove();

  if (isHtml) {
    msgDiv.innerHTML = text; // Used for markdown output
  } else {
    msgDiv.textContent = text;
  }
  
  chatContainer.appendChild(msgDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function addLoader() {
  const loader = document.createElement('div');
  loader.className = 'loader';
  loader.id = 'loading';
  loader.innerHTML = '<span></span><span></span><span></span>';
  chatContainer.appendChild(loader);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function removeLoader() {
  const loader = document.getElementById('loading');
  if (loader) loader.remove();
}

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const text = textInput.value.trim();
  const file = mediaInput.files[0];
  
  if (!text && !file) return;

  // Display user message
  let displayMsg = text;
  if (file) displayMsg += ` 📎 [Attached: ${file.name}]`;
  addMessage(displayMsg, true);

  // Prepare FormData for API
  const formData = new FormData();
  formData.append('message', text);
  if (file) formData.append('media', file);

  // Reset Input
  textInput.value = '';
  mediaInput.value = '';
  filePreviewContainer.classList.add('hidden');
  sendBtn.disabled = true;

  addLoader();

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    removeLoader();

    if (data.error) {
      addMessage(`⚠️ System Error: ${data.error}`);
    } else {
      // Convert markdown to HTML safely using browser library marked.js
      const htmlResponse = marked.parse(data.response);
      addMessage(htmlResponse, false, true);
    }
  } catch (err) {
    removeLoader();
    console.error(err);
    addMessage("⚠️ Critical Connection Failure. Try again.");
  } finally {
    sendBtn.disabled = false;
  }
});
