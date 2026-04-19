-- 1. Change default for new profiles
ALTER TABLE public.profiles ALTER COLUMN status SET DEFAULT 'approved';

-- 2. Update existing pending users
UPDATE public.profiles SET status = 'approved' WHERE status = 'pending';
