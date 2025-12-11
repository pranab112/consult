import React from 'react';

function TestApp() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(to bottom right, #EBF8FF, #E0E7FF)',
      fontFamily: 'system-ui'
    }}>
      <div style={{
        background: 'white',
        padding: '32px',
        borderRadius: '16px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        maxWidth: '400px',
        width: '100%'
      }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#4F46E5',
          textAlign: 'center',
          marginBottom: '16px'
        }}>
          React is Working! ✅
        </h1>
        <p style={{ textAlign: 'center', color: '#6B7280' }}>
          If you can see this styled content, React is rendering properly.
        </p>
      </div>
    </div>
  );
}

export default TestApp;