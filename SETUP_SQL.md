# Database Setup

Run this in the Supabase SQL Editor before using the dashboard.

```sql
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.fields (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  crop TEXT,
  variety TEXT,
  planted_at DATE,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  area_m2 DOUBLE PRECISION,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own fields"
  ON public.fields FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.field_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  field_id UUID REFERENCES public.fields(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('diagnosis', 'spray', 'note', 'photo')),
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.field_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own records"
  ON public.field_records FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```
