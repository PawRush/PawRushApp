import type { Metadata } from 'next';
import './globals.css';
import '../lib/fontawesome';
import Header from '../components/Header';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaw } from '@fortawesome/free-solid-svg-icons';

export const metadata: Metadata = {
  title: 'PawRush 🐾 | Premium Pet Care Services Near You',
  description: 'Discover trusted pet care professionals in your neighborhood. Book dog walking, pet sitting, grooming, and veterinary assistance—all in one place. Your pet deserves the best!',
  keywords: 'pet care, dog walking, pet sitting, pet grooming, veterinary visits, pet services, local pet care, trusted pet sitters, professional dog walkers',
  authors: [{ name: 'PawRush Team' }],
  viewport: 'width=device-width, initial-scale=1',
  openGraph: {
    title: 'PawRush 🐾 | Premium Pet Care Services Near You',
    description: 'Connect with trusted pet care professionals for walking, sitting, grooming, and vet visits.',
    type: 'website',
  },
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