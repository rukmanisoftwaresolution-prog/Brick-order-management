package com.brickworks.delivery;

import com.brickworks.common.ApiResponse;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/vehicles")
public class VehicleController {
    private final VehicleRepository repository;

    public VehicleController(VehicleRepository repository) { this.repository = repository; }

    @GetMapping
    public ResponseEntity<ApiResponse<List<VehicleView>>> list() {
        List<VehicleView> vehicles = repository.findAll().stream().filter(Vehicle::isActive)
                .map(vehicle -> new VehicleView(vehicle.getId(), vehicle.getVehicleNumber(), vehicle.getDriverName(), vehicle.getDriverMobile()))
                .toList();
        return ResponseEntity.ok(ApiResponse.ok("Vehicles loaded.", vehicles));
    }
}
