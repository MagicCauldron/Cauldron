-- Categories were seven values hardcoded in the page, which meant nobody could
-- keep a pantry that did not look like the developer's. They live in the
-- database now, one set per user, ordered by position so the wheel is stable
-- between visits.
--
-- The wheel divides a full circle by however many rows are here, so adding an
-- eighth category is a row, not a code change.

CREATE TABLE IF NOT EXISTS public.categories (
    id       UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id  UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    label    TEXT NOT NULL,
    emoji    TEXT NOT NULL DEFAULT '🧺',
    color    TEXT NOT NULL DEFAULT '#9B6EC8',
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, label)
);

CREATE INDEX IF NOT EXISTS categories_user_position_idx
  ON public.categories (user_id, position);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read their own categories"   ON public.categories;
DROP POLICY IF EXISTS "Users insert their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users update their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users delete their own categories" ON public.categories;

CREATE POLICY "Users read their own categories"
  ON public.categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert their own categories"
  ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update their own categories"
  ON public.categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete their own categories"
  ON public.categories FOR DELETE USING (auth.uid() = user_id);
