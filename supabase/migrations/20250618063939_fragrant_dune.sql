/*
  # Create automatic user profile creation

  1. New Functions
    - `handle_new_user()` - Automatically creates user profile when auth user is created
  
  2. New Triggers  
    - `on_auth_user_created` - Fires after insert on auth.users to create profile
  
  3. Changes
    - Removes need for client-side profile creation
    - Ensures consistent profile creation via database trigger
    - Avoids RLS policy violations during signup
*/

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, student_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.raw_user_meta_data->>'student_id'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();