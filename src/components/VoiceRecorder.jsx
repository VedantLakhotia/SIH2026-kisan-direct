import React, { useState, useRef } from 'react';

const VoiceRecorder = ({ onResult, lang = 'en' }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [language, setLanguage] = useState(lang);
  const [transcript, setTranscript] = useState('');
  const [processing, setProcessing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ta', name: 'Tamil' },
    { code: 'te', name: 'Telugu' },
    { code: 'mr', name: 'Marathi' },
    { code: 'bn', name: 'Bengali' },
    { code: 'kn', name: 'Kannada' }
  ];

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setProcessing(true);
    }
  };

  const processAudio = async (audioBlob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob);

    try {
      const response = await fetch(`http://localhost:4000/api/voice/listing?lang=${language}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Voice processing failed');
      
      const data = await response.json();
      setTranscript(data.transcript);
     if (onResult) onResult(data.parsed || data);
    } catch (error) {
      console.error('Error processing audio:', error);
      alert('Voice service is currently unavailable. Please type your listing details.');
      setTranscript('');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-center p-6 border rounded-lg bg-green-50 shadow-sm">
      <h3 className="text-lg font-medium text-gray-800 mb-4">Voice Assistant</h3>
      
      <div className="mb-4 flex items-center space-x-2">
        <label htmlFor="lang-select" className="text-sm text-gray-600">Language:</label>
        <select 
          id="lang-select"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="border border-gray-300 rounded p-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-green-500"
          disabled={isRecording || processing}
        >
          {languages.map(l => (
            <option key={l.code} value={l.code}>{l.name}</option>
          ))}
        </select>
      </div>

      <div className="relative mb-6">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={processing}
          className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-lg transition-all
            ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'} 
            ${processing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <span className="text-3xl">🎤</span>
        </button>
        {isRecording && (
          <div className="absolute top-0 left-0 w-20 h-20 rounded-full border-4 border-red-400 animate-ping opacity-75"></div>
        )}
      </div>

      <div className="text-center h-12">
        {processing && <p className="text-green-600 animate-pulse font-medium">Processing your voice...</p>}
        {isRecording && <p className="text-red-500 font-medium">Listening... Click to stop</p>}
        {!isRecording && !processing && !transcript && (
          <p className="text-gray-500 text-sm">Click to speak your listing details<br/>(e.g., "I want to sell 100kg of Grade A Onions for 30 rupees")</p>
        )}
        {transcript && !processing && !isRecording && (
          <div className="mt-2">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Transcript</p>
            <p className="text-gray-700 italic">"{transcript}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceRecorder;
