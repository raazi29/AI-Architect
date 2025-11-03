-- Supabase Database Schema for Collaboration Features
-- Run this script in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    avatar_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create projects table
CREATE TABLE projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES auth.users ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policies for projects
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

-- Create project_members table
CREATE TABLE project_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- Enable Row Level Security for project_members
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Policies for project_members
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

-- Create documents table
CREATE TABLE documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects ON DELETE CASCADE,
    name TEXT NOT NULL,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Policies for documents
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

-- Create chat_messages table
CREATE TABLE chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for chat_messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies for chat_messages
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

-- Indexes for chat_messages
CREATE INDEX chat_messages_project_id_idx ON chat_messages (project_id);
CREATE INDEX chat_messages_created_at_idx ON chat_messages (created_at);

-- Create tasks table
CREATE TABLE tasks (
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

-- Enable Row Level Security for tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policies for tasks
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

-- Create user_presence table
CREATE TABLE user_presence (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    project_id UUID REFERENCES projects ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('online', 'away', 'offline')) DEFAULT 'online',
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cursor_position JSONB
);

-- Enable Row Level Security for user_presence
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- Policies for user_presence
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

-- Enable Realtime for tables
BEGIN;
    -- Drop existing publication if exists
    DROP PUBLICATION IF EXISTS supabase_realtime;
    
    -- Create new publication
    CREATE PUBLICATION supabase_realtime;
    
    -- Add tables to publication
    ALTER PUBLICATION supabase_realtime ADD TABLE projects;
    ALTER PUBLICATION supabase_realtime ADD TABLE project_members;
    ALTER PUBLICATION supabase_realtime ADD TABLE documents;
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
    ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
    ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;
    ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
COMMIT;

-- Create storage bucket for project files
INSERT INTO storage.buckets (id, name, public)
VALUES ('project_files', 'project_files', false);

-- Create policies for storage
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

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, avatar_url)
    VALUES (NEW.id, NEW.email, NULL);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();