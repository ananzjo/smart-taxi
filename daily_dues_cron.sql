-- ==========================================
-- Smart-TAXI: Daily Work Days Generation DB Job
-- ==========================================

-- 1. Create the stored procedure that performs the generation logic
CREATE OR REPLACE PROCEDURE generate_daily_work_days()
LANGUAGE plpgsql
AS $$
DECLARE
    local_date DATE;
BEGIN
    -- Evaluate the exact date in GMT+3 (Asia/Amman timezone used for Jordan logic)
    -- This avoids edge-cases where UTC time causes the date to evaluate incorrectly at 21:00 UTC.
    local_date := (now() AT TIME ZONE 'Asia/Amman')::date;

    -- CONDITION 1: Friday is free of charge (no due will be generated)
    -- PostgreSQL extract(dow from local_date) -> 0=Sunday, 1=Monday ... 5=Friday, 6=Saturday
    IF extract(dow from local_date) = 5 THEN
        RETURN; -- Exit immediately for Fridays
    END IF;

    -- CONDITION 2: Active Car & Active Driver only.
    -- CONDITION 3: Generate due based on the LAST handover daman rate.
    INSERT INTO public.t08_work_days (
        f02_date, 
        f03_car_no, 
        f04_driver_id, 
        f05_daily_amount, 
        f06_is_off_day
    )
    SELECT 
        local_date,                  -- Today's date (GMT+3)
        c.f02_plate_no,              -- Car plate number
        d.f01_id,                    -- Driver UUID
        COALESCE(
            (
                -- Fetch the last agreed daman logic purely matching Car & Driver
                SELECT h.f08_daman 
                FROM public.t04_handover h 
                WHERE h.f04_car_no = c.f02_plate_no 
                  AND h.f05_driver_id = d.f01_id 
                ORDER BY h.f02_date DESC, h.f03_time DESC 
                LIMIT 1
            ), 
            c.f08_standard_rent,     -- Fallback to car's standard rent if NO handover exists at all
            0
        ) AS matched_daman_amount,
        FALSE                        -- is_off_day defaults to false
    FROM public.t01_cars c
    JOIN public.t02_drivers d ON d.f08_car_no = c.f02_plate_no
    WHERE 
        c.f11_is_active = 'نشطة | Active' 
        AND d.f06_status = 'نشط | Active'
        -- Prevent duplicates using exact Date + Car + Driver matchup
        AND NOT EXISTS (
            SELECT 1 
            FROM public.t08_work_days w 
            WHERE w.f02_date = local_date 
              AND w.f03_car_no = c.f02_plate_no
              AND w.f04_driver_id = d.f01_id
        );
END;
$$;

-- 2. Schedule the Cron Job (Using pg_cron)
-- We run it at 21:00 UTC, which equals EXACTLY 12:00 AM (Midnight) GMT+3
-- Make sure the `pg_cron` extension is enabled in your Supabase Dashboard before running this.
SELECT cron.schedule(
    'generate-smarttaxi-daily-dues',   -- Unique job identifier
    '0 21 * * *',                      -- Cron expression: Minute 0, Hour 21 (UTC)
    'CALL generate_daily_work_days();' -- Command to execute
);
