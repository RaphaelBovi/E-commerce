package com.ecommerce.Ticket.Controller;

import com.ecommerce.Ticket.Entity.Dtos.*;
import com.ecommerce.Ticket.Service.TicketService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/tickets")
public class AdminTicketController {

    @Autowired
    private TicketService ticketService;

    @GetMapping
    public List<TicketResponse> all() {
        return ticketService.getAllTickets();
    }

    @GetMapping("/{id}")
    public TicketResponse get(@PathVariable UUID id) {
        return ticketService.getTicket(id);
    }

    @PatchMapping("/{id}/status")
    public TicketResponse updateStatus(@PathVariable UUID id,
                                       @Valid @RequestBody UpdateTicketStatusRequest req) {
        return ticketService.updateStatus(id, req);
    }

    @PostMapping("/{id}/reply")
    public TicketResponse reply(@PathVariable UUID id,
                                @Valid @RequestBody ReplyTicketRequest req) {
        return ticketService.adminReply(id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        ticketService.deleteTicket(id);
    }
}
