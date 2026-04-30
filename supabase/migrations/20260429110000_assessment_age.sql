-- Assessment results need to store age + country at the time of test so we
-- can plot "your child vs UK average / international average" by age group
-- on the results screen, and so historical results don't drift if the
-- child's age changes between attempts.
ALTER TABLE assessment_results
  ADD COLUMN IF NOT EXISTS age_months INT,
  ADD COLUMN IF NOT EXISTS age_years NUMERIC(3,1),
  ADD COLUMN IF NOT EXISTS country_code TEXT;

CREATE INDEX IF NOT EXISTS idx_assessment_age_country ON assessment_results(age_months, country_code);
