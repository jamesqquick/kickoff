-- Remove the stored status column from tournaments.
-- Status is now derived from startDate/endDate at the application layer:
--   upcoming → no startDate, or startDate > today
--   active   → startDate ≤ today ≤ endDate (or no endDate)
--   past     → endDate < today

ALTER TABLE tournaments DROP COLUMN status;
