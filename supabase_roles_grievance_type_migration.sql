-- =========================================================
-- Role Scoped Grievance Type Restriction Migration
-- =========================================================
-- This migration adds an `allowed_grievance_type` column to the `roles` table.
-- When set, users assigned to this role will only be allowed to view
-- and update the status of grievances matching this specific category.
-- Super Admin and Admin roles retain full access across all types.

-- 1. Add `allowed_grievance_type` column to public.roles if it does not exist
ALTER TABLE public.roles 
ADD COLUMN IF NOT EXISTS allowed_grievance_type TEXT DEFAULT NULL;

-- 2. Grant permissions to public roles
GRANT ALL ON TABLE public.roles TO anon, authenticated, service_role;

-- 3. Example role updates (Optional / Customizable):
-- UPDATE public.roles SET allowed_grievance_type = 'Hostel & Accommodation' WHERE name = 'hostel_warden';
-- UPDATE public.roles SET allowed_grievance_type = 'Bus & Transportation' WHERE name = 'transport_incharge';
-- UPDATE public.roles SET allowed_grievance_type = 'Sanitation & Cleanliness' WHERE name = 'sanitation_officer';
