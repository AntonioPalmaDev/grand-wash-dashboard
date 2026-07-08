
DROP POLICY IF EXISTS sales_update_owner_or_admin ON public.sales;
CREATE POLICY sales_update_owner_or_admin ON public.sales
FOR UPDATE
USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin_master'::app_role) OR has_role(auth.uid(), 'desenvolvedor'::app_role))
WITH CHECK (auth.uid() = created_by OR has_role(auth.uid(), 'admin_master'::app_role) OR has_role(auth.uid(), 'desenvolvedor'::app_role));

DROP POLICY IF EXISTS sales_delete_dev ON public.sales;
CREATE POLICY sales_delete_owner_or_dev ON public.sales
FOR DELETE
USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin_master'::app_role) OR has_role(auth.uid(), 'desenvolvedor'::app_role));

DROP POLICY IF EXISTS sale_items_modify_via_sale ON public.sale_items;
CREATE POLICY sale_items_modify_via_sale ON public.sale_items
FOR ALL
USING (EXISTS (SELECT 1 FROM public.sales s WHERE s.id = sale_items.sale_id AND (auth.uid() = s.created_by OR has_role(auth.uid(), 'admin_master'::app_role) OR has_role(auth.uid(), 'desenvolvedor'::app_role))))
WITH CHECK (EXISTS (SELECT 1 FROM public.sales s WHERE s.id = sale_items.sale_id AND (auth.uid() = s.created_by OR has_role(auth.uid(), 'admin_master'::app_role) OR has_role(auth.uid(), 'desenvolvedor'::app_role))));

DROP POLICY IF EXISTS sic_modify_via_item ON public.sale_item_components;
CREATE POLICY sic_modify_via_item ON public.sale_item_components
FOR ALL
USING (EXISTS (SELECT 1 FROM public.sale_items si JOIN public.sales s ON s.id = si.sale_id WHERE si.id = sale_item_components.sale_item_id AND (auth.uid() = s.created_by OR has_role(auth.uid(), 'admin_master'::app_role) OR has_role(auth.uid(), 'desenvolvedor'::app_role))))
WITH CHECK (EXISTS (SELECT 1 FROM public.sale_items si JOIN public.sales s ON s.id = si.sale_id WHERE si.id = sale_item_components.sale_item_id AND (auth.uid() = s.created_by OR has_role(auth.uid(), 'admin_master'::app_role) OR has_role(auth.uid(), 'desenvolvedor'::app_role))));
