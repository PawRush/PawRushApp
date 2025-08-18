export interface Pet {
  id: string;
  name: string;
  type: 'dog' | 'cat' | 'bird' | 'other';
  size?: 'small' | 'medium' | 'large';
  specialNeeds?: string;
}

export interface ServiceRequest {
  serviceType: 'walking' | 'sitting' | 'grooming' | 'vet-visit';
  duration: number;
  date: string;
  time: string;
  location: string;
  pets: Pet[];
  specialInstructions?: string;
}

export interface Provider {
  id: string;
  name: string;
  rating: number;
  experience: number;
  services: string[];
  hourlyRate: number;
  availability: boolean;
  distance: number;
}

export interface ServiceMatch {
  provider: Provider;
  estimatedCost: number;
  matchScore: number;
  availableSlots: string[];
}