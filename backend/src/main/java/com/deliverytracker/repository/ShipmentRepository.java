package com.deliverytracker.repository;

import com.deliverytracker.model.Shipment;
import com.deliverytracker.model.ShipmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ShipmentRepository extends JpaRepository<Shipment, Long> {
    
    Optional<Shipment> findByTrackingNumber(String trackingNumber);
    
    List<Shipment> findByStatus(ShipmentStatus status);
    
    Page<Shipment> findByStatusIn(List<ShipmentStatus> statuses, Pageable pageable);
    
    @Query("SELECT s FROM Shipment s WHERE s.origin LIKE %:location% OR s.destination LIKE %:location%")
    List<Shipment> findByLocation(@Param("location") String location);
    
    @Query("SELECT s FROM Shipment s WHERE s.createdAt BETWEEN :start AND :end")
    List<Shipment> findByDateRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    @Query("SELECT s FROM Shipment s WHERE s.estimatedDelivery < :date AND s.status NOT IN :terminalStatuses")
    List<Shipment> findOverdueShipments(@Param("date") LocalDateTime date, @Param("terminalStatuses") List<ShipmentStatus> terminalStatuses);
    
    @Query("SELECT COUNT(s) FROM Shipment s WHERE s.status = :status")
    long countByStatus(@Param("status") ShipmentStatus status);
}
