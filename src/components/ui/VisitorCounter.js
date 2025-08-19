import React, { useEffect, useState } from 'react';
import { Users } from 'lucide-react';

const VisitorCounter = ({ isDarkMode }) => {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await fetch('https://hits.sh/praveenaak.github.io/carbon-webapp.json');
        const data = await response.json();
        setCount(data.hits || 0);
      } catch (error) {
        console.error('Error fetching visitor count:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCount();
  }, []);

  return (
    <div className={`
      absolute bottom-0 right-0 
      mr-2 mb-5
      text-xs
      z-50
      ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}
      font-normal
      opacity-80
      select-none
    `}>
      <span className="flex items-center gap-1">
        <Users size={12} className="inline-block" />
        {isLoading ? "Loading..." : `${count.toLocaleString()} visits`}
      </span>
    </div>
  );
};

export default VisitorCounter;