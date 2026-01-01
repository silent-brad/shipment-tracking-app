package com.deliverytracker.model;

public enum ShipmentStatus {
    CREATED("Order created"),
    PICKED_UP("Picked up from origin"),
    IN_TRANSIT("In transit"),
    OUT_FOR_DELIVERY("Out for delivery"),
    DELIVERED("Delivered"),
    DELAYED("Delayed"),
    RETURNED("Returned to sender"),
    CANCELLED("Cancelled");
    
    private final String displayName;
    
    ShipmentStatus(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
    
    public boolean isTerminal() {
        return this == DELIVERED || this == RETURNED || this == CANCELLED;
    }
    
    public boolean canTransitionTo(ShipmentStatus newStatus) {
        // Prevent transitions from terminal states
        if (this.isTerminal()) {
            return false;
        }
        
        // Allow cancellation from any non-terminal state
        if (newStatus == CANCELLED) {
            return true;
        }
        
        // Define valid transitions
        return switch (this) {
            case CREATED -> newStatus == PICKED_UP || newStatus == DELAYED;
            case PICKED_UP -> newStatus == IN_TRANSIT || newStatus == DELAYED;
            case IN_TRANSIT -> newStatus == OUT_FOR_DELIVERY || newStatus == DELAYED;
            case OUT_FOR_DELIVERY -> newStatus == DELIVERED || newStatus == DELAYED || newStatus == RETURNED;
            case DELAYED -> newStatus == PICKED_UP || newStatus == IN_TRANSIT || newStatus == OUT_FOR_DELIVERY;
            default -> false;
        };
    }
}
