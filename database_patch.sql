-- SQL schema patch for t05_revenues to add f10_work_day_link relationship

ALTER TABLE public.t05_revenues ADD COLUMN IF NOT EXISTS f10_work_day_link uuid;
ALTER TABLE public.t05_revenues ADD CONSTRAINT t05_revenues_f10_work_day_link_fkey FOREIGN KEY (f10_work_day_link) REFERENCES public.t08_work_days(f01_id);
