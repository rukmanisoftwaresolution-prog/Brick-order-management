package com.brickworks.settings;

import com.brickworks.common.ConflictException;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class SettingsService {
    private static final Set<String> PLANT_STATUSES = Set.of("OPERATIONAL", "ATTENTION", "OFFLINE");
    private final SettingsRepository repository;

    public SettingsService(SettingsRepository repository) { this.repository = repository; }

    @Transactional(readOnly = true)
    public SettingsView get() {
        return new SettingsView(value("profileName", "Aarav Kumar"), value("profileEmail", ""),
                value("mobileNumber", ""), "Administrator", value("plantName", "North plant"),
                value("plantAddress", ""), value("plantStatus", "OPERATIONAL"));
    }

    public SettingsView update(SettingsRequest request) {
        String status = request.plantStatus().trim().toUpperCase();
        if (!PLANT_STATUSES.contains(status)) {
            throw new ConflictException("Plant status must be OPERATIONAL, ATTENTION or OFFLINE.");
        }
        save("profileName", request.profileName().trim());
        save("profileEmail", request.profileEmail().trim());
        save("mobileNumber", normalize(request.mobileNumber()));
        save("plantName", request.plantName().trim());
        save("plantAddress", normalize(request.plantAddress()));
        save("plantStatus", status);
        return get();
    }

    private String value(String key, String fallback) {
        return repository.findById(key).map(ApplicationSetting::getValue).orElse(fallback);
    }

    private void save(String key, String value) {
        ApplicationSetting setting = repository.findById(key).orElseGet(() -> new ApplicationSetting(key, value));
        setting.setValue(value);
        repository.save(setting);
    }

    private String normalize(String value) { return value == null ? "" : value.trim(); }
}
