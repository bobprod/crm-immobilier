import { useState } from 'react';

export default function HomePage() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '3rem',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem', fontWeight: 'bold' }}>
          ✅ CRM Immobilier Frontend
        </h1>
        <p style={{ fontSize: '1.5rem', marginBottom: '2rem', opacity: 0.9 }}>
          Le bug JSX est RÉSOLU! 🎉
        </p>
        
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.2)', 
          borderRadius: '15px', 
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
            Test de Réactivité React:
          </p>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            {count}
          </p>
          <button 
            onClick={() => setCount(count + 1)}
            style={{
              background: '#10b981',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              fontSize: '1.1rem',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'transform 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Incrémenter
          </button>
        </div>

        <div style={{ 
          background: 'rgba(16, 185, 129, 0.2)', 
          borderRadius: '10px', 
          padding: '1.5rem',
          marginTop: '1rem'
        }}>
          <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>
            ✓ React 18.3.1 + Next.js 14.2.5<br/>
            ✓ JSX Runtime: Fonctionnel<br/>
            ✓ Server: http://localhost:3003<br/>
            ✓ Backend API: http://localhost:3000/api
          </p>
        </div>
      </div>
    </div>
  );
}
