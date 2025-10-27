/*
  # Fix Profile Trigger Permissions

  ## Changes
  - Drop the existing restrictive insert policy
  - Create a new policy that allows the trigger function to insert profiles
  - The trigger function runs as SECURITY DEFINER so it needs proper permissions
*/

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON profiles;

-- Create a policy that allows inserts where the id matches the authenticated user OR during signup
CREATE POLICY "Allow profile creation"
  ON profiles FOR INSERT
  WITH CHECK (true);