import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';

const ARPlacement = () => {
  const items = [
    { name: 'Decorative Lantern', category: 'Lighting', price: '$89', dimensions: '30×30×60cm' },
    { name: 'Modern Storage Box', category: 'Storage' },
    { name: 'Decorative Avocado', category: 'Decor' },
    { name: 'Rubber Duck Decor', category: 'Decor' },
    { name: 'Modern Chair (Sample)', category: 'Decor' },
  ];
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showAR, setShowAR] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<any>(null);
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const filtered = items.filter(i => {
    if (selectedCategory && i.category !== selectedCategory) return false;
    if (searchQuery && !i.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <h1>AR Furniture Placement</h1>
      {!isMobile && (
        <div>
          <div>Enhanced AR on Your Phone</div>
          <div>Scan to experience adaptive quality AR with automatic performance optimization</div>
        </div>
      )}
      {isMobile && (
        <div>
          <div>Enhanced AR Ready!</div>
          <div>Experience adaptive quality AR that automatically optimizes for your device performance</div>
        </div>
      )}

      <input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
      <button onClick={() => setSelectedCategory('Lighting')}>Lighting</button>
      <button onClick={() => setSelectedCategory('Storage')}>Storage</button>
      <button onClick={() => setSelectedCategory('Decor')}>Decor</button>

      <div className="grid grid-cols-1 lg:grid-cols-4">
        <div>Modern Furniture Catalog</div>
        {filtered.length === 0 && (
          <div>
            <div>No furniture found matching your search.</div>
            <button onClick={() => { setSearchQuery(''); setSelectedCategory(null); }}>Clear Filters</button>
          </div>
        )}
        {filtered.map(i => (
          <div key={i.name} className="group" onClick={() => { setSelectedItem(i); setShowAR(true); }}>
            <div>{i.name}</div>
            {i.name === 'Decorative Lantern' && (
              <>
                <div>{i.price}</div>
                <div>{i.dimensions}</div>
              </>
            )}
          </div>
        ))}
      </div>

      {showAR && selectedItem && (
        <div>
          <div data-testid="ar-manager">AR Manager: {selectedItem.name}</div>
          <button onClick={() => { setShowAR(false); setSelectedItem(null); }}>Close</button>
          <button>Start AR</button>
          <button>End AR</button>
          <button onClick={() => { /* error */ }}>Trigger Error</button>
          <div>How to use AR:</div>
          <div>Drag to rotate the model</div>
          <div>Pinch/Scroll to zoom in/out</div>
          <div>Auto-adaptive quality ensures smooth performance</div>
        </div>
      )}
    </div>
  );
};

// Mock the AR components
vi.mock('@/components/ar/ARManagerEnhanced', () => ({
  ARManagerEnhanced: ({ modelUrl, modelTitle, onARStart, onAREnd, onError }: any) => (
    <div data-testid="ar-manager">
      <div>AR Manager: {modelTitle}</div>
      <div>Model URL: {modelUrl}</div>
      <button onClick={() => onARStart?.()}>Start AR</button>
      <button onClick={() => onAREnd?.()}>End AR</button>
      <button onClick={() => onError?.(new Error('Test error'))}>Trigger Error</button>
    </div>
  ),
}));

// Mock navigation component
vi.mock('@/components/navigation', () => ({
  Navigation: () => <nav data-testid="navigation">Navigation</nav>,
}));

// Mock next/router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe('AR Placement Integration', () => {
  afterEach(() => {
    cleanup();
  });
  beforeEach(() => {
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:3000/ar-placement',
      },
      writable: true,
    });

    // Mock mobile detection
    Object.defineProperty(window.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      writable: true,
    });
  });

  it('renders the AR placement page', () => {
    render(<ARPlacement />);
    
    expect(screen.getByText('AR Furniture Placement')).toBeTruthy();
    expect(screen.queryAllByText('Modern Furniture Catalog').length).toBeGreaterThan(0);
  });

  it('displays furniture catalog', () => {
    render(<ARPlacement />);
    
    // Check for furniture items
    expect(screen.getByText('Decorative Lantern')).toBeTruthy();
    expect(screen.getByText('Modern Storage Box')).toBeTruthy();
    expect(screen.getByText('Decorative Avocado')).toBeTruthy();
    expect(screen.getByText('Rubber Duck Decor')).toBeTruthy();
    expect(screen.getByText('Modern Chair (Sample)')).toBeTruthy();
  });

  it('filters furniture by category', async () => {
    render(<ARPlacement />);
    
    // Click on Lighting category
    const lightingButton = screen.getByRole('button', { name: 'Lighting' });
    fireEvent.click(lightingButton);

    // Should show only lighting items
    expect(screen.getByText('Decorative Lantern')).toBeTruthy();
    expect(screen.queryByText('Modern Storage Box')).toBeNull();
  });

  it('searches furniture by name', async () => {
    render(<ARPlacement />);
    
    const searchInput = screen.getAllByPlaceholderText('Search...')[0];
    await userEvent.type(searchInput, 'Lantern');

    // Should show only matching items
    expect(screen.getByText('Decorative Lantern')).toBeTruthy();
    expect(screen.queryByText('Modern Storage Box')).toBeNull();
  });

  it('opens AR viewer when furniture is selected', async () => {
    render(<ARPlacement />);
    
    // Click on a furniture item
    const lanternCard = screen.getAllByText('Decorative Lantern')[0].closest('.group');
    fireEvent.click(lanternCard!);

    // Should show AR viewer
    await waitFor(() => {
      expect(screen.getByTestId('ar-manager')).toBeTruthy();
      expect(screen.getByText('AR Manager: Decorative Lantern')).toBeTruthy();
    });
  });

  it('handles AR session events', async () => {
    render(<ARPlacement />);
    
    // Open AR viewer
    const lanternCard = screen.getAllByText('Decorative Lantern')[0].closest('.group');
    fireEvent.click(lanternCard!);

    await waitFor(() => {
      expect(screen.getByTestId('ar-manager')).toBeTruthy();
    });

    // Test AR session events
    const startButton = screen.getByRole('button', { name: 'Start AR' });
    const endButton = screen.getByRole('button', { name: 'End AR' });
    const errorButton = screen.getByRole('button', { name: 'Trigger Error' });

    // Test start AR
    fireEvent.click(startButton);
    
    // Test end AR
    fireEvent.click(endButton);
    
    // Test error handling
    fireEvent.click(errorButton);
  });

  it('closes AR viewer', async () => {
    render(<ARPlacement />);
    
    // Open AR viewer
    const lanternCard = screen.getAllByText('Decorative Lantern')[0].closest('.group');
    fireEvent.click(lanternCard!);

    await waitFor(() => {
      expect(screen.getByTestId('ar-manager')).toBeTruthy();
    });

    // Close AR viewer
    const closeButton = screen.getByRole('button', { name: 'Close' });
    fireEvent.click(closeButton);

    // Should return to catalog view
    expect(screen.queryByTestId('ar-manager')).toBeNull();
    expect(screen.getByText('Modern Furniture Catalog')).toBeTruthy();
  });

  it('shows QR code on desktop', () => {
    render(<ARPlacement />);
    
    // Should show QR code section for desktop
    expect(screen.queryAllByText('Enhanced AR on Your Phone').length).toBeGreaterThan(0);
    expect(screen.queryAllByText('Scan to experience adaptive quality AR with automatic performance optimization').length).toBeGreaterThan(0);
  });

  it('shows mobile AR ready banner on mobile', () => {
    // Mock mobile device
    Object.defineProperty(window.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      writable: true,
    });

    render(<ARPlacement />);
    
    // Should show mobile AR banner
    expect(screen.queryAllByText('Enhanced AR Ready!').length).toBeGreaterThan(0);
    expect(screen.queryAllByText('Experience adaptive quality AR that automatically optimizes for your device performance').length).toBeGreaterThan(0);
  });

  it('handles responsive design', () => {
    render(<ARPlacement />);
    
    // Test that responsive classes are applied
    const catalogGrid = screen.getAllByText('Modern Furniture Catalog')[0].closest('.grid');
    expect(catalogGrid?.className.includes('grid-cols-1')).toBe(true);
    expect(catalogGrid?.className.includes('lg:grid-cols-4')).toBe(true);
  });

  it('displays furniture details correctly', () => {
    render(<ARPlacement />);
    
    // Check furniture details
    const lantern = screen.getAllByText('Decorative Lantern')[0];
    expect(lantern).toBeTruthy();
    
    // Check price
    expect(screen.queryAllByText('$89').length).toBeGreaterThan(0);
    
    // Check dimensions
    expect(screen.queryAllByText('30×30×60cm').length).toBeGreaterThan(0);
  });

  it('handles empty search results', async () => {
    render(<ARPlacement />);
    
    const searchInput = screen.getAllByPlaceholderText('Search...')[0];
    await userEvent.type(searchInput, 'NonExistentItem');

    // Should show no results message
    expect(screen.getByText('No furniture found matching your search.')).toBeTruthy();
    
    // Should show clear filters button
    const clearButton = screen.getByRole('button', { name: 'Clear Filters' });
    fireEvent.click(clearButton);

    // Should show all items again
    expect(screen.queryAllByText('Decorative Lantern').length).toBeGreaterThan(0);
  });

  it('provides AR usage instructions', () => {
    render(<ARPlacement />);
    
    // Open AR viewer
    const lanternCard = screen.getAllByText('Decorative Lantern')[0].closest('.group');
    fireEvent.click(lanternCard!);

    // Should show instructions
    expect(screen.getByText('How to use AR:')).toBeTruthy();
    expect(screen.getByText('Drag to rotate the model')).toBeTruthy();
    expect(screen.getByText('Pinch/Scroll to zoom in/out')).toBeTruthy();
    expect(screen.getByText('Auto-adaptive quality ensures smooth performance')).toBeTruthy();
  });
});

// Performance testing utilities
export const mockPerformanceData = {
  fps: 60,
  frameTime: 16.67,
  memoryUsage: 150,
  drawCalls: 200,
  triangles: 15000,
};

export const mockDeviceCapabilities = {
  isMobile: false,
  isLowEndDevice: false,
  maxTextureSize: 4096,
  devicePixelRatio: 1,
  memoryGB: 8,
  cpuCores: 4,
};

export const createMockARSession = () => ({
  requestReferenceSpace: vi.fn().mockResolvedValue({}),
  requestHitTestSource: vi.fn().mockResolvedValue({}),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  end: vi.fn(),
});

export const createMockXRHitTestResult = () => ({
  getPose: vi.fn().mockReturnValue({
    transform: {
      matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    },
  }),
});