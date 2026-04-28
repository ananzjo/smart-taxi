-- database_patch_cashflow.sql
-- Creates the cash flow ledger table

CREATE TABLE IF NOT EXISTS public.t12_cashflow (
    f01_id        uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    f02_date      date NOT NULL,
    f03_type      varchar NOT NULL,
    -- Types: 'REVENUE_CASH' | 'REVENUE_BANK' | 'EXPENSE_CASH' | 'EXPENSE_BANK'
    --        'DEPOSIT'       (cash → bank)
    --        'WITHDRAW'      (bank → cash)
    --        'MANUAL_CASH_IN' | 'MANUAL_CASH_OUT'
    --        'MANUAL_BANK_IN' | 'MANUAL_BANK_OUT'

    f04_account   varchar NOT NULL CHECK (f04_account IN ('CASH', 'BANK')),
    f05_direction varchar NOT NULL CHECK (f05_direction IN ('IN', 'OUT')),
    f06_amount    numeric NOT NULL CHECK (f06_amount > 0),
    f07_description varchar,
    f08_notes     text,
    f09_staff_id  uuid REFERENCES public.t11_staff(f01_id) ON DELETE SET NULL,
    f10_ref_id    uuid,   -- optional link to revenue / expense record
    created_at    timestamptz DEFAULT now()
);

-- Index for fast balance computation
CREATE INDEX IF NOT EXISTS idx_cashflow_account ON public.t12_cashflow(f04_account, f05_direction);
CREATE INDEX IF NOT EXISTS idx_cashflow_date    ON public.t12_cashflow(f02_date DESC);
