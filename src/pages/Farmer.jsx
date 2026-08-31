import { useState, useRef } from 'react';

export default function Farmer() {
  const [recording, setRecording] = useState(false);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder.current = new MediaRecorder(stream);
    audioChunks.current = [];

    mediaRecorder.current.ondataavailable = (e) => audioChunks.current.push(e.data);
    mediaRecorder.current.onstop = uploadAudio;

    mediaRecorder.current.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorder.current.stop();
    setRecording(false);
  };

  const uploadAudio = async () => {
    const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('audio', audioBlob);

    const res = await fetch('http://localhost:4000/api/voice-listing', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    console.log('Parsed listing:', data); // {crop: "Tomato", quantity: 50, price: 20}
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Farmer Dashboard</h1>
      <button
        onClick={recording ? stopRecording : startRecording}
        className={`px-4 py-2 rounded text-white ${recording ? 'bg-red-600' : 'bg-green-600'}`}
      >
        {recording ? 'Stop Recording' : '🎤 Record Listing'}
      </button>
    </div>
  );
}