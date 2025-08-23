import React, { useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { Layout } from './components/Layout';
import { Navigation } from './components/Navigation';
import { CategoriesPage } from './pages/CategoriesPage';
import { DemandsPage } from './pages/DemandsPage';
import { BusinessPage } from './pages/BusinessPage';
import { BusinessUsersPage } from './pages/BusinessUsersPage';
import { BusinessUserDetailsPage } from './pages/BusinessUserDetailsPage';
import EditBusinessPage from './pages/EditBusinessPage';
import { SnackbarProvider } from './contexts/SnackbarContext';

interface IDemand {
  id: string;
  category: string;
  transcription: string;
  createdAt: string;
  updatedAt: string;
}

function MainPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
   const [category, setCategory] = useState<string>('');
  const [demand, setDemand] = useState<IDemand | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log('Chunk size:', event.data.size);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        console.log('Total blob size:', audioBlob.size);
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(audioUrl);

        // Send audio to backend
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');

        try {
          console.log('Sending file to backend...');
          const response = await fetch('http://localhost:3000/audio', {
            method: 'POST',
            body: formData,
          });
          const result = await response.json();
          console.log('Audio uploaded:', result);
          setDemand(result);
        } catch (error) {
          console.error('Error uploading audio:', error);
        }
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  return (
    <>
      <h1>Audio Recorder</h1>
      <div className="recording-controls">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`record-button ${isRecording ? 'recording' : ''}`}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
      </div>
      {audioUrl && (
        <div className="audio-player">
          <audio src={audioUrl} controls />
        </div>
      )}
      {(demand) && (
        <div className="transcription-results">
          <p className="category">Category: {demand.category}</p>
          <p className="transcription">Transcription: {demand.transcription}</p>
        </div>
      )}
    </>
  );
}

function App() {
  return (
    <SnackbarProvider>
      <Router>
        <div className="App">
          <Layout>
            <Navigation />
            <Routes>
              <Route path="/" element={<MainPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/demands" element={<DemandsPage />} />
              <Route path="/business" element={<BusinessPage />} />
              <Route path="/business/:id/edit" element={<EditBusinessPage />} />
              <Route path="/business-users" element={<BusinessUsersPage />} />
              <Route path="/business-users/:userId" element={<BusinessUserDetailsPage />} />
            </Routes>
          </Layout> 
        </div>
      </Router>
    </SnackbarProvider>
  );
}

export default App; 