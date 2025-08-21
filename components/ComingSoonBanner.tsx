'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRocket, faBell } from '@fortawesome/free-solid-svg-icons';

export default function ComingSoonBanner() {
  const bannerTitle: string = '🐾 Coming Soon: Real-time Tracking & In-App Messaging!';
  const bannerDescription: string = 'Stay tuned for GPS tracking, live updates, and direct communication with providers!';

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      padding: '1rem',
      marginBottom: '2rem'
    }}>
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 50%, #f1f3f4 100%)',
        border: '2px solid #000000',
        borderRadius: '16px',
        padding: '1.25rem 1.5rem',
        textAlign: 'center',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '50%',
          right: '15px',
          fontSize: '64px',
          color: '#000000',
          transform: 'translateY(-50%) rotate(25deg)',
          pointerEvents: 'none'
        }}>🐾</div>

        <div style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap',
          marginBottom: '0.5rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            backgroundColor: '#000000',
            borderRadius: '50%'
          }}>
            <FontAwesomeIcon
              icon={faRocket}
              style={{
                color: '#ffffff',
                fontSize: '0.875rem',
                transform: 'rotate(-45deg)'
              }}
            />
          </div>
          
          <span style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 700,
            color: '#000000',
            fontSize: '1.125rem',
            letterSpacing: '-0.025em'
          }}>
            {bannerTitle}
          </span>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            backgroundColor: '#f6f6f6',
            border: '2px solid #000000',
            borderRadius: '50%'
          }}>
            <FontAwesomeIcon
              icon={faBell}
              style={{
                color: '#000000',
                fontSize: '0.75rem'
              }}
            />
          </div>
        </div>

        <p style={{
          position: 'relative',
          zIndex: 1,
          margin: '0',
          fontSize: '0.875rem',
          color: '#5e5e5e',
          fontFamily: "'Open Sans', sans-serif",
          fontWeight: 500,
          lineHeight: '1.4'
        }}>
          {bannerDescription}
        </p>
      </div>
    </div>
  );
}