'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaw, faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect } from 'react';

export default function Header() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    if (typeof window !== 'undefined') {
      const element = document.getElementById(sectionId);
      if (element) {
        const headerHeight = 96; // Approximate header height
        const targetPosition = element.offsetTop - headerHeight - 20;
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-secondary">
      <nav className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2">
            <FontAwesomeIcon 
              icon={faPaw} 
              className="text-xl text-accent" 
            />
            <span className="font-inter text-xl font-bold text-text">PawDash</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {pathname === '/' ? (
              <>
                <button
                  onClick={() => scrollToSection('features')}
                  className="text-text hover:text-accent transition-colors duration-300 font-medium"
                >
                  Features
                </button>
                <button
                  onClick={() => scrollToSection('how-it-works')}
                  className="text-text hover:text-accent transition-colors duration-300 font-medium"
                >
                  How It Works
                </button>
                <Link
                  href="/book"
                  className="btn-glass btn-primary rounded-lg px-6 py-2"
                >
                  Find Providers
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/"
                  className="text-text hover:text-accent transition-colors duration-300 font-medium"
                >
                  Home
                </Link>
                <Link
                  href="/book"
                  className="btn-glass btn-primary rounded-lg px-6 py-2"
                >
                  Book Service
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-text hover:text-accent transition-colors duration-300"
          >
            <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} className="text-xl" />
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-white/20">
            <div className="flex flex-col gap-4">
              {pathname === '/' ? (
                <>
                  <button
                    onClick={() => scrollToSection('features')}
                    className="text-left text-text hover:text-accent transition-colors duration-300 font-medium"
                  >
                    Features
                  </button>
                  <button
                    onClick={() => scrollToSection('how-it-works')}
                    className="text-left text-text hover:text-accent transition-colors duration-300 font-medium"
                  >
                    How It Works
                  </button>
                  <Link
                    href="/book"
                    className="btn-glass btn-primary rounded-full text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Find Providers
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/"
                    className="text-text hover:text-accent transition-colors duration-300 font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Home
                  </Link>
                  <Link
                    href="/book"
                    className="btn-glass btn-primary rounded-full text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Book Service
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}