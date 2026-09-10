-- Scanned products carry two things the pantry had nowhere to put: the barcode
-- that identified them, and the photo Open Food Facts holds for them.
--
-- The barcode is what lets a second scan of the same tin raise the count
-- instead of adding a duplicate row, so it is indexed per user.
--
-- Safe to run on an existing database; it changes no existing rows.

ALTER TABLE public.pantry_items
  ADD COLUMN IF NOT EXISTS barcode   TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT;

CREATE INDEX IF NOT EXISTS pantry_items_user_barcode_idx
  ON public.pantry_items (user_id, barcode)
  WHERE barcode IS NOT NULL;
