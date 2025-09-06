import React from 'react';

function SimpleApp() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>LSAT Study Tool - Simple Test</h1>
      <p>If you can see this message, React is working!</p>
      <div style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0', borderRadius: '5px' }}>
        <h2>Quick Debug Info:</h2>
        <p>React Version: {React.version}</p>
        <p>Current Time: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
}

export default SimpleApp;