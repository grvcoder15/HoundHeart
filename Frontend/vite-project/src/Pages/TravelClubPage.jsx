import React from 'react';
import ComingSoonPage from '../components/ComingSoonPage';

const TravelClubPage = () => {
  return (
    <ComingSoonPage
      title="Partner Discounts"
      description="Exclusive discounted travel partnerships for HoundHeart members — save on dog-friendly hotels, vacations, and more through our curated travel partners."
      tierRequired="premium"
      expectedPhase="Phase 2 - Q3 2024"
      features={[
        'Discounted dog-friendly hotel stays',
        'Exclusive vacation package deals',
        'Partner resort & retreat discounts',
        'Pet-friendly airline perks',
        'Travel insurance partner offers',
        'Members-only promo codes'
      ]}
    />
  );
};

export default TravelClubPage;
