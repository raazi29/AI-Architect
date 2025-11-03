# Design Document

## Overview

This design document outlines the architecture and implementation strategy for transforming the existing application into a production-ready, real-time platform. The system currently has functional features but uses mock data, lacks real-time capabilities, and needs UI/UX improvements. This design focuses on integrating Supabase for real data and real-time sync, improving all UIs, adding proper error handling, and making everything production-grade.

### Key Design Principles

1. **Real-Time First**: All features use Supabase Realtime for instant updates
2. **No Mock Data**: Everything connects to real databases and APIs
3. **Professional UI/UX**: Consistent, polished interfaces across all features
4. **Error Resilience**: Graceful error handling with automatic retries
5. **Mobile-First**: Responsive design that works perfectly on all devices
6. **Performance Optimized**: Fast loading, smooth interactions, efficient rendering

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js 14)                    │
├─────────────────────────────────────────────────────────────┤
│  Pages: AR | AI Gen | Colors | Layout | Vastu | PM | Collab │
│  Components: UI | Realtime | AR | Chat | Tasks | Files      │
│  Services: Supabase | API | WebSocket | Cache                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  Supabase (Database + Realtime)              │
├─────────────────────────────────────────────────────────────┤
│  Auth | PostgreSQL | Realtime | Storage | Edge Functions    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Backend (FastAPI Python)                   │
├─────────────────────────────────────────────────────────────┤
│  AI Services | Image Gen | Vastu | Shopping | Vision        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      External Services                       │
├─────────────────────────────────────────────────────────────┤
│  Groq | Stability AI | Replicate | Image APIs | Retailers   │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- Next.js 14 with App Router
- React 18 with TypeScript
- Supabase Client (real-time subscriptions)
- Three.js (3D/AR rendering)
- Tailwind CSS + shadcn/ui
- Zustand (state management)

**Backend:**
- FastAPI (Python 3.11+)
- Supabase (PostgreSQL + Realtime + Storage)
- Multiple AI providers (Groq, Stability AI, Replicate)
- Image providers (Pexels, Unsplash, Pixabay, etc.)

**Infrastructure:**
- Vercel (frontend hosting)
- Supabase Cloud (database + realtime + storage)
- Railway/Render (backend hosting)


## Database Schema

### Core Tables

```sql
-- Users (managed by Supabase Auth)
-- profiles table extends auth.users
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id),
  budget DECIMAL(12, 2),
  timeline INTEGER,
  status TEXT DEFAULT 'active',
  location TEXT,
  project_type TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Project Members
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  role TEXT NOT NULL,
  permissions JSONB,
  joined_at TIMESTAMP DEFAULT NOW()
);

-- Tasks
CREATE TABLE project_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  start_date DATE,
  end_date DATE,
  cost DECIMAL(12, 2),
  progress INTEGER DEFAULT 0,
  dependencies JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Materials
CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  unit TEXT,
  unit_cost DECIMAL(10, 2),
  quantity DECIMAL(10, 2),
  total_cost DECIMAL(12, 2),
  supplier TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Expenses
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  amount DECIMAL(12, 2),
  date DATE,
  notes TEXT,
  receipt_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- AR Scenes
CREATE TABLE ar_scenes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  scene_data JSONB NOT NULL,
  thumbnail_url TEXT,
  room_dimensions JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- AI Generated Designs
CREATE TABLE ai_designs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  prompt TEXT NOT NULL,
  style TEXT,
  room_type TEXT,
  image_url TEXT NOT NULL,
  metadata JSONB,
  is_public BOOLEAN DEFAULT FALSE,
  likes_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Color Palettes
CREATE TABLE color_palettes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  palette_data JSONB NOT NULL,
  room_type TEXT,
  style TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Layouts
CREATE TABLE layouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  layout_data JSONB NOT NULL,
  room_type TEXT,
  dimensions JSONB,
  metrics JSONB,
  score DECIMAL(5, 2),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Vastu Analyses
CREATE TABLE vastu_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  room_type TEXT NOT NULL,
  direction TEXT NOT NULL,
  analysis_data JSONB NOT NULL,
  score INTEGER,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Chat Messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  message TEXT NOT NULL,
  attachments JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Annotations
CREATE TABLE annotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL,
  position JSONB,
  content TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User Presence
CREATE TABLE user_presence (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'online',
  cursor_position JSONB,
  selected_element TEXT,
  last_seen TIMESTAMP DEFAULT NOW()
);

-- Files
CREATE TABLE project_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  version INTEGER DEFAULT 1,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```


### Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar_scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE color_palettes ENABLE ROW LEVEL SECURITY;
ALTER TABLE layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vastu_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

-- Projects: Users can view projects they own or are members of
CREATE POLICY "Users can view their projects"
  ON projects FOR SELECT
  USING (
    auth.uid() = owner_id OR
    is_public = TRUE OR
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_id = projects.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their projects"
  ON projects FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their projects"
  ON projects FOR DELETE
  USING (auth.uid() = owner_id);

-- Similar policies for other tables...
```

## Real-Time Subscriptions

### Supabase Realtime Channels

```typescript
// Subscribe to project changes
const subscribeToProject = (projectId: string) => {
  const channel = supabase
    .channel(`project:${projectId}`)
    // Project updates
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'projects',
      filter: `id=eq.${projectId}`
    }, handleProjectChange)
    // Task updates
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'project_tasks',
      filter: `project_id=eq.${projectId}`
    }, handleTaskChange)
    // Material updates
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'materials',
      filter: `project_id=eq.${projectId}`
    }, handleMaterialChange)
    // Expense updates
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'expenses',
      filter: `project_id=eq.${projectId}`
    }, handleExpenseChange)
    // Presence tracking
    .on('presence', { event: 'sync' }, handlePresenceSync)
    .on('presence', { event: 'join' }, handlePresenceJoin)
    .on('presence', { event: 'leave' }, handlePresenceLeave)
    // Broadcast for cursor/selection
    .on('broadcast', { event: 'cursor' }, handleCursorMove)
    .on('broadcast', { event: 'selection' }, handleSelection)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
```


## Component Architecture

### 1. Real-Time Service Layer

```typescript
// lib/realtimeService.ts
interface RealtimeService {
  // Project subscriptions
  subscribeToProject(projectId: string, callbacks: ProjectCallbacks): () => void;
  
  // Presence tracking
  trackPresence(projectId: string, userId: string): void;
  updatePresence(data: PresenceData): void;
  
  // Broadcast events
  broadcastCursor(projectId: string, position: Vector2): void;
  broadcastSelection(projectId: string, elementId: string): void;
  
  // Connection management
  connect(): Promise<void>;
  disconnect(): void;
  isConnected(): boolean;
}

interface ProjectCallbacks {
  onProjectUpdate?: (project: Project) => void;
  onTaskUpdate?: (task: Task) => void;
  onMaterialUpdate?: (material: Material) => void;
  onExpenseUpdate?: (expense: Expense) => void;
  onPresenceUpdate?: (presence: UserPresence[]) => void;
  onCursorMove?: (data: CursorData) => void;
  onSelection?: (data: SelectionData) => void;
}
```

### 2. AR Placement Service

```typescript
// components/ar/ar-service.ts
interface ARService {
  // Scene management
  initializeScene(): Promise<void>;
  loadFurniture(productId: string): Promise<FurnitureModel>;
  placeFurniture(model: FurnitureModel, position: Vector3): PlacedItem;
  updateItem(itemId: string, transform: Transform): void;
  removeItem(itemId: string): void;
  
  // Scene persistence
  saveScene(projectId: string): Promise<string>;
  loadScene(sceneId: string): Promise<ARScene>;
  shareScene(sceneId: string): Promise<string>;
  
  // Real-time sync
  syncScene(projectId: string): void;
  subscribeToSceneChanges(sceneId: string, callback: (scene: ARScene) => void): () => void;
}

interface FurnitureModel {
  id: string;
  name: string;
  model: THREE.Object3D;
  dimensions: Dimensions;
  price: number;
  retailer: string;
  productUrl: string;
}

interface PlacedItem {
  id: string;
  furnitureId: string;
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
  model: THREE.Object3D;
}
```

### 3. AI Generation Service

```typescript
// lib/aiGenerationService.ts
interface AIGenerationService {
  // Image generation
  generateInterior(prompt: string, options: GenerationOptions): Promise<GeneratedImage>;
  generateArchitecture(prompt: string, options: ArchitectureOptions): Promise<GeneratedImage>;
  
  // Multi-provider fallback
  tryProviders(prompt: string, options: any): Promise<GeneratedImage>;
  
  // Caching and persistence
  saveDesign(design: GeneratedImage, userId: string): Promise<string>;
  loadDesign(designId: string): Promise<GeneratedImage>;
  
  // Real-time updates
  subscribeToDesigns(userId: string, callback: (design: GeneratedImage) => void): () => void;
}

interface GenerationOptions {
  style?: string;
  roomType?: string;
  width?: number;
  height?: number;
  steps?: number;
  guidanceScale?: number;
  referenceImage?: string;
}

interface GeneratedImage {
  id: string;
  imageUrl: string;
  prompt: string;
  metadata: ImageMetadata;
  createdAt: Date;
}
```

### 4. Project Management Service

```typescript
// lib/projectManagementService.ts
interface ProjectManagementService {
  // CRUD operations
  createProject(data: ProjectData): Promise<Project>;
  updateProject(id: string, data: Partial<ProjectData>): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  getProject(id: string): Promise<Project>;
  
  // Tasks
  createTask(projectId: string, data: TaskData): Promise<Task>;
  updateTask(taskId: string, data: Partial<TaskData>): Promise<Task>;
  deleteTask(taskId: string): Promise<void>;
  
  // Materials
  createMaterial(projectId: string, data: MaterialData): Promise<Material>;
  updateMaterial(materialId: string, data: Partial<MaterialData>): Promise<Material>;
  deleteMaterial(materialId: string): Promise<void>;
  
  // Expenses
  createExpense(projectId: string, data: ExpenseData): Promise<Expense>;
  updateExpense(expenseId: string, data: Partial<ExpenseData>): Promise<Expense>;
  deleteExpense(expenseId: string): Promise<void>;
  
  // Real-time subscriptions
  subscribeToProject(projectId: string, callbacks: ProjectCallbacks): () => void;
}
```


## UI/UX Design System

### Design Tokens

```typescript
// Design system tokens
const tokens = {
  colors: {
    primary: 'hsl(221, 83%, 53%)',
    secondary: 'hsl(210, 40%, 96%)',
    accent: 'hsl(142, 76%, 36%)',
    destructive: 'hsl(0, 84%, 60%)',
    muted: 'hsl(210, 40%, 96%)',
    background: 'hsl(0, 0%, 100%)',
    foreground: 'hsl(222, 47%, 11%)',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
  },
};
```

### Component Patterns

```typescript
// Loading states with skeleton loaders
<Skeleton className="h-4 w-full" />
<Skeleton className="h-32 w-full rounded-lg" />

// Error states with retry
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>
    {error.message}
    <Button onClick={retry} variant="outline" size="sm">
      Retry
    </Button>
  </AlertDescription>
</Alert>

// Empty states with actions
<EmptyState
  icon={<Inbox className="h-12 w-12" />}
  title="No projects yet"
  description="Create your first project to get started"
  action={
    <Button onClick={createProject}>
      <Plus className="h-4 w-4 mr-2" />
      Create Project
    </Button>
  }
/>

// Success feedback with toast
toast.success("Project created successfully", {
  description: "You can now add tasks and team members",
  action: {
    label: "View Project",
    onClick: () => router.push(`/projects/${projectId}`)
  }
});
```

### Responsive Layouts

```typescript
// Mobile-first responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {items.map(item => (
    <Card key={item.id}>...</Card>
  ))}
</div>

// Responsive navigation
<nav className="hidden md:flex">
  {/* Desktop nav */}
</nav>
<Sheet>
  {/* Mobile nav */}
</Sheet>

// Responsive typography
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
  {title}
</h1>
```


## Error Handling Strategy

### Error Types and Handling

```typescript
// Error types
enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
}

// Error handler with retry logic
class ErrorHandler {
  async handleError(error: Error, context: ErrorContext): Promise<void> {
    // Log error
    console.error('[Error]', error, context);
    
    // Determine error type
    const errorType = this.classifyError(error);
    
    // Handle based on type
    switch (errorType) {
      case ErrorType.NETWORK_ERROR:
        return this.handleNetworkError(error, context);
      case ErrorType.RATE_LIMIT_ERROR:
        return this.handleRateLimitError(error, context);
      case ErrorType.API_ERROR:
        return this.handleAPIError(error, context);
      default:
        return this.handleGenericError(error, context);
    }
  }
  
  async handleNetworkError(error: Error, context: ErrorContext): Promise<void> {
    // Retry with exponential backoff
    if (context.retryCount < 3) {
      const delay = Math.pow(2, context.retryCount) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      return context.retry();
    }
    
    // Show offline message
    toast.error('Network error', {
      description: 'Please check your connection and try again'
    });
  }
  
  async handleRateLimitError(error: Error, context: ErrorContext): Promise<void> {
    // Queue request for later
    await this.queueRequest(context.request);
    
    toast.warning('Rate limit reached', {
      description: 'Your request has been queued and will be processed shortly'
    });
  }
}

// Retry with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const delay = baseDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}
```

### Offline Queue

```typescript
// Queue for offline operations
class OfflineQueue {
  private queue: Operation[] = [];
  private isProcessing = false;
  
  enqueue(operation: Operation): void {
    this.queue.push(operation);
    this.saveToStorage();
    
    if (navigator.onLine) {
      this.processQueue();
    }
  }
  
  async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;
    
    this.isProcessing = true;
    
    while (this.queue.length > 0) {
      const operation = this.queue[0];
      
      try {
        await operation.execute();
        this.queue.shift();
        this.saveToStorage();
      } catch (error) {
        console.error('Failed to process queued operation:', error);
        break;
      }
    }
    
    this.isProcessing = false;
  }
  
  private saveToStorage(): void {
    localStorage.setItem('offline_queue', JSON.stringify(this.queue));
  }
  
  private loadFromStorage(): void {
    const stored = localStorage.getItem('offline_queue');
    if (stored) {
      this.queue = JSON.parse(stored);
    }
  }
}

// Listen for online/offline events
window.addEventListener('online', () => {
  offlineQueue.processQueue();
  toast.success('Back online', {
    description: 'Syncing your changes...'
  });
});

window.addEventListener('offline', () => {
  toast.warning('You are offline', {
    description: 'Changes will be synced when you reconnect'
  });
});
```


## Performance Optimization

### Code Splitting and Lazy Loading

```typescript
// Lazy load heavy components
const ARScene = dynamic(() => import('@/components/ar/ar-scene'), {
  loading: () => <Skeleton className="h-96 w-full" />,
  ssr: false
});

const ThreeViewer = dynamic(() => import('@/components/3d/viewer'), {
  loading: () => <Skeleton className="h-96 w-full" />,
  ssr: false
});

// Route-based code splitting (automatic with Next.js App Router)
// Each page in app/ directory is automatically code-split
```

### Image Optimization

```typescript
// Use Next.js Image component
import Image from 'next/image';

<Image
  src={imageUrl}
  alt={alt}
  width={800}
  height={600}
  placeholder="blur"
  blurDataURL={blurDataUrl}
  loading="lazy"
  quality={85}
/>

// Progressive image loading
const [imageLoaded, setImageLoaded] = useState(false);

<div className="relative">
  {!imageLoaded && <Skeleton className="absolute inset-0" />}
  <img
    src={imageUrl}
    onLoad={() => setImageLoaded(true)}
    className={cn(
      'transition-opacity duration-300',
      imageLoaded ? 'opacity-100' : 'opacity-0'
    )}
  />
</div>
```

### Data Caching

```typescript
// React Query for server state
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Fetch with caching
const { data, isLoading, error } = useQuery({
  queryKey: ['project', projectId],
  queryFn: () => fetchProject(projectId),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
});

// Optimistic updates
const mutation = useMutation({
  mutationFn: updateProject,
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['project', projectId] });
    
    // Snapshot previous value
    const previousProject = queryClient.getQueryData(['project', projectId]);
    
    // Optimistically update
    queryClient.setQueryData(['project', projectId], newData);
    
    return { previousProject };
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(['project', projectId], context.previousProject);
  },
  onSettled: () => {
    // Refetch after mutation
    queryClient.invalidateQueries({ queryKey: ['project', projectId] });
  },
});
```

### Virtual Scrolling

```typescript
// For large lists (design feed, product catalog)
import { useVirtualizer } from '@tanstack/react-virtual';

const parentRef = useRef<HTMLDivElement>(null);

const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 300, // Estimated item height
  overscan: 5, // Render 5 items outside viewport
});

<div ref={parentRef} className="h-screen overflow-auto">
  <div
    style={{
      height: `${virtualizer.getTotalSize()}px`,
      position: 'relative',
    }}
  >
    {virtualizer.getVirtualItems().map((virtualItem) => (
      <div
        key={virtualItem.key}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: `${virtualItem.size}px`,
          transform: `translateY(${virtualItem.start}px)`,
        }}
      >
        <ItemComponent item={items[virtualItem.index]} />
      </div>
    ))}
  </div>
</div>
```

### 3D Rendering Optimization

```typescript
// Level of Detail (LOD)
import { LOD } from 'three';

const lod = new LOD();
lod.addLevel(highDetailMesh, 0);
lod.addLevel(mediumDetailMesh, 50);
lod.addLevel(lowDetailMesh, 100);

// Frustum culling (automatic in Three.js)
// Only render objects in camera view

// Instanced rendering for repeated objects
import { InstancedMesh } from 'three';

const instancedMesh = new InstancedMesh(geometry, material, count);
for (let i = 0; i < count; i++) {
  matrix.setPosition(positions[i]);
  instancedMesh.setMatrixAt(i, matrix);
}

// Texture compression
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader';

const ktx2Loader = new KTX2Loader();
ktx2Loader.setTranscoderPath('/basis/');
ktx2Loader.detectSupport(renderer);
```


## Testing Strategy

### Unit Tests

```typescript
// Component testing with React Testing Library
import { render, screen, fireEvent } from '@testing-library/react';
import { ProjectCard } from '@/components/project-card';

describe('ProjectCard', () => {
  it('renders project information', () => {
    const project = {
      id: '1',
      name: 'Test Project',
      description: 'Test Description',
    };
    
    render(<ProjectCard project={project} />);
    
    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });
  
  it('calls onDelete when delete button is clicked', () => {
    const onDelete = jest.fn();
    const project = { id: '1', name: 'Test' };
    
    render(<ProjectCard project={project} onDelete={onDelete} />);
    
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    
    expect(onDelete).toHaveBeenCalledWith('1');
  });
});

// Service testing
import { projectService } from '@/lib/projectService';

describe('ProjectService', () => {
  it('creates a project', async () => {
    const projectData = {
      name: 'New Project',
      description: 'Description',
    };
    
    const project = await projectService.createProject(projectData);
    
    expect(project).toHaveProperty('id');
    expect(project.name).toBe('New Project');
  });
});
```

### Integration Tests

```typescript
// API endpoint testing
import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/projects/route';

describe('/api/projects', () => {
  it('returns projects for authenticated user', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      headers: {
        authorization: 'Bearer valid-token',
      },
    });
    
    await handler(req, res);
    
    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toHaveProperty('projects');
  });
});
```

### E2E Tests

```typescript
// Playwright E2E tests
import { test, expect } from '@playwright/test';

test.describe('Project Management', () => {
  test('user can create a project', async ({ page }) => {
    await page.goto('/projects');
    
    await page.click('button:has-text("New Project")');
    await page.fill('input[name="name"]', 'Test Project');
    await page.fill('textarea[name="description"]', 'Test Description');
    await page.click('button:has-text("Create")');
    
    await expect(page.locator('text=Test Project')).toBeVisible();
  });
  
  test('user can add tasks to project', async ({ page }) => {
    await page.goto('/projects/test-project-id');
    
    await page.click('button:has-text("Add Task")');
    await page.fill('input[name="taskName"]', 'New Task');
    await page.click('button:has-text("Save")');
    
    await expect(page.locator('text=New Task')).toBeVisible();
  });
});
```

## Security Considerations

### Authentication

```typescript
// Supabase Auth integration
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabase = createClientComponentClient();

// Sign up
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${location.origin}/auth/callback`,
  },
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

// Sign out
await supabase.auth.signOut();

// Get session
const { data: { session } } = await supabase.auth.getSession();

// Protected route
export default async function ProtectedPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/auth/signin');
  }
  
  return <div>Protected content</div>;
}
```

### Input Validation

```typescript
// Zod schemas for validation
import { z } from 'zod';

const projectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  budget: z.number().positive().optional(),
  timeline: z.number().positive().optional(),
});

// Validate input
const result = projectSchema.safeParse(data);
if (!result.success) {
  return { error: result.error.format() };
}

// Use validated data
const validatedData = result.data;
```

### XSS Prevention

```typescript
// React automatically escapes content
// But be careful with dangerouslySetInnerHTML

// Safe
<div>{userContent}</div>

// Unsafe - avoid unless necessary
<div dangerouslySetInnerHTML={{ __html: userContent }} />

// If you must use HTML, sanitize it
import DOMPurify from 'dompurify';

const sanitizedHTML = DOMPurify.sanitize(userContent);
<div dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />
```

### CSRF Protection

```typescript
// Supabase handles CSRF protection automatically
// For custom APIs, use CSRF tokens

import { getCsrfToken } from 'next-auth/react';

const csrfToken = await getCsrfToken();

fetch('/api/endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken,
  },
  body: JSON.stringify(data),
});
```

## Deployment Strategy

### Environment Configuration

```bash
# .env.local (development)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8001

# AI Services
GROQ_API_KEY=your-groq-key
STABILITY_API_KEY=your-stability-key
REPLICATE_API_TOKEN=your-replicate-token

# Image Providers
PEXELS_API_KEY=your-pexels-key
UNSPLASH_API_KEY=your-unsplash-key
PIXABAY_API_KEY=your-pixabay-key
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        run: |
          railway up --service backend
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

### Monitoring

```typescript
// Error tracking with Sentry
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

// Performance monitoring
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}

// Custom metrics
const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.analytics) {
    window.analytics.track(eventName, properties);
  }
};
```

## Migration Plan

### Phase 1: Infrastructure (Week 1)
- Set up Supabase project with all tables
- Configure RLS policies
- Set up authentication
- Deploy backend to Railway/Render

### Phase 2: Real-Time Core (Week 2)
- Implement real-time service layer
- Add WebSocket subscriptions
- Implement presence tracking
- Add offline queue

### Phase 3: Feature Updates (Weeks 3-6)
- Update AR Placement with real data
- Update AI Generator with multi-provider fallback
- Update Project Management with real-time sync
- Update Collaborate with presence and chat
- Update Design Feed with infinite scroll
- Update Colors, Layout, Vastu with real calculations

### Phase 4: UI/UX Polish (Week 7)
- Implement design system consistently
- Add loading states and skeletons
- Improve error messages
- Add animations and transitions
- Optimize mobile experience

### Phase 5: Testing & QA (Week 8)
- Write unit tests
- Write integration tests
- Run E2E tests
- Performance testing
- Security audit

### Phase 6: Launch (Week 9)
- Deploy to production
- Monitor errors and performance
- Gather user feedback
- Iterate based on feedback
