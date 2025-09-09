import React from 'react';

const VastuPage = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Vastu Shastra Principles</h1>
      <p className="text-lg mb-4">
        Vastu Shastra is an ancient Indian science of architecture and construction that helps in making a congenial setting or a place to live and work in a most scientific way taking advantage of the benefits bestowed by nature, its elements and energy fields for enhanced wealth, health, prosperity and happiness.
      </p>
      <h2 className="text-2xl font-semibold mb-4">Key Vastu Principles:</h2>
      <ul className="list-disc list-inside mb-6">
        <li>Directional Alignments: Proper placement of rooms and elements based on cardinal directions.</li>
        <li>Five Elements (Panchabhutas): Balancing Earth, Water, Fire, Air, and Space.</li>
        <li>Energy Flow: Ensuring positive energy circulation throughout the space.</li>
        <li>Proportions and Measurements: Using specific measurements for harmonious structures.</li>
      </ul>

      <h2 className="text-2xl font-semibold mb-4">Vastu Tips for Your Home:</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-xl font-medium mb-2">Entrance</h3>
          <p>The main entrance should ideally face North, East, or North-East. It should be well-lit and clutter-free.</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-xl font-medium mb-2">Living Room</h3>
          <p>The living room should be in the North, East, or North-East. Heavy furniture should be placed in the South or West.</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-xl font-medium mb-2">Kitchen</h3>
          <p>The ideal location for the kitchen is the South-East direction, representing the fire element.</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-xl font-medium mb-2">Bedroom</h3>
          <p>Bedrooms are best located in the South-West. Avoid placing mirrors directly opposite the bed.</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-xl font-medium mb-2">Toilets & Bathrooms</h3>
          <p>These should be in the North-West or South-East. Avoid North-East as it is a sacred direction.</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-xl font-medium mb-2">Study Room</h3>
          <p>The study room should be in the North-East or West. Facing East or North while studying is recommended.</p>
        </div>
      </div>

      <h2 className="text-2xl font-semibold mt-8 mb-4">Vastu Consultation & Design Integration:</h2>
      <p className="text-lg mb-4">
        Integrating Vastu principles into modern architectural designs can enhance well-being and harmony. Our platform can help you explore Vastu-compliant layouts and design elements for your projects.
      </p>
      <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Explore Vastu-Compliant Designs
      </button>
    </div>
  );
};

export default VastuPage;
