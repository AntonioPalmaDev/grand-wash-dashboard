
-- Restrict operation deletion to devs only
DROP POLICY IF EXISTS "All authenticated can delete operations" ON public.operations;
CREATE POLICY "Devs can delete operations"
ON public.operations
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'desenvolvedor'));

-- Allow devs to delete audit logs
CREATE POLICY "Devs can delete audit logs"
ON public.audit_logs
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'desenvolvedor'));
