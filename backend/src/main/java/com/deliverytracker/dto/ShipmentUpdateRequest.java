package com.deliverytracker.dto;

import com.deliverytracker.model.ShipmentStatus;
import jakarta.validation.constraints.NotNull;

public class ShipmentUpdateRequest {
    
    @NotNull(message = "Status is required")
    private ShipmentStatus status;
    
    public ShipmentUpdateRequest() {}
    
    public ShipmentUpdateRequest(ShipmentStatus status) {
        this.status = status;
    }
    
    public ShipmentStatus getStatus() {
        return status;
    }
    
    public void setStatus(ShipmentStatus status) {
        this.status = status;
    }
}
