-- V7: 将旧的中文模板分类值更新为枚举名称
UPDATE experiment_templates
SET category = CASE
    WHEN LOWER(category) IN ('pcr', '电泳', 'electrophoresis') THEN 'MOLECULAR'
    WHEN LOWER(category) IN ('发酵工程', 'fermentation') THEN 'CELL'
    ELSE UPPER(category)
END
WHERE UPPER(category) NOT IN ('MOLECULAR', 'CELL', 'PROTEIN', 'IMMUNOLOGY');
