import type { Metadata } from 'next';
import './globals.css';
import '../lib/fontawesome';
import Header from '../components/Header';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaw } from '@fortawesome/free-solid-svg-icons';

export const metadata: Metadata = {
  title: 'PawRush - Connect with Trusted Pet Care Providers',
  description: 'Find qualified pet care providers for walking, sitting, grooming, and vet visits. Connect with trusted professionals in your area.',
  keywords: 'pet care, dog walking, pet sitting, pet grooming, veterinary visits, pet services',
  authors: [{ name: 'PawRush Team' }],
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" style={{ scrollBehavior: 'smooth' }}>
      <body style={{ 
        fontFamily: "'Open Sans', sans-serif",
        color: '#000000',
        background: '#ffffff',
        minHeight: '100vh',
        overflowX: 'hidden',
        margin: 0,
        padding: 0
      }}>
        {/* Background Paws */}
        <div className="bg-shapes">
          <div className="shape shape-1">
            <FontAwesomeIcon icon={faPaw} />
          </div>
          <div className="shape shape-2">
            <FontAwesomeIcon icon={faPaw} />
          </div>
          <div className="shape shape-3">
            <FontAwesomeIcon icon={faPaw} />
          </div>
        </div>
        
        <Header />
        <main style={{ paddingTop: '6rem' }}>
          {children}
        </main>
      </body>
    </html>
  );
}