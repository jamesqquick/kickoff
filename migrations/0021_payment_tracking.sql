-- Optional registration fee on tournaments (cents, nullable = free/unset)
ALTER TABLE tournaments ADD COLUMN registration_fee INTEGER;

-- Manual payment tracking on registrations
ALTER TABLE tournament_registrations ADD COLUMN paid_at INTEGER;  -- epoch ms; null = unpaid
ALTER TABLE tournament_registrations ADD COLUMN paid_note TEXT;   -- director's reference, e.g. "Venmo 7/15 #1234"
