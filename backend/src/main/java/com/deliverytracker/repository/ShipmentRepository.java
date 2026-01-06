package com.deliverytracker.repository;

import com.deliverytracker.model.Shipment;
import com.deliverytracker.model.ShipmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ShipmentRepository extends MongoRepository<Shipment, String> {
    
    Optional<Shipment> findByTrackingNumber(String trackingNumber);
    
    List<Shipment> findByStatus(ShipmentStatus status);
    
    Page<Shipment> findByStatusIn(List<ShipmentStatus> statuses, Pageable pageable);
    
    @Query("{ $or: [ { 'origin': { $regex: ?0, $options: 'i' } }, { 'destination': { $regex: ?0, $options: 'i' } } ] }")
    List<Shipment> findByLocation(String location);
    
    @Query("{ 'createdAt': { $gte: ?0, $lte: ?1 } }")
    List<Shipment> findByDateRange(LocalDateTime start, LocalDateTime end);
    
    @Query("{ 'estimatedDelivery': { $lt: ?0 }, 'status': { $nin: ?1 } }")
    List<Shipment> findOverdueShipments(LocalDateTime date, List<ShipmentStatus> terminalStatuses);
    
    @Query(value = "{ 'status': ?0 }", count = true)
    long countByStatus(ShipmentStatus status);
}
