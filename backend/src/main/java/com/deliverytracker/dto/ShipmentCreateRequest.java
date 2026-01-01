package com.deliverytracker.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public class ShipmentCreateRequest {
    
    @NotBlank(message = "Origin is required")
    @Size(min = 3, max = 100, message = "Origin must be between 3 and 100 characters")
    private String origin;
    
    @NotBlank(message = "Destination is required")
    @Size(min = 3, max = 100, message = "Destination must be between 3 and 100 characters")
    private String destination;
    
    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;
    
    private LocalDateTime estimatedDelivery;
    
    public ShipmentCreateRequest() {}
    
    public ShipmentCreateRequest(String origin, String destination) {
        this.origin = origin;
        this.destination = destination;
    }
    
    public String getOrigin() {
        return origin;
    }
    
    public void setOrigin(String origin) {
        this.origin = origin;
    }
    
    public String getDestination() {
        return destination;
    }
    
    public void setDestination(String destination) {
        this.destination = destination;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public LocalDateTime getEstimatedDelivery() {
        return estimatedDelivery;
    }
    
    public void setEstimatedDelivery(LocalDateTime estimatedDelivery) {
        this.estimatedDelivery = estimatedDelivery;
    }
}
