import React from 'react';

const Loading = ({ message = 'Loading...' }) => {
  return (
    <div className="loading-spinner">
      <div className="spinner"></div>
      {message && <p style={{ marginTop: '1rem', color: '#64748b' }}>{message}</p>}
    </div>
  );
};

export default Loading;
