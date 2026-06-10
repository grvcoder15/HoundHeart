import React from 'react';
import ComingSoonPage from '../components/ComingSoonPage';

const BooksLibraryPage = () => {
  return (
    <ComingSoonPage
      title="Books Library"
      description="Access your digital and audio books with unlimited reading and listening"
      expectedPhase="Phase 2 - Q3 2024"
      features={[
        'HoundHeart Digital Book (Plus+)',
        'HoundHeart Audio Book (Plus+)',
        'Reading progress tracking',
        'Bookmarks & highlights',
        'Offline reading access',
        'Audiobook playback controls'
      ]}
    />
  );
};

export default BooksLibraryPage;
