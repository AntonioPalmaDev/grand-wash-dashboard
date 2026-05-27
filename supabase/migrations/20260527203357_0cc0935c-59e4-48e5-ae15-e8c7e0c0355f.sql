UPDATE public.operations 
SET 
  taxa_percentual = 0,
  lucro_bruto = valor_bruto,
  custo_maquina = 0,
  lucro_liquido = valor_bruto,
  valor_cliente = 0
WHERE category = 'itens';