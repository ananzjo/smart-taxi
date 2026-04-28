-- database_patch_magic.sql
-- Adds columns needed for Magic Match logic

ALTER TABLE public.t08_work_days 
ADD COLUMN IF NOT EXISTS f09_paid_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS f10_status varchar DEFAULT 'Opened | مفتوح';

-- Update existing records logically
-- Assume all revenues with f10_work_day_link have been paid completely to simplify backward compatibility.
-- In a real scenario, a migration script would calculate sums.
