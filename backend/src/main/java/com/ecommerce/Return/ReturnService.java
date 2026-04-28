package com.ecommerce.Return;

import com.ecommerce.Auth.Entity.User;
import com.ecommerce.Order.Entity.Order;
import com.ecommerce.Order.Entity.OrderStatus;
import com.ecommerce.Order.Repository.OrderRepository;
import com.ecommerce.Product.Exception.BusinessException;
import com.ecommerce.Product.Exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
public class ReturnService {

    @Autowired private ReturnRequestRepository repository;
    @Autowired private OrderRepository orderRepository;

    @Transactional
    public ReturnDto create(User user, UUID orderId, ReturnReason reason, String itemsJson) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido não encontrado"));

        if (order.getUser() == null || !order.getUser().getId().equals(user.getId())) {
            throw new BusinessException("Pedido não pertence ao usuário autenticado");
        }
        if (order.getStatus() != OrderStatus.DELIVERED) {
            throw new BusinessException("Devoluções são permitidas apenas para pedidos entregues");
        }
        if (order.getUpdatedAt().isBefore(Instant.now().minus(30, ChronoUnit.DAYS))) {
            throw new BusinessException("O prazo de devolução de 30 dias foi expirado");
        }
        if (repository.existsByOrderId(orderId)) {
            throw new BusinessException("Já existe uma solicitação de devolução para este pedido");
        }

        var req = new ReturnRequest(orderId, user.getId(), reason, itemsJson);
        return ReturnDto.from(repository.save(req));
    }

    @Transactional(readOnly = true)
    public List<ReturnDto> getMyReturns(User user) {
        return repository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream().map(ReturnDto::from).toList();
    }

    @Transactional(readOnly = true)
    public List<ReturnDto> getAll() {
        return repository.findAllByOrderByCreatedAtDesc()
                .stream().map(ReturnDto::from).toList();
    }

    @Transactional
    public ReturnDto updateStatus(UUID id, ReturnStatus status, String notes) {
        var req = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Solicitação de devolução não encontrada"));
        req.setStatus(status);
        req.setAdminNotes(notes);
        return ReturnDto.from(repository.save(req));
    }
}
