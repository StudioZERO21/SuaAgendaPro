CREATE POLICY "Backend can manage Mercado Pago account secrets"
ON public.mercado_pago_account_secrets
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);