import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaw } from '@fortawesome/free-solid-svg-icons';
import { faTwitter, faFacebook, faInstagram } from '@fortawesome/free-brands-svg-icons';

export default function Footer() {
  return (
    <footer className="mt-16 px-4 pb-8 border-t border-secondary">
      <div className="max-w-6xl mx-auto py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faPaw} className="text-lg text-accent" />
            <span className="font-inter text-lg font-bold text-text">PawDash</span>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-8 justify-center">
            <Link href="#" className="text-text-secondary hover:text-text text-sm">
              Privacy Policy
            </Link>
            <Link href="#" className="text-text-secondary hover:text-text text-sm">
              Terms of Service
            </Link>
            <Link href="#" className="text-text-secondary hover:text-text text-sm">
              Contact
            </Link>
          </div>

          {/* Copyright */}
          <p className="text-text-secondary text-sm">
            &copy; 2025 PawDash
          </p>
        </div>
      </div>
    </footer>
  );
}