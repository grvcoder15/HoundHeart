import React from 'react';
import ComingSoonPage from '../components/ComingSoonPage';

const WearableMarketplacePage = () => {
  return (
    <ComingSoonPage
      title="Wearable Marketplace"
      description="Browse and purchase approved wearable devices with exclusive member discounts"
      expectedPhase="Phase 2 - Q3 2024"
      features={[
        'Browse approved wearables',
        'Device specifications & reviews',
        'Member-exclusive discounts',
        'Affiliate purchase links',
        'Device comparison tools',
        'Seamless HoundHeart integration'
      ]}
    />
  );
};

export default WearableMarketplacePage;
