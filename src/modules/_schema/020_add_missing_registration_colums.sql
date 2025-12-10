ALTER TABLE registration_settings
    ADD COLUMN require_approval_r1 INTEGER DEFAULT 0;

ALTER TABLE registration_settings
    ADD COLUMN require_approval_r2 INTEGER DEFAULT 0;

ALTER TABLE registration_settings
    ADD COLUMN require_approval_r3 INTEGER DEFAULT 0;
