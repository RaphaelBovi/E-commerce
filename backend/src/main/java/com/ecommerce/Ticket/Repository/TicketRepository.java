package com.ecommerce.Ticket.Repository;

import com.ecommerce.Ticket.Entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TicketRepository extends JpaRepository<Ticket, UUID> {

    List<Ticket> findByUserIdOrderByUpdatedAtDesc(UUID userId);

    List<Ticket> findAllByOrderByUpdatedAtDesc();

    @Query("SELECT COUNT(t) FROM Ticket t")
    long countAll();

    Optional<Ticket> findByTicketNumber(String ticketNumber);

    void deleteByUserId(UUID userId);
}
