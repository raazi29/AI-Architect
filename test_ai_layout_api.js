// Test script for AI Layout APIs
const testLayoutOptimization = async () => {
  try {
    console.log('Testing AI Layout Optimization API...');
    
    const testData = {
      room_type: 'living_room',
      room_dimensions: {
        length: 4.5,
        width: 3.5,
        height: 3.0
      },
      existing_furniture: ['Sofa', 'Coffee Table'],
      primary_function: 'Family entertainment and relaxation',
      traffic_flow_requirements: 'Easy access from entrance to seating area',
      design_style: 'modern',
      inspiration_data: [],
      trends_data: []
    };

    const response = await fetch('http://localhost:3000/api/ai-layout-optimize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Layout Optimization API working!');
      console.log('Furniture items:', result.optimal_layout?.furniture_placement?.length || 0);
      console.log('Space efficiency:', result.space_utilization?.efficiency_score || 0, '%');
    } else {
      console.log('❌ Layout Optimization API failed:', response.status);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

const testTavilySearch = async () => {
  try {
    console.log('Testing Tavily Search API...');
    
    const response = await fetch('http://localhost:3000/api/tavily-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'modern living room design 2024',
        max_results: 3
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Tavily Search API working!');
      console.log('Results found:', result.results?.length || 0);
      console.log('Source:', result.source || 'unknown');
    } else {
      console.log('❌ Tavily Search API failed:', response.status);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

const testRoomTypes = async () => {
  try {
    console.log('Testing Room Types API...');
    
    const response = await fetch('http://localhost:3000/api/room-types');

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Room Types API working!');
      console.log('Room types available:', result.room_types?.length || 0);
    } else {
      console.log('❌ Room Types API failed:', response.status);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run tests
const runTests = async () => {
  console.log('🧪 Starting AI Layout API Tests...\n');
  
  await testRoomTypes();
  console.log('');
  
  await testTavilySearch();
  console.log('');
  
  await testLayoutOptimization();
  console.log('');
  
  console.log('🎉 Tests completed!');
};

// Export for Node.js or run directly
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runTests };
} else {
  runTests();
}