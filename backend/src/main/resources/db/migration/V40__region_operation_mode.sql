-- Region operation mode and salary bounds
ALTER TABLE regions
    ADD COLUMN IF NOT EXISTS operation_mode VARCHAR(30) NOT NULL DEFAULT 'FULL_ACCESS',
    ADD COLUMN IF NOT EXISTS max_salary_rate BIGINT;
