package com.brickworks.settings;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SettingsRepository extends JpaRepository<ApplicationSetting, String> { }
