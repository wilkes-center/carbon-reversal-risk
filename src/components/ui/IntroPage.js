import React, { useEffect } from 'react';
import { Info, Clock, Github, MessageSquare, Globe } from 'lucide-react';

/**
 * Introduction page for the Carbon Reversal Risk Tool
 */
const IntroPage = ({ onComplete }) => {
  useEffect(() => {
    const script = document.createElement('script');
    script.async = true;
    script.dataset.goatcounter = 'https://wilkes-carbon.goatcounter.com/count';
    script.src = '//gc.zgo.at/count.js';
    
    document.head.appendChild(script);
    
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-16">
        <div className="mb-10 text-center">
          <div className="mb-2">
            <h1 className="font-sora font-semibold text-display text-obsidian">
              <span className="text-green">Carbon Reversal</span> Risk Tool
            </h1>
            <div className="h-1 w-40 bg-green mx-auto mt-2"></div>
          </div>
        </div>
        
        <button 
          className="bg-green text-white hover:bg-green/90 font-sora px-6 py-3 rounded-lg flex items-center justify-center mx-auto mt-6 mb-12 transition-colors shadow-md"
          onClick={onComplete}
        >
          <Globe className="mr-2" size={18} />
          Explore Map
        </button>
        
        <div className="grid gap-8 md:grid-cols-2 mb-8">
          <div className="bg-gradient-to-r from-white to-blue/10 p-6 rounded-xl border-l-4 border-green shadow-md">
            <h2 className="font-sora font-semibold text-section-header text-obsidian flex items-center">
              <Info className="mr-2 text-blue" size={24} />
              About This Tool
            </h2>
            <p className="font-sans text-obsidian mt-3">
              This interactive tool analyzes carbon reversal risk across different regions and buffer pool capacities. 
              It allows you to explore risk scenarios and understand carbon storage vulnerabilities in various ecosystems.
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-white to-sage/10 p-6 rounded-xl border-l-4 border-sage shadow-md">
            <h2 className="font-sora font-semibold text-section-header text-obsidian flex items-center">
              <Clock className="mr-2 text-sage" size={24} />
              How to Use
            </h2>
            <ul className="font-sans text-obsidian mt-3 list-disc pl-5 space-y-2">
              <li>Navigate the map using standard zoom and pan controls</li>
              <li>Toggle different carbon data layers using the panel</li>
              <li>Click on regions to view detailed carbon reversal risk data</li>
              <li>Use the drawing tools to analyze specific areas</li>
              <li>Compare different SSP scenarios and risk levels</li>
            </ul>
          </div>
        </div>
        
      
        
        <div className="bg-gradient-to-r from-white to-blue/10 p-5 rounded-xl border-l-4 border-blue shadow-md">
          <h3 className="font-sora font-medium text-blue flex items-center">
            <MessageSquare className="mr-2" size={20} />
            Feedback & Support
          </h3>
          <p className="font-sans text-obsidian mt-2">
            We value your feedback and suggestions for improving this tool. If you encounter any issues or have ideas for new features,
            please submit a GitHub issue on our repository.
          </p>
          <div className="mt-3 flex items-center">
            <Github size={16} className="mr-2 text-obsidian" />
            <a href="https://github.com/wilkes-center/carbon-webapp/issues" 
               className="font-sans text-sm font-medium text-blue hover:text-blue/80">
              Submit issues on GitHub
            </a>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default IntroPage; 