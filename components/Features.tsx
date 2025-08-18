import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCheck, faClock, faMobileAlt } from '@fortawesome/free-solid-svg-icons';

const features = [
  {
    icon: faUserCheck,
    title: 'Trusted Providers',
    description: 'All pet care providers are vetted, background-checked, and highly rated by the community.'
  },
  {
    icon: faClock,
    title: 'On-Demand Service',
    description: 'Book services instantly or schedule in advance. Available 24/7 for emergency pet care needs.'
  },
  {
    icon: faMobileAlt,
    title: 'Mobile Friendly',
    description: 'Use anywhere, anytime with our responsive design that works on all devices.'
  }
];

export default function Features() {
  return (
    <section id="features" className="mb-24 px-4">
      <div className="text-center mb-12">
        <h2 className="font-inter text-4xl md:text-5xl font-bold mb-4 text-text">
          Key Features
        </h2>
        <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto">
          Everything you need for reliable pet care services
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {features.map((feature, index) => (
          <div
            key={index}
            className="glass-card p-8 text-left"
          >
            <div className="text-2xl text-accent mb-4">
              <FontAwesomeIcon icon={feature.icon} />
            </div>
            <h3 className="font-inter text-xl font-semibold mb-3 text-text">
              {feature.title}
            </h3>
            <p className="text-text-secondary leading-relaxed text-sm">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}