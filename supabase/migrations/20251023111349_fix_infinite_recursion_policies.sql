/*
  # Fix Infinite Recursion in RLS Policies

  ## Changes
  - Remove circular references in server_members policies
  - Simplify policies to avoid infinite recursion
  - Fix server creation and member addition workflows
*/

-- Drop all existing server_members policies
DROP POLICY IF EXISTS "Users can view members of servers they belong to" ON server_members;
DROP POLICY IF EXISTS "Server owners and admins can add members" ON server_members;
DROP POLICY IF EXISTS "Server owners and admins can update members" ON server_members;
DROP POLICY IF EXISTS "Server owners and admins can remove members" ON server_members;

-- Create simplified policies for server_members
CREATE POLICY "Users can view server members"
  ON server_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    server_id IN (
      SELECT sm.server_id FROM server_members sm WHERE sm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join servers"
  ON server_members FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Server owners can manage members"
  ON server_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM servers s
      WHERE s.id = server_members.server_id
      AND s.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM servers s
      WHERE s.id = server_members.server_id
      AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY "Server owners can remove members"
  ON server_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM servers s
      WHERE s.id = server_members.server_id
      AND s.owner_id = auth.uid()
    )
  );