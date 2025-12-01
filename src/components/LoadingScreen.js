import React from 'react';
import './LoadingScreen.css';

const LoadingScreen = ({ message = "Conectando ao Firebase..." }) => {
  return (
    <div className="loading-screen">
      <div className="loading-container">
        <div className="firebase-loader">
          <div className="flame"></div>
          <div className="flame"></div>
          <div className="flame"></div>
          <div className="flame"></div>
        </div>
        <h3>🔥 {message}</h3>
        <p className="text-muted">Autenticando anonimamente...</p>
        <div className="progress mt-3">
          <div 
            className="progress-bar progress-bar-striped progress-bar-animated" 
            style={{ width: '75%' }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;