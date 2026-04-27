package com.ecommerce.Return;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "return_requests")
public class ReturnRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID orderId;

    @Column(nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReturnReason reason;

    @Column(columnDefinition = "TEXT")
    private String itemsJson;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReturnStatus status = ReturnStatus.PENDING;

    private String adminNotes;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public ReturnRequest() {}

    public ReturnRequest(UUID orderId, UUID userId, ReturnReason reason, String itemsJson) {
        this.orderId = orderId;
        this.userId = userId;
        this.reason = reason;
        this.itemsJson = itemsJson;
    }

    public UUID getId()              { return id; }
    public UUID getOrderId()         { return orderId; }
    public UUID getUserId()          { return userId; }
    public ReturnReason getReason()  { return reason; }
    public String getItemsJson()     { return itemsJson; }
    public ReturnStatus getStatus()  { return status; }
    public String getAdminNotes()    { return adminNotes; }
    public Instant getCreatedAt()    { return createdAt; }

    public void setStatus(ReturnStatus status)     { this.status = status; }
    public void setAdminNotes(String adminNotes)   { this.adminNotes = adminNotes; }
}
