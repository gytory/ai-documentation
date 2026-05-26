import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Documents from './pages/Documents';
import Chat from './pages/Chat';
import Login from './pages/Login';
import Register from './pages/Register';
import Admin from './pages/Admin';
import './styles/theme.css';
import ManageDocuments from './pages/ManageDocuments';
import DocumentViewer from './pages/DocumentViewer';

const isAuthenticated = () => !!localStorage.getItem('accessToken');

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Navbar />
        <div className="container">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={isAuthenticated() ? <Documents /> : <Navigate to="/login" />} />
            <Route path="/documents/:id" element={isAuthenticated() ? <DocumentViewer /> : <Navigate to="/login" />} />
            <Route path="/chat" element={isAuthenticated() ? <Chat /> : <Navigate to="/login" />} />
            <Route path="/documents/manage" element={isAuthenticated() ? <ManageDocuments /> : <Navigate to="/login" />} />
            <Route path="/admin" element={isAuthenticated() ? <Admin /> : <Navigate to="/login" />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;