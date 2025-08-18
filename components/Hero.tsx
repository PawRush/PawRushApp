'use client';

import Link from 'next/link';

export default function Hero() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="font-inter text-5xl md:text-6xl font-bold text-text mb-6 leading-tight">
          Pet care on demand
        </h1>
        <p className="text-xl md:text-2xl text-text-secondary mb-12 max-w-2xl mx-auto leading-relaxed">
          Trusted providers for walking, sitting, grooming, and vet visits
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
          <Link
            href="/book"
            className="btn-glass btn-primary w-full sm:w-auto text-lg px-8 py-4 rounded-lg font-medium"
          >
            Find providers
          </Link>
          <Link
            href="#features"
            className="btn-glass btn-secondary w-full sm:w-auto text-lg px-8 py-4 rounded-lg font-medium"
          >
            How it works
          </Link>
        </div>
        
        <div className="mt-16 pt-16 border-t border-secondary">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-text mb-2">10k+</div>
              <div className="text-text-secondary">Happy pets</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-text mb-2">500+</div>
              <div className="text-text-secondary">Trusted providers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-text mb-2">24/7</div>
              <div className="text-text-secondary">Available</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}