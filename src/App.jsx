import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Teacher from './components/Teacher';
import Student from './components/Student';
import './App.css'; // Import the CSS file

function ChooseUserType({ onChoose }) {
  return (
    <div className="container">
      <div className="header">
        <h2>Welcome to the Live Polling System</h2>
        <h5>Made By Rashmiranjan</h5>
        <p>Choose User Type:</p>
      </div>
      <div className="button-container">
        <button onClick={() => onChoose('teacher')}>Teacher</button>
        <button onClick={() => onChoose('student')}>Student</button>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<UserTypeSelection />} />
        <Route path="/teacher" element={<Teacher />} />
        <Route path="/student" element={<Student />} />
      </Routes>
    </Router>
  );
}

function UserTypeSelection() {
  let navigate = useNavigate();
  const handleUserTypeSelection = (type) => {
    navigate(`/${type}`);
  };

  return <ChooseUserType onChoose={handleUserTypeSelection} />;
}

export default App;
