/**
 * Main entry point for the AI Chess Battle application
 * This file initializes the React application and renders it to the DOM
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Create root element for React 18's new createRoot API
// This provides better performance and error handling compared to legacy render
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
); 

// Render. the application with StrictMode enabled
// StrictMode helps identify potential problems in the application during development
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Optional: Measure and report performance metrics
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log)) 
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();