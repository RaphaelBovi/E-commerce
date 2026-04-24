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
@RequestMapping("/api/tickets")
public class TicketController {

    @Autowired
    private TicketService ticketService;

    @GetMapping
    public List<TicketResponse> myTickets() {
        return ticketService.getMyTickets();
    }

    @GetMapping("/{id}")
    public TicketResponse myTicket(@PathVariable UUID id) {
        return ticketService.getMyTicket(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TicketResponse create(@Valid @RequestBody CreateTicketRequest req) {
        return ticketService.createTicket(req);
    }

    @PostMapping("/{id}/reply")
    public TicketResponse reply(@PathVariable UUID id,
                                @Valid @RequestBody ReplyTicketRequest req) {
        return ticketService.replyMyTicket(id, req);
    }
}
