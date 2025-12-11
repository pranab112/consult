import React from 'react';
import ReactDOM from 'react-dom/client';

// Debug logging
console.log('main.tsx loaded');
console.log('React:', React);
console.log('ReactDOM:', ReactDOM);

// Simple component with inline styles - no Tailwind
function StudyAbroadApp() {
  console.log('StudyAbroadApp component called');

  const [isLogin, setIsLogin] = React.useState(true);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

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
        <h2 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#4F46E5',
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          StudyAbroad Genius
        </h2>

        <form onSubmit={(e) => {
          e.preventDefault();
          console.log('Form submitted:', { email, password });
          alert('Form submitted!');
        }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '16px',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              fontSize: '16px'
            }}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '16px',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              fontSize: '16px'
            }}
          />

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              background: 'linear-gradient(to right, #2563EB, #4F46E5)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {isLogin ? 'Login' : 'Register'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button
            onClick={() => setIsLogin(!isLogin)}
            style={{
              color: '#4F46E5',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Mount the app
console.log('Looking for root element...');
const container = document.getElementById('root');
console.log('Container found:', !!container);

if (container) {
  console.log('Creating React root...');
  try {
    const root = ReactDOM.createRoot(container);
    console.log('Root created, now rendering...');
    root.render(
      <React.StrictMode>
        <StudyAbroadApp />
      </React.StrictMode>
    );
    console.log('Render call completed');
  } catch (error) {
    console.error('Error during render:', error);
  }
} else {
  console.error('No root element found!');
}