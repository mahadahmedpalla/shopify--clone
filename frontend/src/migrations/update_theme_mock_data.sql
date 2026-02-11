-- Add category_id to theme_products
ALTER TABLE public.theme_products 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.theme_categories(id) ON DELETE SET NULL;
