import { ServiceRequest, Provider, ServiceMatch } from '../types';

// Mock provider data for demonstration
const mockProviders: Provider[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    rating: 4.9,
    experience: 5,
    services: ['walking', 'sitting', 'grooming'],
    hourlyRate: 35,
    availability: true,
    distance: 0.8
  },
  {
    id: '2',
    name: 'Mike Chen',
    rating: 4.7,
    experience: 3,
    services: ['walking', 'sitting', 'vet-visit'],
    hourlyRate: 30,
    availability: true,
    distance: 1.2
  },
  {
    id: '3',
    name: 'Emma Rodriguez',
    rating: 4.8,
    experience: 7,
    services: ['grooming', 'sitting'],
    hourlyRate: 45,
    availability: true,
    distance: 2.1
  },
  {
    id: '4',
    name: 'David Wilson',
    rating: 4.6,
    experience: 2,
    services: ['walking', 'vet-visit'],
    hourlyRate: 25,
    availability: true,
    distance: 1.5
  }
];

export function findServiceProviders(serviceRequest: ServiceRequest): ServiceMatch[] {
  const { serviceType, duration, pets } = serviceRequest;
  
  // Filter providers who offer the requested service
  const availableProviders = mockProviders.filter(provider => 
    provider.services.includes(serviceType) && provider.availability
  );
  
  // Calculate matches with estimated costs and scores
  const matches: ServiceMatch[] = availableProviders.map(provider => {
    let baseCost = provider.hourlyRate * duration;
    
    // Adjust cost based on service type
    switch (serviceType) {
      case 'grooming':
        baseCost = pets.length * 60; // Fixed rate per pet for grooming
        break;
      case 'vet-visit':
        baseCost = 75; // Fixed rate for vet visit assistance
        break;
      case 'sitting':
        baseCost = provider.hourlyRate * Math.max(duration, 4); // Minimum 4 hours
        break;
    }
    
    // Calculate match score based on rating, experience, and distance
    const ratingScore = provider.rating / 5 * 40;
    const experienceScore = Math.min(provider.experience / 10, 1) * 30;
    const distanceScore = Math.max(0, (5 - provider.distance) / 5) * 30;
    const matchScore = ratingScore + experienceScore + distanceScore;
    
    // Generate available time slots (mock data)
    const availableSlots = [
      '9:00 AM', '10:00 AM', '2:00 PM', '4:00 PM', '6:00 PM'
    ];
    
    return {
      provider,
      estimatedCost: baseCost,
      matchScore,
      availableSlots
    };
  });
  
  // Sort by match score (highest first)
  return matches.sort((a, b) => b.matchScore - a.matchScore);
}

export function generateServiceSummary(serviceRequest: ServiceRequest, selectedMatch: ServiceMatch): string {
  const { serviceType, duration, date, time, pets } = serviceRequest;
  const { provider, estimatedCost } = selectedMatch;
  
  let text = `🐾 Pet Service Booking Summary\n\n`;
  text += `Service: ${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)}\n`;
  text += `Provider: ${provider.name} (${provider.rating}⭐)\n`;
  text += `Date: ${date}\n`;
  text += `Time: ${time}\n`;
  text += `Duration: ${duration} hour(s)\n`;
  text += `Estimated Cost: $${estimatedCost.toFixed(2)}\n\n`;
  text += `🐕 Pet(s):\n`;
  
  pets.forEach(pet => {
    text += `• ${pet.name} (${pet.type}${pet.size ? `, ${pet.size}` : ''})\n`;
  });
  
  return text;
}