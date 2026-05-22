ALTER TABLE public.audit_logs DISABLE TRIGGER audit_logs_no_update;

UPDATE public.audit_logs 
SET company_id = '6f50b17a-07a7-4e0b-a335-eb1f73b210ab' 
WHERE company_id IS NULL;

ALTER TABLE public.audit_logs ENABLE TRIGGER audit_logs_no_update;
