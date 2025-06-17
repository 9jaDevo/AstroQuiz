/*
  # Admin User Management Migration

  1. Security Updates
    - Add RLS policies for admin user management
    - Allow admins to update and delete user profiles
    - Ensure proper security constraints

  2. Policies Added
    - UPDATE policy for admins to modify user profiles
    - DELETE policy for admins to remove user profiles
    - Existing SELECT policy already allows reading all profiles
*/

-- Add UPDATE policy for admins to manage user profiles
CREATE POLICY "Admins can update any user profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles admin_profile
      WHERE admin_profile.id = auth.uid()
      AND admin_profile.is_admin = true
    )
  );

-- Add DELETE policy for admins to delete user profiles
CREATE POLICY "Admins can delete user profiles"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles admin_profile
      WHERE admin_profile.id = auth.uid()
      AND admin_profile.is_admin = true
    )
  );

-- Create an index on is_admin for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_admin ON user_profiles(is_admin);