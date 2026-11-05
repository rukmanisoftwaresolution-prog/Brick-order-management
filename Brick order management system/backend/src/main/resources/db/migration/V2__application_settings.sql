CREATE TABLE app_settings (
    setting_key VARCHAR(80) PRIMARY KEY,
    setting_value VARCHAR(500) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
