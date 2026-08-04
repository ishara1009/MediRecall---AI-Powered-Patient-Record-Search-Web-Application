import React from 'react';
import './Loader.css';

export default function Loader({ message = 'Loading...' }) {
  return (
    <div className="loader-container">
      <div className="loader-ring">
        <div></div><div></div><div></div><div></div>
      </div>
      <p className="loader-text">{message}</p>
    </div>
  );
}
