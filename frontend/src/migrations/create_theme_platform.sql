-- Theme Developer Platform Schema

-- 1. Theme Developers Table
CREATE TABLE IF NOT EXISTS public.theme_developers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    developer_name TEXT UNIQUE NOT NULL,
    website TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for theme_developers
ALTER TABLE public.theme_developers ENABLE ROW LEVEL SECURITY;

-- Policies for theme_developers
CREATE POLICY "Public read theme developers" ON public.theme_developers
    FOR SELECT USING (true);

CREATE POLICY "Users can register as theme developer" ON public.theme_developers
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Developers can update own profile" ON public.theme_developers
    FOR UPDATE USING (auth.uid() = id);

-- 2. Themes Table
CREATE TABLE IF NOT EXISTS public.themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    developer_id UUID NOT NULL REFERENCES public.theme_developers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price_credits INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for themes
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;

-- Policies for themes
CREATE POLICY "Public read published themes" ON public.themes
    FOR SELECT USING (status = 'published' OR auth.uid() = developer_id);

CREATE POLICY "Developers can insert themes" ON public.themes
    FOR INSERT WITH CHECK (auth.uid() = developer_id);

CREATE POLICY "Developers can update own themes" ON public.themes
    FOR UPDATE USING (auth.uid() = developer_id);

CREATE POLICY "Developers can delete own themes" ON public.themes
    FOR DELETE USING (auth.uid() = developer_id);

-- 3. Theme Pages Table
CREATE TABLE IF NOT EXISTS public.theme_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theme_id UUID NOT NULL REFERENCES public.themes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    type TEXT DEFAULT 'custom',
    content JSONB DEFAULT '[]',
    is_included BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(theme_id, slug)
);

-- Enable RLS for theme_pages
ALTER TABLE public.theme_pages ENABLE ROW LEVEL SECURITY;

-- Policies for theme_pages
CREATE POLICY "Public read theme pages" ON public.theme_pages
    FOR SELECT USING (true); -- Content is generally visible if theme is visible (handled by app logic) or if user is dev

CREATE POLICY "Developers can manage theme pages" ON public.theme_pages
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.themes WHERE id = theme_pages.theme_id AND developer_id = auth.uid())
    );

-- 4. Theme Products (Mock Validation Data)
CREATE TABLE IF NOT EXISTS public.theme_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theme_id UUID NOT NULL REFERENCES public.themes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price DECIMAL(10,2) DEFAULT 0.00,
    images JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for theme_products
ALTER TABLE public.theme_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Developers can manage theme products" ON public.theme_products
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.themes WHERE id = theme_products.theme_id AND developer_id = auth.uid())
    );

CREATE POLICY "Public read theme products" ON public.theme_products
    FOR SELECT USING (true); -- Useful for previews

-- 5. Theme Categories (Mock Validation Data)
CREATE TABLE IF NOT EXISTS public.theme_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theme_id UUID NOT NULL REFERENCES public.themes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for theme_categories
ALTER TABLE public.theme_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Developers can manage theme categories" ON public.theme_categories
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.themes WHERE id = theme_categories.theme_id AND developer_id = auth.uid())
    );

CREATE POLICY "Public read theme categories" ON public.theme_categories
    FOR SELECT USING (true);


-- 6. Storage Bucket for Themes
-- Note: This usually requires manual setup in Supabase dashboard or via API if using standard storage.
-- We will attempt to create policies assuming the bucket 'themes' exists.

insert into storage.buckets (id, name, public)
values ('themes', 'themes', true)
on conflict (id) do nothing;

-- Storage Policies
-- Allow public access to everything in 'themes' bucket
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'themes');

-- Allow authenticated users (developers) to upload to their own folder: themes/{dev_id}/*
CREATE POLICY "Developer Upload" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'themes' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Developer Update" ON storage.objects FOR UPDATE USING (
    bucket_id = 'themes' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Developer Delete" ON storage.objects FOR DELETE USING (
    bucket_id = 'themes' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);
