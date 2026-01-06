package com.deliverytracker.controller;

import com.deliverytracker.dto.ShipmentCreateRequest;
import com.deliverytracker.dto.ShipmentUpdateRequest;
import com.deliverytracker.model.Shipment;
import com.deliverytracker.model.ShipmentStatus;
import com.deliverytracker.service.ShipmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/shipments")
@CrossOrigin(origins = "*", maxAge = 3600)
@Tag(name = "Shipments", description = "Shipment management API")
public class ShipmentController {
    
    private final ShipmentService shipmentService;
    
    @Autowired
    public ShipmentController(ShipmentService shipmentService) {
        this.shipmentService = shipmentService;
    }
    
    @PostMapping
    @Operation(summary = "Create a new shipment")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Shipment created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid request data"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<Shipment> createShipment(@Valid @RequestBody ShipmentCreateRequest request) {
        Shipment shipment = shipmentService.createShipment(request);
        return new ResponseEntity<>(shipment, HttpStatus.CREATED);
    }
    
    @GetMapping
    @Operation(summary = "Get all shipments with pagination")
    @ApiResponse(responseCode = "200", description = "Shipments retrieved successfully")
    public ResponseEntity<Page<Shipment>> getAllShipments(Pageable pageable) {
        Page<Shipment> shipments = shipmentService.getAllShipments(pageable);
        return ResponseEntity.ok(shipments);
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Get shipment by ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Shipment found"),
        @ApiResponse(responseCode = "404", description = "Shipment not found")
    })
    public ResponseEntity<Shipment> getShipmentById(
            @Parameter(description = "Shipment ID") @PathVariable String id) {
        return shipmentService.getShipmentById(id)
            .map(shipment -> ResponseEntity.ok(shipment))
            .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/track/{trackingNumber}")
    @Operation(summary = "Track shipment by tracking number")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Shipment found"),
        @ApiResponse(responseCode = "404", description = "Tracking number not found")
    })
    public ResponseEntity<Shipment> trackShipment(
            @Parameter(description = "Tracking number") @PathVariable String trackingNumber) {
        return shipmentService.getShipmentByTrackingNumber(trackingNumber)
            .map(shipment -> ResponseEntity.ok(shipment))
            .orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/{id}/status")
    @Operation(summary = "Update shipment status")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Status updated successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid status transition"),
        @ApiResponse(responseCode = "404", description = "Shipment not found")
    })
    public ResponseEntity<Shipment> updateShipmentStatus(
            @Parameter(description = "Shipment ID") @PathVariable String id,
            @Valid @RequestBody ShipmentUpdateRequest request) {
        Shipment updatedShipment = shipmentService.updateShipmentStatus(id, request);
        return ResponseEntity.ok(updatedShipment);
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a shipment")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Shipment deleted successfully"),
        @ApiResponse(responseCode = "404", description = "Shipment not found")
    })
    public ResponseEntity<Void> deleteShipment(
            @Parameter(description = "Shipment ID") @PathVariable String id) {
        shipmentService.deleteShipment(id);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/status/{status}")
    @Operation(summary = "Get shipments by status")
    @ApiResponse(responseCode = "200", description = "Shipments retrieved successfully")
    public ResponseEntity<List<Shipment>> getShipmentsByStatus(
            @Parameter(description = "Shipment status") @PathVariable ShipmentStatus status) {
        List<Shipment> shipments = shipmentService.getShipmentsByStatus(status);
        return ResponseEntity.ok(shipments);
    }
    
    @GetMapping("/overdue")
    @Operation(summary = "Get overdue shipments")
    @ApiResponse(responseCode = "200", description = "Overdue shipments retrieved successfully")
    public ResponseEntity<List<Shipment>> getOverdueShipments() {
        List<Shipment> overdueShipments = shipmentService.getOverdueShipments();
        return ResponseEntity.ok(overdueShipments);
    }
}
