-- Allow 'custom' and 'legal' types in store_pages table

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'store_pages_type_check') THEN
        ALTER TABLE store_pages DROP CONSTRAINT store_pages_type_check;
    END IF;
END $$;

ALTER TABLE store_pages
ADD CONSTRAINT store_pages_type_check 
CHECK (type IN ('system', 'custom', 'legal'));
