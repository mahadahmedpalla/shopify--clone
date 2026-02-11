-- Add settings column to themes table
ALTER TABLE public.themes 
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';

-- Add settings column to stores table
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';

-- Allow store owners to update their own settings
-- (Note: Existing RLS policies for stores might already cover updates, but let's double check)
-- Usually developers can update their own themes, and store owners their own stores. This is just a schema change.
