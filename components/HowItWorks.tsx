import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaw, faSearch, faHandshake } from '@fortawesome/free-solid-svg-icons';

const steps = [
  {
    number: 1,
    icon: faPaw,
    title: 'Select Service',
    description: 'Choose from pet walking, sitting, grooming, or vet visit assistance based on your needs.'
  },
  {
    number: 2,
    icon: faSearch,
    title: 'Find Providers',
    description: 'Browse qualified providers in your area, view profiles, ratings, and availability.'
  },
  {
    number: 3,
    icon: faHandshake,
    title: 'Book & Connect',
    description: 'Select your preferred provider, confirm booking details, and get connected instantly.'
  }
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="mb-24 px-4">
      <div className="text-center mb-12">
        <h2 className="font-inter text-4xl md:text-5xl font-bold mb-4 text-text">
          How It Works
        </h2>
        <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto">
          Simple steps to find pet care services
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {steps.map((step, index) => (
          <div
            key={index}
            className="glass-card p-8 text-left"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-accent text-white rounded-full flex items-center justify-center font-inter font-bold text-sm">
                {step.number}
              </div>
              <div className="text-xl text-text-secondary">
                <FontAwesomeIcon icon={step.icon} />
              </div>
            </div>
            <h3 className="font-inter text-xl font-semibold mb-3 text-text">
              {step.title}
            </h3>
            <p className="text-text-secondary leading-relaxed text-sm">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}