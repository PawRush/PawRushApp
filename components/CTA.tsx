import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaw, faArrowRight } from '@fortawesome/free-solid-svg-icons';

export default function CTA() {
  return (
    <section className="mb-24 px-4">
      <div className="glass-card glass-card-hover max-w-4xl mx-auto p-16 text-center animate-fadeInUp">

        <h2 className="font-inter text-3xl md:text-4xl font-bold mb-4 text-text">
          Ready to Book Pet Care?
        </h2>
        <p className="text-lg md:text-xl text-text-secondary mb-8 max-w-2xl mx-auto leading-relaxed">
          Join thousands of pet owners who trust our vetted providers for reliable, on-demand pet care.
        </p>
        <Link
          href="/book"
          className="btn-glass btn-primary rounded-lg flex items-center gap-2 text-lg px-8 py-4 mx-auto w-fit"
        >
          <FontAwesomeIcon icon={faArrowRight} />
          Find Providers Now
        </Link>
      </div>
    </section>
  );
}