-- =====================================================
-- COMPLETE SUPABASE DATABASE SETUP
-- AR Interior Design Platform - Production Ready
-- =====================================================
-- 
-- INSTRUCTIONS:
-- 1. Go to your Supabase project dashboard
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this entire script
-- 4. Click "Run" to execute
-- 5. Verify all tables are created successfully
--
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    avatar_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES auth.users ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create project_members table
CREATE TABLE IF NOT EXISTS project_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects ON DELETE CASCADE,
    name TEXT NOT NULL,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL CHECK (status IN ('todo', 'in_progress', 'done')) DEFAULT 'todo',
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    assigned_to UUID REFERENCES auth.users ON DELETE SET NULL,
    created_by UUID REFERENCES auth.users ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_date TIMESTAMP WITH TIME ZONE
);

-- Create user_presence table
CREATE TABLE IF NOT EXISTS user_presence (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    project_id UUID REFERENCES projects ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('online', 'away', 'offline')) DEFAULT 'online',
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cursor_position JSONB
);

-- =====================================================
-- FEATURE-SPECIFIC TABLES
-- =====================================================

-- Create materials table for AI Materials feature
CREATE TABLE IF NOT EXISTS materials (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price DECIMAL(10,2),
    supplier TEXT,
    specifications JSONB,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create expenses table for budget tracking
CREATE TABLE IF NOT EXISTS expenses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create milestones table for project tracking
CREATE TABLE IF NOT EXISTS milestones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ar_scenes table for AR functionality
CREATE TABLE IF NOT EXISTS ar_scenes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects ON DELETE CASCADE,
    name TEXT NOT NULL,
    scene_data JSONB NOT NULL,
    thumbnail_url TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES auth.users ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create error_logs table for better error tracking
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    error_id TEXT UNIQUE NOT NULL,
    error_message TEXT NOT NULL,
    error_stack TEXT,
    component_stack TEXT,
    user_agent TEXT,
    url TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    error_type TEXT DEFAULT 'general',
    user_id UUID REFERENCES auth.users ON DELETE SET NULL
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS for all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar_scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (id = auth.uid());

-- Projects policies
CREATE POLICY "Users can view their own projects" ON projects
    FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can insert their own projects" ON projects
    FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own projects" ON projects
    FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own projects" ON projects
    FOR DELETE USING (owner_id = auth.uid());

CREATE POLICY "Public projects are viewable by everyone" ON projects
    FOR SELECT USING (is_public = TRUE);

-- Project members policies
CREATE POLICY "Project members can view other members" ON project_members
    FOR SELECT USING (project_id IN (
        SELECT id FROM projects WHERE owner_id = auth.uid()
        UNION
        SELECT project_id FROM project_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Project owners can add members" ON project_members
    FOR INSERT WITH CHECK (project_id IN (
        SELECT id FROM projects WHERE owner_id = auth.uid()
    ));

CREATE POLICY "Project owners can remove members" ON project_members
    FOR DELETE USING (project_id IN (
        SELECT id FROM projects WHERE owner_id = auth.uid()
    ));

-- Documents policies
CREATE POLICY "Project members can view documents" ON documents
    FOR SELECT USING (project_id IN (
        SELECT id FROM projects WHERE owner_id = auth.uid()
        UNION
        SELECT project_id FROM project_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Project editors can insert documents" ON documents
    FOR INSERT WITH CHECK (project_id IN (
        SELECT id FROM projects WHERE owner_id = auth.uid()
        UNION
        SELECT project_id FROM project_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
    ));

CREATE POLICY "Project editors can update documents" ON documents
    FOR UPDATE USING (project_id IN (
        SELECT id FROM projects WHERE owner_id = auth.uid()
        UNION
        SELECT project_id FROM project_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
    ));

CREATE POLICY "Project owners can delete documents" ON documents
    FOR DELETE USING (project_id IN (
        SELECT id FROM projects WHERE owner_id = auth.uid()
    ));

-- Chat messages policies
CREATE POLICY "Project members can view chat messages" ON chat_messages
    FOR SELECT USING (project_id IN (
        SELECT id FROM projects WHERE owner_id = auth.uid()
        UNION
        SELECT project_id FROM project_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Project members can send chat messages" ON chat_messages
    FOR INSERT WITH CHECK (project_id IN (
        SELECT id FROM projects WHERE owner_id = auth.uid()
        UNION
        SELECT project_id FROM project_members WHERE user_id = auth.uid()
    ));

-- Tasks policies
CREATE POLICY "Project members can view tasks" ON tasks
    FOR SELECT USING (project_id IN (
        SELECT id FROM projects WHERE owner_id = auth.uid()
        UNION
        SELECT project_id FROM project_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Project editors can create tasks" ON tasks
    FOR INSERT WITH CHECK (project_id IN (
        SELECT id FROM projects WHERE owner_id = auth.uid()
        UNION
        SELECT project_id FROM project_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
    ));

CREATE POLICY "Project editors can update tasks" ON tasks
    FOR UPDATE USING (project_id IN (
        SELECT id FROM projects WHERE owner_id = auth.uid()
        UNION
        SELECT project_id FROM project_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
    ));

CREATE POLICY "Project owners can delete tasks" ON tasks
    FOR DELETE USING (project_id IN (
        SELECT id FROM projects WHERE owner_id = auth.uid()
    ));

-- User presence policies
CREATE POLICY "Users can view presence in their projects" ON user_presence
    FOR SELECT USING (project_id IN (
        SELECT id FROM projects WHERE owner_id = auth.uid()
        UNION
        SELECT project_id FROM project_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own presence" ON user_presence
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own presence" ON user_presence
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Materials policies
CREATE POLICY "Project members can view materials" ON materials
    FOR SELECT USING (project_id IN (
        SELECT id FROM projects WHERE owner_id = auth.uid()
        UNION
        SELECT project_id FROM project_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Project editors can manage materials" ON materials
    FOR ALL USING (project_id IN (
        SELECT id FROM projects WHERE owner_id = auth.uid()
        UNION
        SELECT project_id FROM project_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
    ));

-- Expenses policies
CREATE POLICY "Project members can view expenses" ON expenses
    FOR SELECT USING (project_id IN (
        SELECT id FROM projects WHERE owner_id = auth.uid()
        UNION
        SELECT project_id FROM project_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Project editors can manage expenses" ON expenses
    FOR ALL USING (project_id IN (
        SELECT id FROM projects WHERE owner_id = auth.uid()
        UNION
        SELECT project_id FROM project_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
    ));

-- Milestones policies
CREATE POLICY "Project members can view milestones" ON milestones
    FOR SELECT USING (project_id IN (
        SELECT id FROM projects WHERE owner_id = auth.uid()
        UNION
        SELECT project_id FROM project_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Project editors can manage milestones" ON milestones
    FOR ALL USING (project_id IN (
        SELECT id FROM projects WHERE owner_id = auth.uid()
        UNION
        SELECT project_id FROM project_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
    ));

-- AR scenes policies
CREATE POLICY "Project members can view ar scenes" ON ar_scenes
    FOR SELECT USING (project_id IN (
        SELECT id FROM projects WHERE owner_id = auth.uid()
        UNION
        SELECT project_id FROM project_members WHERE user_id = auth.uid()
    ) OR is_public = TRUE);

CREATE POLICY "Project editors can manage ar scenes" ON ar_scenes
    FOR ALL USING (project_id IN (
        SELECT id FROM projects WHERE owner_id = auth.uid()
        UNION
        SELECT project_id FROM project_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
    ));

-- Error logs policies
CREATE POLICY "Users can view their own error logs" ON error_logs
    FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can insert error logs" ON error_logs
    FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Enhanced function to handle new user creation with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert into profiles table
    INSERT INTO public.profiles (id, username, avatar_url)
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'username', NEW.email, 'user_' || substr(NEW.id::text, 1, 8)),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE SET
        username = COALESCE(EXCLUDED.username, profiles.username),
        avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
        updated_at = NOW();
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the user creation
        INSERT INTO public.error_logs (error_message, error_type, user_id)
        VALUES ('Failed to create user profile: ' || SQLERRM, 'user_creation', NEW.id);
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON materials
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_milestones_updated_at BEFORE UPDATE ON milestones
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_ar_scenes_updated_at BEFORE UPDATE ON ar_scenes
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =====================================================
-- REALTIME CONFIGURATION
-- =====================================================

-- Enable Realtime for all tables
BEGIN;
    -- Drop existing publication if exists
    DROP PUBLICATION IF EXISTS supabase_realtime;
    
    -- Create new publication
    CREATE PUBLICATION supabase_realtime;
    
    -- Add all tables to publication
    ALTER PUBLICATION supabase_realtime ADD TABLE projects;
    ALTER PUBLICATION supabase_realtime ADD TABLE project_members;
    ALTER PUBLICATION supabase_realtime ADD TABLE documents;
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
    ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
    ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;
    ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
    ALTER PUBLICATION supabase_realtime ADD TABLE materials;
    ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
    ALTER PUBLICATION supabase_realtime ADD TABLE milestones;
    ALTER PUBLICATION supabase_realtime ADD TABLE ar_scenes;
    ALTER PUBLICATION supabase_realtime ADD TABLE error_logs;
COMMIT;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects (owner_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members (project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members (user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks (project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks (assigned_to);
CREATE INDEX IF NOT EXISTS idx_materials_project_id ON materials (project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_project_id ON expenses (project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON milestones (project_id);
CREATE INDEX IF NOT EXISTS idx_ar_scenes_project_id ON ar_scenes (project_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs (timestamp);
CREATE INDEX IF NOT EXISTS idx_chat_messages_project_id ON chat_messages (project_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages (created_at);

-- =====================================================
-- PERMISSIONS
-- =====================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- =====================================================
-- STORAGE CONFIGURATION
-- =====================================================

-- Create storage bucket for project files if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('project_files', 'project_files', false)
ON CONFLICT (id) DO NOTHING;

-- Enhanced storage policies
CREATE POLICY "Users can upload files to their projects" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'project_files'
        AND (
            EXISTS (
                SELECT 1 FROM project_members pm
                JOIN projects p ON pm.project_id = p.id
                WHERE pm.user_id = auth.uid()
                AND pm.project_id = (storage.foldername(name))[1]::uuid
            )
        )
    );

CREATE POLICY "Project members can view files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'project_files'
        AND (
            EXISTS (
                SELECT 1 FROM project_members pm
                JOIN projects p ON pm.project_id = p.id
                WHERE pm.user_id = auth.uid()
                AND pm.project_id = (storage.foldername(name))[1]::uuid
            )
        )
    );

CREATE POLICY "Project editors can update files" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'project_files'
        AND (
            EXISTS (
                SELECT 1 FROM project_members pm
                JOIN projects p ON pm.project_id = p.id
                WHERE pm.user_id = auth.uid()
                AND pm.role IN ('owner', 'editor')
                AND pm.project_id = (storage.foldername(name))[1]::uuid
            )
        )
    );

CREATE POLICY "Project owners can delete files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'project_files'
        AND (
            EXISTS (
                SELECT 1 FROM projects p
                WHERE p.owner_id = auth.uid()
                AND p.id = (storage.foldername(name))[1]::uuid
            )
        )
    );

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

-- Insert a completion record
INSERT INTO error_logs (error_id, error_message, error_type)
VALUES ('setup_complete', 'Database setup completed successfully', 'system')
ON CONFLICT (error_id) DO NOTHING;

-- =====================================================
-- VERIFICATION QUERIES (OPTIONAL)
-- =====================================================

-- Uncomment these to verify setup:
-- SELECT 'Tables created:' as status;
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
-- 
-- SELECT 'Policies created:' as status;
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;
-- 
-- SELECT 'Realtime enabled:' as status;
-- SELECT schemaname, tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime' ORDER BY tablename;

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- 
-- Your Supabase database is now ready for the AR Interior Design Platform!
-- 
-- Next steps:
-- 1. Update your .env file with the new Supabase URL and anon key
-- 2. Test user registration and login
-- 3. Deploy your application
-- 
-- =====================================================







