-- ============================================
-- PANTRY CAULDRON - Complete Database Schema
-- ============================================
-- Run this entire file in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE 1: User Profiles
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    username TEXT,
    avatar_url TEXT,
    allergies TEXT[] DEFAULT '{}',
    dietary_restrictions TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLE 2: Pantry Items
-- ============================================
CREATE TABLE IF NOT EXISTS public.pantry_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'Other',
    quantity NUMERIC DEFAULT 1,
    unit TEXT DEFAULT 'piece',
    added_date DATE DEFAULT CURRENT_DATE,
    shelf_life_days INTEGER,
    expires_at DATE GENERATED ALWAYS AS (added_date + shelf_life_days) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLE 3: Consumption Log (For nudges)
-- ============================================
CREATE TABLE IF NOT EXISTS public.consumption_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    quantity NUMERIC DEFAULT 1,
    unit TEXT DEFAULT 'piece',
    consumed_at DATE DEFAULT CURRENT_DATE,
    recipe_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLE 4: Saved Recipes
-- ============================================
CREATE TABLE IF NOT EXISTS public.saved_recipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    recipe_id TEXT NOT NULL,
    recipe_title TEXT NOT NULL,
    recipe_image TEXT,
    ingredients_used JSONB,
    missing_ingredients JSONB,
    cooked_count INTEGER DEFAULT 0,
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLE 5: Shopping List
-- ============================================
CREATE TABLE IF NOT EXISTS public.shopping_list (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    quantity NUMERIC DEFAULT 1,
    unit TEXT DEFAULT 'piece',
    is_purchased BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLE 6: Notifications Queue
-- ============================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'expiry',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SECURITY: Row Level Security Policies
-- ============================================

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Pantry Items
ALTER TABLE public.pantry_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own pantry items" ON public.pantry_items
    FOR ALL USING (auth.uid() = user_id);

-- Consumption Log
ALTER TABLE public.consumption_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own consumption log" ON public.consumption_log
    FOR ALL USING (auth.uid() = user_id);

-- Saved Recipes
ALTER TABLE public.saved_recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own saved recipes" ON public.saved_recipes
    FOR ALL USING (auth.uid() = user_id);

-- Shopping List
ALTER TABLE public.shopping_list ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own shopping list" ON public.shopping_list
    FOR ALL USING (auth.uid() = user_id);

-- Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own notifications" ON public.notifications
    FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function: Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, created_at)
    VALUES (NEW.id, NEW.email, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function: Cook recipe (subtract ingredients + log consumption)
CREATE OR REPLACE FUNCTION public.cook_recipe(
    p_recipe_id TEXT,
    p_recipe_title TEXT,
    p_ingredients JSONB
)
RETURNS JSONB AS $$
DECLARE
    ingredient_record RECORD;
    v_user_id UUID;
BEGIN
    -- Get current user
    v_user_id := auth.uid();
    
    -- Loop through and subtract each ingredient
    FOR ingredient_record IN 
        SELECT * FROM jsonb_to_recordset(p_ingredients) AS x(name TEXT, quantity NUMERIC, unit TEXT)
    LOOP
        -- Subtract from pantry
        UPDATE public.pantry_items
        SET quantity = quantity - ingredient_record.quantity
        WHERE user_id = v_user_id 
          AND LOWER(name) = LOWER(ingredient_record.name)
          AND quantity >= ingredient_record.quantity;
        
        -- Log consumption
        INSERT INTO public.consumption_log (user_id, item_name, quantity, unit, recipe_id)
        VALUES (v_user_id, ingredient_record.name, ingredient_record.quantity, ingredient_record.unit, p_recipe_id);
    END LOOP;
    
    -- Save recipe to history
    INSERT INTO public.saved_recipes (user_id, recipe_id, recipe_title, ingredients_used, cooked_count)
    VALUES (v_user_id, p_recipe_id, p_recipe_title, p_ingredients, 1)
    ON CONFLICT (user_id, recipe_id) DO UPDATE
    SET cooked_count = saved_recipes.cooked_count + 1;
    
    -- Check if they ate too many eggs (for nudge)
    PERFORM public.check_consumption_nudge(v_user_id);
    
    RETURN jsonb_build_object('success', true, 'message', 'Recipe cooked and logged!');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check for consumption nudges
CREATE OR REPLACE FUNCTION public.check_consumption_nudge(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    egg_count NUMERIC;
    veggie_count NUMERIC;
BEGIN
    -- Check eggs in last 7 days
    SELECT COALESCE(SUM(quantity), 0) INTO egg_count
    FROM public.consumption_log
    WHERE user_id = p_user_id 
      AND LOWER(item_name) LIKE '%egg%'
      AND consumed_at > NOW() - INTERVAL '7 days';
    
    IF egg_count > 12 THEN
        INSERT INTO public.notifications (user_id, title, message, type)
        VALUES (p_user_id, '🥚 Egg-cellent week!', 
                'Wow, you ate ' || egg_count || ' eggs this week! Want to try some oatmeal tomorrow?', 
                'nudge');
    END IF;
    
    -- Check veggies in last 14 days
    SELECT COALESCE(SUM(quantity), 0) INTO veggie_count
    FROM public.consumption_log
    WHERE user_id = p_user_id 
      AND item_name IN ('spinach', 'broccoli', 'kale', 'lettuce', 'cucumber', 'tomato')
      AND consumed_at > NOW() - INTERVAL '14 days';
    
    IF veggie_count = 0 THEN
        INSERT INTO public.notifications (user_id, title, message, type)
        VALUES (p_user_id, '🌿 Missing your greens?', 
                'No veggies in 2 weeks! Your spinach is waiting for you 💚', 
                'nudge');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check expiring items daily (call via cron)
CREATE OR REPLACE FUNCTION public.check_expiring_items()
RETURNS TABLE(user_id UUID, expiring_items JSONB) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.user_id,
        jsonb_agg(jsonb_build_object(
            'name', p.name,
            'expires_at', p.expires_at,
            'days_left', (p.expires_at - CURRENT_DATE)
        ))
    FROM public.pantry_items p
    WHERE p.expires_at IS NOT NULL
      AND p.expires_at BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '2 days'
      AND p.quantity > 0
    GROUP BY p.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- INDEXES for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_pantry_user_id ON public.pantry_items(user_id);
CREATE INDEX IF NOT EXISTS idx_pantry_expires ON public.pantry_items(expires_at);
CREATE INDEX IF NOT EXISTS idx_consumption_user_date ON public.consumption_log(user_id, consumed_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read);

-- ============================================
-- SAMPLE DATA (Optional - remove in production)
-- ============================================
INSERT INTO public.pantry_items (user_id, name, category, quantity, unit, shelf_life_days)
SELECT 
    id, 
    'Eggs', 
    'Dairy & Fish', 
    12, 
    'pieces', 
    30
FROM auth.users LIMIT 1
ON CONFLICT DO NOTHING;