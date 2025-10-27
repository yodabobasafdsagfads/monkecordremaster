/*
  # Discord-like Application Schema

  ## Overview
  This migration creates the complete database schema for a Discord-like application with full messaging, 
  server management, and admin capabilities.

  ## 1. New Tables

  ### `profiles`
  - `id` (uuid, primary key, references auth.users)
  - `username` (text, unique, required)
  - `display_name` (text)
  - `avatar_url` (text)
  - `is_owner` (boolean, default false) - System owner flag
  - `created_at` (timestamptz)
  
  ### `servers`
  - `id` (uuid, primary key)
  - `name` (text, required)
  - `icon_url` (text)
  - `owner_id` (uuid, references profiles)
  - `created_at` (timestamptz)

  ### `server_members`
  - `id` (uuid, primary key)
  - `server_id` (uuid, references servers)
  - `user_id` (uuid, references profiles)
  - `role` (text: 'owner', 'admin', 'member')
  - `joined_at` (timestamptz)
  - Unique constraint on (server_id, user_id)

  ### `channels`
  - `id` (uuid, primary key)
  - `server_id` (uuid, references servers)
  - `name` (text, required)
  - `type` (text: 'text', 'voice')
  - `position` (integer)
  - `created_at` (timestamptz)

  ### `messages`
  - `id` (uuid, primary key)
  - `channel_id` (uuid, references channels)
  - `user_id` (uuid, references profiles)
  - `content` (text, required)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `direct_messages`
  - `id` (uuid, primary key)
  - `sender_id` (uuid, references profiles)
  - `recipient_id` (uuid, references profiles)
  - `content` (text, required)
  - `created_at` (timestamptz)

  ## 2. Security
  
  - Enable RLS on all tables
  - Profiles: Users can read all profiles, update only their own (except is_owner flag)
  - Servers: Users can read servers they're members of, create new servers
  - Server members: Users can read memberships for servers they're in
  - Channels: Users can read channels in servers they're members of
  - Messages: Users can read/create messages in channels they have access to
  - Direct messages: Users can read/create DMs they're part of

  ## 3. Functions & Triggers
  
  - Automatic profile creation on user signup
  - First user becomes system owner automatically
  - Server owner automatically added as member with 'owner' role

  ## 4. Indexes
  
  - Optimized queries for messages, server members, and channels
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  display_name text,
  avatar_url text,
  is_owner boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create servers table
CREATE TABLE IF NOT EXISTS servers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon_url text,
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create server_members table
CREATE TABLE IF NOT EXISTS server_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id uuid REFERENCES servers(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(server_id, user_id)
);

-- Create channels table
CREATE TABLE IF NOT EXISTS channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id uuid REFERENCES servers(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'voice')),
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid REFERENCES channels(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create direct_messages table
CREATE TABLE IF NOT EXISTS direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON messages(channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_server_members_server_id ON server_members(server_id);
CREATE INDEX IF NOT EXISTS idx_server_members_user_id ON server_members(user_id);
CREATE INDEX IF NOT EXISTS idx_channels_server_id ON channels(server_id, position);
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON direct_messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_recipient ON direct_messages(recipient_id, created_at DESC);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile except is_owner"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND is_owner = (SELECT is_owner FROM profiles WHERE id = auth.uid()));

-- Servers policies
CREATE POLICY "Users can view servers they are members of"
  ON servers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM server_members
      WHERE server_members.server_id = servers.id
      AND server_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create servers"
  ON servers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Server owners can update their servers"
  ON servers FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Server owners can delete their servers"
  ON servers FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Server members policies
CREATE POLICY "Users can view members of servers they belong to"
  ON server_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM server_members sm
      WHERE sm.server_id = server_members.server_id
      AND sm.user_id = auth.uid()
    )
  );

CREATE POLICY "Server owners and admins can add members"
  ON server_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM server_members
      WHERE server_members.server_id = server_members.server_id
      AND server_members.user_id = auth.uid()
      AND server_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Server owners and admins can update members"
  ON server_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM server_members sm
      WHERE sm.server_id = server_members.server_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM server_members sm
      WHERE sm.server_id = server_members.server_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Server owners and admins can remove members"
  ON server_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM server_members sm
      WHERE sm.server_id = server_members.server_id
      AND sm.user_id = auth.uid()
      AND sm.role IN ('owner', 'admin')
    )
  );

-- Channels policies
CREATE POLICY "Users can view channels in their servers"
  ON channels FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM server_members
      WHERE server_members.server_id = channels.server_id
      AND server_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Server owners and admins can create channels"
  ON channels FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM server_members
      WHERE server_members.server_id = channels.server_id
      AND server_members.user_id = auth.uid()
      AND server_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Server owners and admins can update channels"
  ON channels FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM server_members
      WHERE server_members.server_id = channels.server_id
      AND server_members.user_id = auth.uid()
      AND server_members.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM server_members
      WHERE server_members.server_id = channels.server_id
      AND server_members.user_id = auth.uid()
      AND server_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Server owners and admins can delete channels"
  ON channels FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM server_members
      WHERE server_members.server_id = channels.server_id
      AND server_members.user_id = auth.uid()
      AND server_members.role IN ('owner', 'admin')
    )
  );

-- Messages policies
CREATE POLICY "Users can view messages in channels they have access to"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM channels
      JOIN server_members ON server_members.server_id = channels.server_id
      WHERE channels.id = messages.channel_id
      AND server_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in channels they have access to"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM channels
      JOIN server_members ON server_members.server_id = channels.server_id
      WHERE channels.id = messages.channel_id
      AND server_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages"
  ON messages FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Direct messages policies
CREATE POLICY "Users can view their own direct messages"
  ON direct_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send direct messages"
  ON direct_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_count integer;
BEGIN
  SELECT COUNT(*) INTO user_count FROM profiles;
  
  INSERT INTO profiles (id, username, display_name, is_owner)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    user_count = 0
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to add server owner as member
CREATE OR REPLACE FUNCTION handle_new_server()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO server_members (server_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new server creation
DROP TRIGGER IF EXISTS on_server_created ON servers;
CREATE TRIGGER on_server_created
  AFTER INSERT ON servers
  FOR EACH ROW EXECUTE FUNCTION handle_new_server();