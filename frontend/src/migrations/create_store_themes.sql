-- Store Themes Table (Table to track which store owns/has installed which theme)
CREATE TABLE IF NOT EXISTS public.store_themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    theme_id UUID NOT NULL REFERENCES public.themes(id) ON DELETE CASCADE,
    purchased_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT false,
    settings JSONB DEFAULT '{}', -- Store-specific theme settings/overrides
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(store_id, theme_id)
);

-- Enable RLS
ALTER TABLE public.store_themes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Store owners can view their installed themes" ON public.store_themes
    FOR SELECT USING (
        exists (select 1 from public.stores where id = store_themes.store_id and owner_id = auth.uid())
    );

CREATE POLICY "Store owners can install themes" ON public.store_themes
    FOR INSERT WITH CHECK (
        exists (select 1 from public.stores where id = store_themes.store_id and owner_id = auth.uid())
    );

CREATE POLICY "Store owners can update their theme settings" ON public.store_themes
    FOR UPDATE USING (
        exists (select 1 from public.stores where id = store_themes.store_id and owner_id = auth.uid())
    );

CREATE POLICY "Store owners can remove themes" ON public.store_themes
    FOR DELETE USING (
        exists (select 1 from public.stores where id = store_themes.store_id and owner_id = auth.uid())
    );
