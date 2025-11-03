-- Enhanced Database Setup for AR Interior Design Platform
-- Run this in your Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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

-- Enable RLS for error_logs
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Policy for error_logs (users can only see their own errors)
CREATE POLICY "Users can view their own error logs" ON error_logs
    FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can insert error logs" ON error_logs
    FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

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

-- Enable RLS for materials
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

-- Policies for materials
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

-- Enable RLS for expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Policies for expenses
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

-- Enable RLS for milestones
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

-- Policies for milestones
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

-- Enable RLS for ar_scenes
ALTER TABLE ar_scenes ENABLE ROW LEVEL SECURITY;

-- Policies for ar_scenes
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

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

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

