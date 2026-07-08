
-- SALES: allow gestao to update
DROP POLICY IF EXISTS "sales_update_owner_or_admin" ON public.sales;

CREATE POLICY "sales_update_owner_or_admin"
ON public.sales
FOR UPDATE
TO authenticated
USING (
  auth.uid() = created_by
  OR public.has_role(auth.uid(), 'admin_master'::app_role)
  OR public.has_role(auth.uid(), 'desenvolvedor'::app_role)
  OR public.has_role(auth.uid(), 'gestao'::app_role)
)
WITH CHECK (
  auth.uid() = created_by
  OR public.has_role(auth.uid(), 'admin_master'::app_role)
  OR public.has_role(auth.uid(), 'desenvolvedor'::app_role)
  OR public.has_role(auth.uid(), 'gestao'::app_role)
);

-- SALE_ITEMS: mirror the same rule
DROP POLICY IF EXISTS "sale_items_modify_via_sale" ON public.sale_items;

CREATE POLICY "sale_items_modify_via_sale"
ON public.sale_items
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.sales s
  WHERE s.id = sale_items.sale_id
    AND (
      auth.uid() = s.created_by
      OR public.has_role(auth.uid(), 'admin_master'::app_role)
      OR public.has_role(auth.uid(), 'desenvolvedor'::app_role)
      OR public.has_role(auth.uid(), 'gestao'::app_role)
    )
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.sales s
  WHERE s.id = sale_items.sale_id
    AND (
      auth.uid() = s.created_by
      OR public.has_role(auth.uid(), 'admin_master'::app_role)
      OR public.has_role(auth.uid(), 'desenvolvedor'::app_role)
      OR public.has_role(auth.uid(), 'gestao'::app_role)
    )
));

-- SALE_ITEM_COMPONENTS: mirror the same rule
DROP POLICY IF EXISTS "sic_modify_via_item" ON public.sale_item_components;

CREATE POLICY "sic_modify_via_item"
ON public.sale_item_components
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.sale_items si
  JOIN public.sales s ON s.id = si.sale_id
  WHERE si.id = sale_item_components.sale_item_id
    AND (
      auth.uid() = s.created_by
      OR public.has_role(auth.uid(), 'admin_master'::app_role)
      OR public.has_role(auth.uid(), 'desenvolvedor'::app_role)
      OR public.has_role(auth.uid(), 'gestao'::app_role)
    )
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.sale_items si
  JOIN public.sales s ON s.id = si.sale_id
  WHERE si.id = sale_item_components.sale_item_id
    AND (
      auth.uid() = s.created_by
      OR public.has_role(auth.uid(), 'admin_master'::app_role)
      OR public.has_role(auth.uid(), 'desenvolvedor'::app_role)
      OR public.has_role(auth.uid(), 'gestao'::app_role)
    )
));
