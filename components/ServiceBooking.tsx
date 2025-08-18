'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faTrash,
  faSearch,
  faPaw,
  faDollarSign,
  faClock,
  faCheck,
  faStar,
  faMapMarkerAlt
} from '@fortawesome/free-solid-svg-icons';
import { ServiceRequest, Pet, ServiceMatch } from '../types';
import { findServiceProviders, generateServiceSummary } from '../lib/calculations';

export default function ServiceBooking() {
  const router = useRouter();
  const [serviceType, setServiceType] = useState<'walking' | 'sitting' | 'grooming' | 'vet-visit'>('walking');
  const [duration, setDuration] = useState('1');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [pets, setPets] = useState<Pet[]>([
    { id: '1', name: '', type: 'dog' }
  ]);
  const [results, setResults] = useState<ServiceMatch[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<ServiceMatch | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [bookingRequested, setBookingRequested] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  const validateInputs = (): string[] => {
    const errors: string[] = [];

    if (!duration || parseFloat(duration) <= 0) {
      errors.push('Duration must be greater than 0');
    }

    if (!date) {
      errors.push('Date is required');
    }

    if (!time) {
      errors.push('Time is required');
    }

    if (!location.trim()) {
      errors.push('Location is required');
    }

    const validPets = pets.filter(p => p.name.trim());
    if (validPets.length === 0) {
      errors.push('At least one pet is required');
    }

    return errors;
  };

  const handleSearch = () => {
    const validationErrors = validateInputs();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setResults([]);
      return;
    }

    setErrors([]);

    const serviceRequest: ServiceRequest = {
      serviceType,
      duration: parseFloat(duration),
      date,
      time,
      location,
      pets: pets.filter(p => p.name.trim()),
      specialInstructions: specialInstructions.trim() || undefined
    };

    try {
      const matches = findServiceProviders(serviceRequest);
      setResults(matches);
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Search error']);
      setResults([]);
    }
  };

  const generateBookingId = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleRequest = () => {
    if (!selectedProvider) return;

    const newBookingId = generateBookingId();

    const booking = {
      id: newBookingId,
      serviceType,
      duration: parseFloat(duration),
      date,
      time,
      location,
      pets: pets.filter(p => p.name.trim()),
      specialInstructions: specialInstructions.trim() || undefined,
      provider: selectedProvider.provider,
      estimatedCost: selectedProvider.estimatedCost,
      status: 'requested',
      createdAt: new Date().toISOString()
    };

    try {
      // Get existing bookings from localStorage
      const existingBookings = JSON.parse(localStorage.getItem('BOOKINGS') || '[]');

      // Add new booking
      existingBookings.push(booking);

      // Save back to localStorage
      localStorage.setItem('BOOKINGS', JSON.stringify(existingBookings));

      setBookingId(newBookingId);
      setBookingRequested(true);

      // Redirect to confirmation page after a short delay
      setTimeout(() => {
        router.push(`/confirmation?id=${newBookingId}`);
      }, 1500);

    } catch (error) {
      console.error('Failed to save booking:', error);
    }
  };

  const addPet = () => {
    setPets([...pets, { id: Date.now().toString(), name: '', type: 'dog' }]);
  };

  const removePet = (id: string) => {
    setPets(pets.filter(p => p.id !== id));
  };

  const updatePet = (id: string, field: keyof Pet, value: any) => {
    setPets(pets.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-inter text-3xl font-bold mb-2 text-text">
          Book pet care
        </h1>
        <p className="text-text-secondary">
          Find trusted providers in your area
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Service Request Form */}
        <div className="glass-card p-6">
          <h2 className="font-inter text-xl font-semibold mb-6 text-text">
            Service Details
          </h2>

          {/* Service Type */}
          <div className="mb-4">
            <label className="block text-text font-medium mb-3 text-sm">
              What do you need?
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'walking', label: 'Dog Walking' },
                { value: 'sitting', label: 'Pet Sitting' },
                { value: 'grooming', label: 'Grooming' },
                { value: 'vet-visit', label: 'Vet Visit' }
              ].map((service) => (
                <button
                  key={service.value}
                  type="button"
                  onClick={() => setServiceType(service.value as any)}
                  className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                    serviceType === service.value
                      ? 'bg-accent text-white border-accent'
                      : 'bg-white border-secondary text-text hover:border-accent'
                  }`}
                >
                  {service.label}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div className="mb-4">
            <label className="block text-text font-medium mb-2 text-sm">
              Hours
            </label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full p-3 glass-card border-0 text-text placeholder-text-secondary/60 focus:ring-2 focus:ring-accent focus:outline-none rounded-lg"
              placeholder="1.0"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-text font-medium mb-2 text-sm">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-3 glass-card border-0 text-text focus:ring-2 focus:ring-accent focus:outline-none rounded-lg"
              />
            </div>
            <div>
              <label className="block text-text font-medium mb-2 text-sm">
                Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full p-3 glass-card border-0 text-text focus:ring-2 focus:ring-accent focus:outline-none rounded-lg"
              />
            </div>
          </div>

          {/* Location */}
          <div className="mb-6">
            <label className="block text-text font-medium mb-2 text-sm">
              Where?
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full p-3 glass-card border-0 text-text placeholder-text-secondary/60 focus:ring-2 focus:ring-accent focus:outline-none rounded-lg"
              placeholder="Enter your address or neighborhood"
            />
          </div>

          {/* Pets */}
          <div className="mb-6">
            <h3 className="font-inter text-xl font-semibold mb-4 text-text">
              Your Pets
            </h3>

            {pets.map((pet, index) => (
              <div key={pet.id} className="mb-4 p-4 glass-card rounded-lg">
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <input
                    type="text"
                    value={pet.name}
                    onChange={(e) => updatePet(pet.id, 'name', e.target.value)}
                    className="p-2 glass-card border-0 text-text placeholder-text-secondary/60 focus:ring-2 focus:ring-accent focus:outline-none rounded"
                    placeholder={`Pet ${index + 1} name`}
                  />
                  <select
                    value={pet.type}
                    onChange={(e) => updatePet(pet.id, 'type', e.target.value)}
                    className="p-2 glass-card border-0 text-text focus:ring-2 focus:ring-accent rounded"
                  >
                    <option value="dog">Dog</option>
                    <option value="cat">Cat</option>
                    <option value="bird">Bird</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <select
                    value={pet.size || ''}
                    onChange={(e) => updatePet(pet.id, 'size', e.target.value || undefined)}
                    className="flex-1 p-2 glass-card border-0 text-text focus:ring-2 focus:ring-accent rounded text-sm"
                  >
                    <option value="">Size (optional)</option>
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                  {pets.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePet(pet.id)}
                      className="p-2 text-red-500 hover:text-red-700 transition-colors"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {pets.length < 5 && (
              <button
                type="button"
                onClick={addPet}
                className="w-full p-3 glass-card hover:bg-white/20 text-accent border-2 border-dashed border-accent/30 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
              >
                <FontAwesomeIcon icon={faPlus} />
                Add Pet
              </button>
            )}
          </div>

          {/* Special Instructions */}
          <div className="mb-6">
            <label className="block text-text font-medium mb-2">
              Special Instructions
            </label>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              className="w-full p-3 glass-card border-0 text-text placeholder-text-secondary/60 focus:ring-2 focus:ring-accent focus:outline-none rounded-lg"
              rows={3}
              placeholder="Any special needs, preferences, or instructions for the provider..."
            />
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="mb-6 p-4 bg-red-100/20 border border-red-300/30 rounded-lg">
              <ul className="text-red-600 text-sm">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Search Button */}
          <button
            onClick={handleSearch}
            className="w-full btn-glass btn-primary rounded-lg text-lg py-4 font-medium"
          >
            Find Providers
          </button>
        </div>

        {/* Results */}
        <div className="glass-card p-6">
          <h2 className="font-inter text-xl font-semibold mb-4 text-text">
            Available Providers
          </h2>

          {results.length > 0 ? (
            <div>
              <div className="space-y-4 mb-6">
                {results.map((match, index) => (
                  <div
                    key={match.provider.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedProvider?.provider.id === match.provider.id
                      ? 'border-accent bg-accent/5'
                      : 'border-secondary hover:border-accent bg-white'
                      }`}
                    onClick={() => setSelectedProvider(match)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-text mb-1">{match.provider.name}</h3>
                        <div className="flex items-center gap-3 text-sm text-text-secondary mb-2">
                          <div className="flex items-center gap-1">
                            <FontAwesomeIcon icon={faStar} className="text-yellow-500" />
                            <span>{match.provider.rating}</span>
                          </div>
                          <span>{match.provider.experience} years</span>
                          <span>{match.provider.distance} mi away</span>
                        </div>
                        <div className="text-xs text-text-secondary">
                          {match.provider.services.join(' • ')}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-lg font-bold text-text">
                          ${match.estimatedCost.toFixed(2)}
                        </div>
                        <div className="text-xs text-text-secondary">
                          estimated
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedProvider && (
                <button
                  onClick={handleRequest}
                  disabled={bookingRequested}
                  className={`w-full rounded-lg py-4 font-medium text-lg transition-colors ${bookingRequested
                    ? 'bg-secondary text-text-secondary cursor-not-allowed'
                    : 'btn-glass btn-primary'
                    }`}
                >
                  {bookingRequested
                    ? `Booking confirmed! ID: ${bookingId}`
                    : 'Book now'
                  }
                </button>
              )}
            </div>
          ) : (
            <div className="text-center text-text-secondary py-12">
              <p className="text-sm">Enter service details and click "Find Providers" to see available options</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}