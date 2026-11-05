package com.brickworks.settings;

import com.brickworks.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/settings")
public class SettingsController {
    private final SettingsService service;

    public SettingsController(SettingsService service) { this.service = service; }

    @GetMapping
    public ResponseEntity<ApiResponse<SettingsView>> get() {
        return ResponseEntity.ok(ApiResponse.ok("Settings loaded.", service.get()));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<SettingsView>> update(@Valid @RequestBody SettingsRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Settings saved.", service.update(request)));
    }
}
