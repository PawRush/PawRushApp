import ComingSoonBanner from '../components/ComingSoonBanner';
import Hero from '../components/Hero';
import Features from '../components/Features';
import HowItWorks from '../components/HowItWorks';
import CTA from '../components/CTA';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
      <ComingSoonBanner />
      <Hero />
      <Features />
      <HowItWorks />
      <CTA />
      <Footer />
    </div>
  );
}