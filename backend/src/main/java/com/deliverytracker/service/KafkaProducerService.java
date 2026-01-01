package com.deliverytracker.service;

import com.deliverytracker.model.Shipment;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class KafkaProducerService {
    
    private static final Logger logger = LoggerFactory.getLogger(KafkaProducerService.class);
    private static final String TOPIC_NAME = "shipment-events";
    
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    
    @Autowired
    public KafkaProducerService(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }
    
    public void publishShipmentEvent(Shipment shipment, String eventType) {
        publishShipmentEvent(shipment, eventType, null);
    }
    
    public void publishShipmentEvent(Shipment shipment, String eventType, String additionalData) {
        try {
            Map<String, Object> event = new HashMap<>();
            event.put("eventType", eventType);
            event.put("timestamp", LocalDateTime.now());
            
            if (shipment != null) {
                event.put("shipment", shipment);
            }
            
            if (additionalData != null) {
                event.put("additionalData", additionalData);
            }
            
            String eventJson = objectMapper.writeValueAsString(event);
            
            kafkaTemplate.send(TOPIC_NAME, eventJson)
                .whenComplete((result, failure) -> {
                    if (failure != null) {
                        logger.error("Failed to send event to Kafka: {}", failure.getMessage(), failure);
                    } else {
                        logger.debug("Successfully sent event to Kafka: {}", eventType);
                    }
                });
            
        } catch (JsonProcessingException e) {
            logger.error("Error serializing shipment event: {}", e.getMessage(), e);
        }
    }
}
