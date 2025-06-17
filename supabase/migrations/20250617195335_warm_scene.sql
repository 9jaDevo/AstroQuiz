/*
  # Add Suspicion Flags for Integrity Detection

  1. Database Schema Updates
    - Add `is_suspicious` and `suspicion_reason` columns to `quiz_sessions` table
    - Add `has_suspicious_sessions` flag to `user_profiles` table
    - Create trigger to automatically update user profiles when sessions are flagged

  2. Security
    - Maintain existing RLS policies
    - Add indexes for performance on suspicion-related queries

  3. Triggers
    - Auto-update user profile when suspicious sessions are detected
*/

-- Add suspicion columns to quiz_sessions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quiz_sessions' AND column_name = 'is_suspicious'
  ) THEN
    ALTER TABLE quiz_sessions ADD COLUMN is_suspicious boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quiz_sessions' AND column_name = 'suspicion_reason'
  ) THEN
    ALTER TABLE quiz_sessions ADD COLUMN suspicion_reason text;
  END IF;
END $$;

-- Add suspicion flag to user_profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'has_suspicious_sessions'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN has_suspicious_sessions boolean DEFAULT false;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_is_suspicious ON quiz_sessions(is_suspicious);
CREATE INDEX IF NOT EXISTS idx_user_profiles_has_suspicious_sessions ON user_profiles(has_suspicious_sessions);

-- Function to update user profile when suspicious sessions are detected
CREATE OR REPLACE FUNCTION update_user_suspicion_flag()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user profile if this session is marked as suspicious
  IF NEW.is_suspicious = true THEN
    UPDATE user_profiles 
    SET has_suspicious_sessions = true 
    WHERE id = NEW.user_id;
  ELSE
    -- Check if user still has any suspicious sessions
    UPDATE user_profiles 
    SET has_suspicious_sessions = (
      EXISTS (
        SELECT 1 FROM quiz_sessions 
        WHERE user_id = NEW.user_id AND is_suspicious = true
      )
    )
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update user profiles
DROP TRIGGER IF EXISTS on_quiz_session_suspicion_change ON quiz_sessions;
CREATE TRIGGER on_quiz_session_suspicion_change
  AFTER INSERT OR UPDATE OF is_suspicious ON quiz_sessions
  FOR EACH ROW EXECUTE FUNCTION update_user_suspicion_flag();

-- Update existing user profiles to reflect current suspicious session status
UPDATE user_profiles 
SET has_suspicious_sessions = (
  EXISTS (
    SELECT 1 FROM quiz_sessions 
    WHERE user_id = user_profiles.id AND is_suspicious = true
  )
);