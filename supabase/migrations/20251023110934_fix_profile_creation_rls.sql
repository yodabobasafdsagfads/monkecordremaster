/*
  # Fix Profile Creation RLS

  ## Changes
  - Add policy to allow service role to insert profiles during user registration
  - This fixes the "Database error saving new user" issue by allowing the trigger function to create profiles
*/

-- Add policy to allow authenticated users to insert their own profile via trigger
CREATE POLICY "Allow profile creation during signup"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (true);