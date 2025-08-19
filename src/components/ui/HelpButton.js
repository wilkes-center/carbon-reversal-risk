import React from 'react';
import { HelpCircle } from 'lucide-react';

/**
 * Button to access help and reopen the intro page
 */
const HelpButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 right-4 z-10 p-3 bg-green text-white rounded-full shadow-lg hover:bg-green/90 transition-colors duration-200 flex items-center justify-center"
      aria-label="Help"
      title="Open Help & Info"
    >
      <HelpCircle size={24} />
    </button>
  );
};

export default HelpButton; 