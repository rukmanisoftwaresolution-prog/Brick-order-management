package com.brickworks.settings;

public record SettingsView(String profileName, String profileEmail, String mobileNumber,
                           String role, String plantName, String plantAddress, String plantStatus) { }
