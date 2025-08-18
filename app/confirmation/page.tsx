'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import BookingDetail from '../../components/BookingDetail';

export default function BookingsPage() {
  const searchParams = useSearchParams();
  const [bookingId, setBookingId] = useState<string | null>(null);

  useEffect(() => {
    // Get booking ID from URL hash or search params
    const id = searchParams.get('id') || window.location.hash.replace('#', '');
    setBookingId(id);
  }, [searchParams]);

  if (!bookingId) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="glass-card p-8 text-center">
          <h1 className="font-inter text-2xl font-bold mb-4 text-text">
            No Booking ID Provided
          </h1>
          <p className="text-text-secondary">
            Please provide a booking ID to view details.
          </p>
        </div>
      </div>
    );
  }

  return <BookingDetail bookingId={bookingId} />;
}