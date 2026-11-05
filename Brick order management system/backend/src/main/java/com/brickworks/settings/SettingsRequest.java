package com.brickworks.settings;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SettingsRequest(
        @NotBlank @Size(max = 120) String profileName,
        @NotBlank @Email @Size(max = 254) String profileEmail,
        @Size(max = 20) String mobileNumber,
        @NotBlank @Size(max = 120) String plantName,
        @Size(max = 250) String plantAddress,
        @NotBlank String plantStatus
) { }
