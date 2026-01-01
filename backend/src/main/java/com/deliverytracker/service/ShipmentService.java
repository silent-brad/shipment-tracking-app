package com.deliverytracker.service;

import com.deliverytracker.dto.ShipmentCreateRequest;
import com.deliverytracker.dto.ShipmentUpdateRequest;
import com.deliverytracker.exception.BusinessException;
import com.deliverytracker.model.Shipment;
import com.deliverytracker.model.ShipmentStatus;
import com.deliverytracker.repository.ShipmentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class ShipmentService {
    
    private static final Logger logger = LoggerFactory.getLogger(ShipmentService.class);
    
    private final ShipmentRepository shipmentRepository;
    private final KafkaProducerService kafkaProducerService;
    
    @Autowired
    public ShipmentService(ShipmentRepository shipmentRepository, KafkaProducerService kafkaProducerService) {
        this.shipmentRepository = shipmentRepository;
        this.kafkaProducerService = kafkaProducerService;
    }
    
    public Shipment createShipment(ShipmentCreateRequest request) {
        logger.info("Creating new shipment from {} to {}", request.getOrigin(), request.getDestination());
        
        Shipment shipment = new Shipment();
        shipment.setOrigin(request.getOrigin());
        shipment.setDestination(request.getDestination());
        shipment.setDescription(request.getDescription());
        shipment.setStatus(ShipmentStatus.CREATED);
        shipment.setTrackingNumber(generateTrackingNumber());
        shipment.setEstimatedDelivery(request.getEstimatedDelivery() != null ? 
            request.getEstimatedDelivery() : LocalDateTime.now().plusDays(3));
        
        Shipment savedShipment = shipmentRepository.save(shipment);
        
        // Publish event to Kafka
        kafkaProducerService.publishShipmentEvent(savedShipment, "SHIPMENT_CREATED");
        
        logger.info("Created shipment with ID: {} and tracking number: {}", 
                    savedShipment.getId(), savedShipment.getTrackingNumber());
        
        return savedShipment;
    }
    
    @Transactional(readOnly = true)
    public List<Shipment> getAllShipments() {
        return shipmentRepository.findAll();
    }
    
    @Transactional(readOnly = true)
    public Page<Shipment> getAllShipments(Pageable pageable) {
        return shipmentRepository.findAll(pageable);
    }
    
    @Transactional(readOnly = true)
    public Optional<Shipment> getShipmentById(Long id) {
        return shipmentRepository.findById(id);
    }
    
    @Transactional(readOnly = true)
    public Optional<Shipment> getShipmentByTrackingNumber(String trackingNumber) {
        return shipmentRepository.findByTrackingNumber(trackingNumber);
    }
    
    public Shipment updateShipmentStatus(Long id, ShipmentUpdateRequest request) {
        Shipment shipment = shipmentRepository.findById(id)
            .orElseThrow(() -> new BusinessException("Shipment not found with ID: " + id));
        
        ShipmentStatus currentStatus = shipment.getStatus();
        ShipmentStatus newStatus = request.getStatus();
        
        if (!currentStatus.canTransitionTo(newStatus)) {
            throw new BusinessException(String.format(
                "Invalid status transition from %s to %s", currentStatus, newStatus));
        }
        
        logger.info("Updating shipment {} status from {} to {}", 
                    id, currentStatus, newStatus);
        
        shipment.setStatus(newStatus);
        Shipment updatedShipment = shipmentRepository.save(shipment);
        
        // Publish event to Kafka
        kafkaProducerService.publishShipmentEvent(updatedShipment, "SHIPMENT_STATUS_UPDATED");
        
        return updatedShipment;
    }
    
    public void deleteShipment(Long id) {
        if (!shipmentRepository.existsById(id)) {
            throw new BusinessException("Shipment not found with ID: " + id);
        }
        
        logger.info("Deleting shipment with ID: {}", id);
        shipmentRepository.deleteById(id);
        
        // Publish event to Kafka
        kafkaProducerService.publishShipmentEvent(null, "SHIPMENT_DELETED", id.toString());
    }
    
    @Transactional(readOnly = true)
    public List<Shipment> getShipmentsByStatus(ShipmentStatus status) {
        return shipmentRepository.findByStatus(status);
    }
    
    @Transactional(readOnly = true)
    public List<Shipment> getOverdueShipments() {
        List<ShipmentStatus> terminalStatuses = List.of(
            ShipmentStatus.DELIVERED, 
            ShipmentStatus.RETURNED, 
            ShipmentStatus.CANCELLED
        );
        return shipmentRepository.findOverdueShipments(LocalDateTime.now(), terminalStatuses);
    }
    
    private String generateTrackingNumber() {
        return "DT" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}
