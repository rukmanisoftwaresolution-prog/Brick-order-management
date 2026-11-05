package com.brickworks.delivery;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "vehicles")
public class Vehicle {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "vehicle_number", nullable = false, unique = true, length = 20)
    private String vehicleNumber;
    @Column(name = "driver_name", nullable = false, length = 120)
    private String driverName;
    @Column(name = "driver_mobile", length = 20)
    private String driverMobile;
    @Column(nullable = false)
    private boolean active;

    protected Vehicle() { }
    public Long getId() { return id; }
    public String getVehicleNumber() { return vehicleNumber; }
    public String getDriverName() { return driverName; }
    public String getDriverMobile() { return driverMobile; }
    public boolean isActive() { return active; }
}
