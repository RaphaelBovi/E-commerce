package com.ecommerce.Ticket.Service;

import com.ecommerce.Auth.Entity.User;
import com.ecommerce.Auth.Repository.UserRepository;
import com.ecommerce.Product.Exception.BusinessException;
import com.ecommerce.Product.Exception.ResourceNotFoundException;
import com.ecommerce.Ticket.Entity.Dtos.*;
import com.ecommerce.Ticket.Entity.Ticket;
import com.ecommerce.Ticket.Entity.TicketMessage;
import com.ecommerce.Ticket.Entity.TicketStatus;
import com.ecommerce.Ticket.Repository.TicketRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class TicketService {

    @Autowired private TicketRepository ticketRepo;
    @Autowired private UserRepository userRepo;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepo.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
    }

    private String generateTicketNumber() {
        long count = ticketRepo.countAll() + 1;
        return "TKT-" + String.format("%06d", count);
    }

    // ── User: create ticket ─────────────────────────────────────────
    @Transactional
    public TicketResponse createTicket(CreateTicketRequest req) {
        User user = getCurrentUser();
        Ticket ticket = Ticket.builder()
                .ticketNumber(generateTicketNumber())
                .user(user)
                .subject(req.subject())
                .category(req.category())
                .status(TicketStatus.OPEN)
                .build();

        TicketMessage msg = TicketMessage.builder()
                .ticket(ticket)
                .authorId(user.getId())
                .authorName(user.getFullName())
                .authorRole("CUSTOMER")
                .content(req.message())
                .build();

        ticket.getMessages().add(msg);
        ticketRepo.save(ticket);
        return TicketResponse.from(ticket);
    }

    // ── User: list own tickets ──────────────────────────────────────
    public List<TicketResponse> getMyTickets() {
        User user = getCurrentUser();
        return ticketRepo.findByUserIdOrderByUpdatedAtDesc(user.getId())
                .stream().map(TicketResponse::from).toList();
    }

    // ── User: get own ticket by id ──────────────────────────────────
    public TicketResponse getMyTicket(UUID ticketId) {
        User user = getCurrentUser();
        Ticket ticket = ticketRepo.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket não encontrado"));
        if (!ticket.getUser().getId().equals(user.getId())) {
            throw new BusinessException("Acesso negado");
        }
        return TicketResponse.from(ticket);
    }

    // ── User: reply to own ticket ──────────────────────────────────
    @Transactional
    public TicketResponse replyMyTicket(UUID ticketId, ReplyTicketRequest req) {
        User user = getCurrentUser();
        Ticket ticket = ticketRepo.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket não encontrado"));
        if (!ticket.getUser().getId().equals(user.getId())) {
            throw new BusinessException("Acesso negado");
        }
        if (ticket.getStatus() == TicketStatus.CLOSED) {
            throw new BusinessException("Este ticket está encerrado");
        }
        ticket.getMessages().add(TicketMessage.builder()
                .ticket(ticket)
                .authorId(user.getId())
                .authorName(user.getFullName())
                .authorRole("CUSTOMER")
                .content(req.message())
                .build());
        ticket.setStatus(TicketStatus.OPEN);
        ticketRepo.save(ticket);
        return TicketResponse.from(ticket);
    }

    // ── Admin: list all tickets ─────────────────────────────────────
    public List<TicketResponse> getAllTickets() {
        return ticketRepo.findAllByOrderByUpdatedAtDesc()
                .stream().map(TicketResponse::from).toList();
    }

    // ── Admin: get ticket by id ─────────────────────────────────────
    public TicketResponse getTicket(UUID ticketId) {
        return TicketResponse.from(ticketRepo.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket não encontrado")));
    }

    // ── Admin: update status ────────────────────────────────────────
    @Transactional
    public TicketResponse updateStatus(UUID ticketId, UpdateTicketStatusRequest req) {
        Ticket ticket = ticketRepo.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket não encontrado"));
        ticket.setStatus(req.status());
        return TicketResponse.from(ticketRepo.save(ticket));
    }

    // ── Admin: reply to ticket ──────────────────────────────────────
    @Transactional
    public TicketResponse adminReply(UUID ticketId, ReplyTicketRequest req) {
        User admin = getCurrentUser();
        Ticket ticket = ticketRepo.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket não encontrado"));
        ticket.getMessages().add(TicketMessage.builder()
                .ticket(ticket)
                .authorId(admin.getId())
                .authorName(admin.getFullName())
                .authorRole("SUPPORT")
                .content(req.message())
                .build());
        ticket.setStatus(TicketStatus.AWAITING_RESPONSE);
        return TicketResponse.from(ticketRepo.save(ticket));
    }

    // ── Admin: delete ticket ────────────────────────────────────────
    @Transactional
    public void deleteTicket(UUID ticketId) {
        if (!ticketRepo.existsById(ticketId)) {
            throw new ResourceNotFoundException("Ticket não encontrado");
        }
        ticketRepo.deleteById(ticketId);
    }
}
