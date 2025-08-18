'use client';

import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPaw, 
  faCalendar, 
  faClock, 
  faMapMarkerAlt, 
  faDollarSign,
  faStar,
  faUser,
  faCheckCircle,
  faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

interface Booking {
  id: string;
  serviceType: string;
  duration: number;
  date: string;
  time: string;
  location: string;
  pets: Array<{
    id: string;
    name: string;
    type: string;
    size?: string;
  }>;
  specialInstructions?: string;
  provider: {
    id: string;
    name: string;
    rating: number;
    experience: number;
    services: string[];
    hourlyRate: number;
    availability: boolean;
    distance: number;
  };
  estimatedCost: number;
  status: string;
  createdAt: string;
}

interface BookingDetailProps {
  bookingId: string;
}

export default function BookingDetail({ bookingId }: BookingDetailProps) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined' && bookingId) {
      try {
        const bookings = JSON.parse(localStorage.getItem('BOOKINGS') || '[]');
        const foundBooking = bookings.find((b: Booking) => b.id === bookingId);
        setBooking(foundBooking || null);
      } catch (error) {
        console.error('Error loading booking:', error);
        setBooking(null);
      } finally {
        setLoading(false);
      }
    }
  }, [bookingId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="glass-card p-8 text-center">
          <div className="text-4xl text-accent mb-4">
            <FontAwesomeIcon icon={faPaw} className="animate-pulse" />
          </div>
          <p className="text-text-secondary">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="glass-card p-8 text-center">
          <div className="text-4xl text-red-500 mb-4">
            <FontAwesomeIcon icon={faPaw} />
          </div>
          <h1 className="font-inter text-2xl font-bold mb-4 text-text">
            Booking Not Found
          </h1>
          <p className="text-text-secondary mb-6">
            We couldn't find a booking with ID: {bookingId}
          </p>
          <Link
            href="/book"
            className="btn-glass btn-primary rounded-lg inline-flex items-center gap-2 px-6 py-3"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Book New Service
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-5xl text-green-500 mb-4">
          <FontAwesomeIcon icon={faCheckCircle} />
        </div>
        <h1 className="font-inter text-4xl md:text-5xl font-bold mb-4 text-text">
          Booking Confirmed!
        </h1>
        <p className="text-lg text-text-secondary">
          Your service request has been submitted successfully
        </p>
        <div className="inline-block bg-accent/10 border border-accent/30 rounded-lg px-4 py-2 mt-4">
          <span className="text-accent font-mono font-bold text-lg">
            Booking ID: {booking.id}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Service Details */}
        <div className="glass-card p-8">
          <h2 className="font-inter text-2xl font-semibold mb-6 text-text flex items-center gap-2">
            <FontAwesomeIcon icon={faPaw} className="text-accent" />
            Service Details
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faPaw} className="text-accent w-5" />
              <div>
                <span className="font-medium text-text">Service Type:</span>
                <span className="ml-2 text-text-secondary capitalize">
                  {booking.serviceType.replace('-', ' ')}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faCalendar} className="text-accent w-5" />
              <div>
                <span className="font-medium text-text">Date:</span>
                <span className="ml-2 text-text-secondary">
                  {formatDate(booking.date)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faClock} className="text-accent w-5" />
              <div>
                <span className="font-medium text-text">Time:</span>
                <span className="ml-2 text-text-secondary">
                  {formatTime(booking.time)} ({booking.duration} hour{booking.duration !== 1 ? 's' : ''})
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faMapMarkerAlt} className="text-accent w-5" />
              <div>
                <span className="font-medium text-text">Location:</span>
                <span className="ml-2 text-text-secondary">
                  {booking.location}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faDollarSign} className="text-accent w-5" />
              <div>
                <span className="font-medium text-text">Estimated Cost:</span>
                <span className="ml-2 text-accent font-bold text-lg">
                  ${booking.estimatedCost.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Pets */}
          <div className="mt-6 pt-6 border-t border-white/20">
            <h3 className="font-inter text-lg font-semibold mb-4 text-text">
              Pet{booking.pets.length > 1 ? 's' : ''}
            </h3>
            <div className="space-y-2">
              {booking.pets.map((pet, index) => (
                <div key={pet.id} className="flex items-center gap-2 text-text-secondary">
                  <FontAwesomeIcon icon={faPaw} className="text-accent text-sm" />
                  <span>
                    {pet.name} ({pet.type}{pet.size ? `, ${pet.size}` : ''})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Special Instructions */}
          {booking.specialInstructions && (
            <div className="mt-6 pt-6 border-t border-white/20">
              <h3 className="font-inter text-lg font-semibold mb-2 text-text">
                Special Instructions
              </h3>
              <p className="text-text-secondary">
                {booking.specialInstructions}
              </p>
            </div>
          )}
        </div>

        {/* Provider Details */}
        <div className="glass-card p-8">
          <h2 className="font-inter text-2xl font-semibold mb-6 text-text flex items-center gap-2">
            <FontAwesomeIcon icon={faUser} className="text-accent" />
            Your Provider
          </h2>
          
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faUser} className="text-3xl text-accent" />
            </div>
            <h3 className="font-inter text-xl font-bold text-text mb-2">
              {booking.provider.name}
            </h3>
            <div className="flex items-center justify-center gap-2 text-text-secondary">
              <FontAwesomeIcon icon={faStar} className="text-yellow-500" />
              <span>{booking.provider.rating}</span>
              <span>•</span>
              <span>{booking.provider.experience} years experience</span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <span className="font-medium text-text">Services:</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {booking.provider.services.map((service, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm capitalize"
                  >
                    {service.replace('-', ' ')}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <span className="font-medium text-text">Hourly Rate:</span>
              <span className="ml-2 text-text-secondary">
                ${booking.provider.hourlyRate}/hour
              </span>
            </div>
            
            <div>
              <span className="font-medium text-text">Distance:</span>
              <span className="ml-2 text-text-secondary">
                {booking.provider.distance} miles away
              </span>
            </div>
          </div>

          {/* Status */}
          <div className="mt-6 pt-6 border-t border-white/20">
            <div className="bg-green-100/20 border border-green-300/30 rounded-lg p-4 text-center">
              <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 text-2xl mb-2" />
              <p className="text-green-600 font-medium capitalize">
                Status: {booking.status}
              </p>
              <p className="text-text-secondary text-sm mt-1">
                Your provider will contact you soon to confirm the details
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 text-center">
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/book"
            className="btn-glass btn-secondary rounded-lg inline-flex items-center gap-2 px-6 py-3"
          >
            <FontAwesomeIcon icon={faPaw} />
            Book Another Service
          </Link>
          <Link
            href="/"
            className="btn-glass btn-primary rounded-lg inline-flex items-center gap-2 px-6 py-3"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}