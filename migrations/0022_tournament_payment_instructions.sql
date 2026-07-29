-- Payment instructions directors can set per tournament.
-- Free text shown to coaches on the register page and registration status card.
-- e.g. "Venmo: @jordan · Memo: 'Fall Championship — [team name]' · Due within 7 days."
ALTER TABLE tournaments ADD COLUMN payment_instructions TEXT;
