import React from 'react';
import ComingSoonPage from '../components/ComingSoonPage';

const TravelClubPage = () => {
  return (
    <ComingSoonPage
      title="Travel Club"
      description="Explore dog-friendly destinations, hotels, restaurants, and activities around the world"
      tierRequired="premium"
      expectedPhase="Phase 2 - Q3 2024"
      features={[
        'Dog-friendly hotel listings',
        'Restaurant recommendations',
        'Parks & beaches guide',
        'Local attractions',
        'Partner discounts',
        'Travel planning tools'
      ]}
    />
  );
};

export default TravelClubPage;
