# 🛡️ Database Security & Protection Guide (Supabase)

Since you are using **Supabase** to power the Smart Taxi system, implementing robust security is essential to protect your financial and fleet data. Here is the professional recommendation for securing your database.

## 1. Enable Row Level Security (RLS)
By default, anyone with your `Anon Key` and `URL` can read/write your data if RLS is disabled. Enabling RLS is the **First Line of Defense**.

### How to Enable:
1. Go to the **Authentication > Policies** section in your Supabase Dashboard.
2. Select each table (e.g., `t01_cars`, `t05_revenues`) and click **Enable RLS**.
3. Create policies to define who can access what.

---

## 2. Transition to Supabase Auth (Recommended)
Currently, your login logic is "Frontend-Only" (checking a staff table). For true security, you should use **Supabase Authentication**.

### Benefits:
- **`auth.uid()`**: You can restrict records so a staff member can only see their own collections.
- **Role-Based Access**: Create policies like:
  ```sql
  -- Allow only authenticated users to see revenue
  CREATE POLICY "Allow authenticated read" 
  ON t05_revenues FOR SELECT 
  TO authenticated 
  USING (true);
  ```
- **JWT Security**: Supabase Auth issues a secure token that is automatically sent with every request, proving the user is who they say they are.

---

## 3. Secure Your API Keys
- **Anon Key**: This is public-safe **ONLY IF RLS is enabled**. It identifies the user as "Anonymous."
- **Service Role Key**: **NEVER** include this in your `.js` files. It bypasses all RLS and gives full admin access. If leaked, your entire database is at risk.

---

## 4. Input Validation (Database Level)
Don't rely only on the frontend for validation. Use **Check Constraints** in SQL:
- Ensure `f06_amount` is always positive.
- Ensure `f02_date` is not in the far future.
- **Example SQL**:
  ```sql
  ALTER TABLE t05_revenues 
  ADD CONSTRAINT amount_positive CHECK (f06_amount >= 0);
  ```

---

## 5. Audit Logging
You already have a `login_logs` table. Expand this logic using **Database Triggers** to log who changed a financial record.
- If a user deletes a Revenue record, the database can automatically save a copy in a `deleted_history` table for forensic review.

---

## 6. Use Views for Sensitive Data
If you have a table with sensitive staff info (like salaries or home addresses), don't fetch the whole table. Create a **Database View** that only shows names and IDs, and have the frontend fetch from that view instead.

---

## 🎯 Immediate Next Steps:
1. **Enable RLS** on all tables in the Supabase Dashboard.
2. Create a "Full Access" policy for your current `Anon` key temporarily if you need it to work while you set up Auth.
3. Consider moving the `f03_password` column to a separate private table or using **Supabase Auth** to store user credentials securely (hashing is handled by Supabase).

> [!IMPORTANT]
> Storing plain-text passwords in `t11_staff` (as currently implemented) is a high security risk. **Supabase Auth** will solve this by properly hashing all passwords.
