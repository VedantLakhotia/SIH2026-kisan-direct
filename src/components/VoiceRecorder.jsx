import React, { useState, useRef, useEffect, useCallback } from 'react';

const VoiceRecorder = ({ onResult, lang = 'en' }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [language, setLanguage] = useState(lang);
  const [transcript, setTranscript] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);          // Store stream in ref so cleanup works anywhere
  const timerRef = useRef(null);           // Recording duration timer
  const autoStopRef = useRef(null);        // Auto-stop timeout
  const mimeTypeRef = useRef('audio/webm'); // Detected MIME type

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ta', name: 'Tamil' },
    { code: 'te', name: 'Telugu' },
    { code: 'mr', name: 'Marathi' },
    { code: 'bn', name: 'Bengali' },
    { code: 'kn', name: 'Kannada' }
  ];

  // Release microphone hardware immediately
  const releaseMicrophone = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (autoStopRef.current) {
      clearTimeout(autoStopRef.current);
      autoStopRef.current = null;
    }
  }, []);

  // Cleanup on unmount — ensures mic is never left dangling
  useEffect(() => {
    return () => {
      releaseMicrophone();
      mediaRecorderRef.current = null;
    };
  }, [releaseMicrophone]);

  // Detect the best MIME type this browser supports
  const getSupportedMimeType = () => {
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/mp4',
    ];
    for (const type of candidates) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return ''; // let browser pick default
  };

  // Get file extension from MIME type
  const getExtFromMime = (mime) => {
    if (mime.includes('ogg')) return 'ogg';
    if (mime.includes('mp4')) return 'mp4';
    return 'webm';
  };

  const startRecording = async () => {
    setError('');
    setTranscript('');
    setRecordingTime(0);

    // Check if MediaRecorder is supported
    if (typeof MediaRecorder === 'undefined') {
      setError('Your browser does not support audio recording. Please use Chrome or Firefox.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true }
      });
      streamRef.current = stream;

      const mimeType = getSupportedMimeType();
      mimeTypeRef.current = mimeType || 'audio/webm';
      const options = mimeType ? { mimeType } : {};

      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        // Mic is already released by stopRecording() — just process the audio
        const chunks = audioChunksRef.current;
        if (chunks.length === 0) {
          setError('No audio was captured. Please try again.');
          setProcessing(false);
          return;
        }

        const mime = mimeTypeRef.current;
        const blob = new Blob(chunks, { type: mime });

        if (blob.size < 500) {
          setError('Recording was too short. Please speak for at least 2 seconds.');
          setProcessing(false);
          return;
        }

        const ext = getExtFromMime(mime);
        processAudio(blob, ext);
      };

      recorder.onerror = () => {
        releaseMicrophone();
        setIsRecording(false);
        setProcessing(false);
        setError('Recording failed unexpectedly. Please try again.');
      };

      recorder.start();
      setIsRecording(true);

      // Show a live recording timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Auto-stop at 25 seconds (Sarvam REST API only accepts ≤30s)
      autoStopRef.current = setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          stopRecording();
        }
      }, 25000);

    } catch (err) {
      releaseMicrophone();
      if (err.name === 'NotAllowedError') {
        setError('Microphone permission was denied. Please allow mic access in your browser.');
      } else if (err.name === 'NotFoundError') {
        setError('No microphone detected. Please connect a microphone.');
      } else {
        setError('Could not access microphone: ' + err.message);
      }
    }
  };

  const stopRecording = () => {
    // 1. Release microphone hardware IMMEDIATELY so the browser indicator turns off
    releaseMicrophone();

    // 2. Tell MediaRecorder to stop (fires final ondataavailable + onstop)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    // 3. Update UI
    setIsRecording(false);
    setProcessing(true);
  };

  const processAudio = async (audioBlob, ext) => {
    const formData = new FormData();
    // CRITICAL: include filename so multer + Sarvam know the audio format
    formData.append('audio', audioBlob, `recording.${ext}`);

    try {
      const response = await fetch(`http://localhost:4000/api/voice/listing?lang=${language}`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Voice processing failed');
      }

      if (!data.transcript || data.transcript.trim() === '') {
        setTranscript('');
        setError('No speech was detected. Please speak clearly and try again.');
      } else {
        setTranscript(data.transcript);
        if (onResult && data.parsed) {
          onResult(data.parsed);
        }
      }
    } catch (err) {
      console.error('Error processing audio:', err);
      setError(err.message || 'Voice service is unavailable. Please try again or type manually.');
      setTranscript('');
    } finally {
      setProcessing(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const resetState = () => {
    setError('');
    setTranscript('');
    setProcessing(false);
  };

  return (
    <div className="flex flex-col items-center p-6 border rounded-lg bg-green-50 shadow-sm">
      <h3 className="text-lg font-medium text-gray-800 mb-4">🎤 Voice Assistant</h3>

      {/* Language selector */}
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

      {/* Record / Stop button */}
      <div className="relative mb-4">
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={processing}
          className={`w-24 h-24 rounded-full flex items-center justify-center text-white shadow-lg transition-all
            ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'}
            ${processing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {isRecording ? (
            <span className="text-3xl">⏹</span>
          ) : (
            <span className="text-3xl">🎤</span>
          )}
        </button>

        {isRecording && (
          <div className="absolute -inset-1 rounded-full border-4 border-red-400 animate-ping opacity-60 pointer-events-none" />
        )}
      </div>

      {/* Recording timer */}
      {isRecording && (
        <p className="text-red-600 font-mono text-lg mb-1">{formatTime(recordingTime)}</p>
      )}

      {/* Status area */}
      <div className="text-center w-full min-h-[64px]">
        {/* Recording state */}
        {isRecording && (
          <p className="text-red-500 font-medium">🔴 Listening… Click the button to stop</p>
        )}

        {/* Processing state */}
        {processing && (
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mb-2" />
            <p className="text-green-600 font-medium">Processing your voice…</p>
          </div>
        )}

        {/* Idle — instructions */}
        {!isRecording && !processing && !transcript && !error && (
          <div className="text-gray-500 text-sm">
            <p className="mb-1">Tap the mic and speak your listing details</p>
            <p className="text-xs text-gray-400">
              e.g. "I want to sell 100 kilos of Grade A Onions for 30 rupees per kilo"
            </p>
          </div>
        )}

        {/* Error state */}
        {error && !processing && (
          <div className="bg-red-50 border border-red-200 rounded p-3 mt-1">
            <p className="text-red-600 text-sm">❌ {error}</p>
            <button
              type="button"
              onClick={resetState}
              className="mt-2 text-sm text-red-500 underline hover:text-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Success — show transcript */}
        {transcript && !processing && !isRecording && !error && (
          <div className="bg-white border border-green-200 rounded p-3 mt-1">
            <p className="text-xs text-green-600 uppercase tracking-wide mb-1">✅ Transcript</p>
            <p className="text-gray-700 italic">"{transcript}"</p>
            <button
              type="button"
              onClick={resetState}
              className="mt-2 text-xs text-green-600 underline hover:text-green-800"
            >
              Record Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceRecorder;
