'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRocket, faBell } from '@fortawesome/free-solid-svg-icons';

export default function ComingSoonBanner() {
  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      padding: '1rem',
      marginBottom: '2rem'
    }}>
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.15) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        borderRadius: '16px',
        padding: '1rem 1.5rem',
        textAlign: 'center',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(37, 99, 235, 0.1)',
        animation: 'fadeInDown 0.6s ease-out'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap'
        }}>
          <FontAwesomeIcon 
            icon={faRocket} 
            style={{ 
              color: '#2563eb', 
              fontSize: '1.25rem',
              animation: 'pulse 2s infinite'
            }} 
          />
          <span style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600,
            color: '#1e3a8a',
            fontSize: '1.125rem'
          }}>
            🐾 Coming Soon: Real-time Tracking & In-App Messaging!
          </span>
          <FontAwesomeIcon 
            icon={faBell} 
            style={{ 
              color: '#2563eb', 
              fontSize: '1rem',
              opacity: 0.8
            }} 
          />
        </div>
        <p style={{
          margin: '0.5rem 0 0 0',
          fontSize: '0.875rem',
          color: '#3b82f6',
          opacity: 0.9
        }}>
          Stay tuned for GPS tracking, live updates, and direct communication with providers!
        </p>
      </div>
    </div>
  );
}
