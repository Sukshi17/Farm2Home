import { useState, useRef } from 'react';
import { FiMic, FiMicOff } from 'react-icons/fi';

export default function VoiceInput({ value, onChange, placeholder, className }) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onChange(value ? value + ' ' + transcript : transcript);
      setListening(false);
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setListening(false);
  };

  return (
    <div className="voice-input-wrapper">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className || 'form-control'}
        style={{ paddingRight: '52px' }}
      />
      <button
        type="button"
        className={`voice-btn ${listening ? 'listening' : ''}`}
        onClick={listening ? stopListening : startListening}
        title={listening ? 'Stop listening' : 'Voice input'}
      >
        {listening ? <FiMicOff size={16} /> : <FiMic size={16} />}
      </button>
    </div>
  );
}
