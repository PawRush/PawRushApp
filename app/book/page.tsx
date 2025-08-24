import { Metadata } from 'next';
import ServiceBooking from '../../components/ServiceBooking';

export const metadata: Metadata = {
  title: 'PawRush - Find Pet Care Providers',
  description: 'Find and book trusted pet care providers in your area. Connect with qualified professionals for walking, sitting, grooming, and vet visits.',
};

export default function SplitPage() {
  return <ServiceBooking />;
}