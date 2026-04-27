package com.ecommerce.Review;

import com.ecommerce.Auth.Entity.User;
import com.ecommerce.Auth.Repository.UserRepository;
import com.ecommerce.Order.Entity.OrderStatus;
import com.ecommerce.Order.Repository.OrderRepository;
import com.ecommerce.Product.Exception.BusinessException;
import com.ecommerce.Product.Exception.ResourceNotFoundException;
import com.ecommerce.Review.Dto.CreateReviewRequest;
import com.ecommerce.Review.Dto.ReviewResponse;
import com.ecommerce.Review.Dto.ReviewSummaryResponse;
// explicit imports required — IDE does not resolve wildcard Dto sub-package
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReviewService {

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrderRepository orderRepository;

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));
    }

    // ── LISTAR AVALIAÇÕES DE UM PRODUTO ──────────────────────────
    public ReviewSummaryResponse getProductReviews(UUID productId) {
        List<Review> reviews = reviewRepository.findByProductIdOrderByCreatedAtDesc(productId);
        long total = reviews.size();
        double avg = reviews.stream().mapToInt(Review::getRating).average().orElse(0.0);

        // Conta quantas reviews por estrela (1-5)
        Map<Integer, Long> distribution = new LinkedHashMap<>();
        for (int i = 5; i >= 1; i--) {
            int star = i;
            distribution.put(star, reviews.stream().filter(r -> r.getRating() == star).count());
        }

        List<ReviewResponse> responseList = reviews.stream().map(this::toResponse).toList();
        return new ReviewSummaryResponse(avg, total, distribution, responseList);
    }

    // ── CRIAR AVALIAÇÃO ───────────────────────────────────────────
    // Só pode avaliar se tiver um pedido DELIVERED com o produto
    public ReviewResponse createReview(UUID productId, CreateReviewRequest req) {
        User user = getCurrentUser();

        // Verifica se o usuário já avaliou este produto
        if (reviewRepository.existsByUserIdAndProductId(user.getId(), productId)) {
            throw new BusinessException("Você já avaliou este produto.");
        }

        // Verifica se o usuário tem um pedido ENTREGUE contendo o produto
        boolean hasPurchased = orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .filter(o -> o.getStatus() == OrderStatus.DELIVERED)
                .flatMap(o -> o.getItems().stream())
                .anyMatch(item -> productId.equals(item.getProductId()));

        if (!hasPurchased) {
            throw new BusinessException("Apenas clientes que receberam o produto podem avaliá-lo.");
        }

        Review review = Review.builder()
                .user(user)
                .productId(productId)
                .rating(req.rating())
                .comment(req.comment())
                .build();

        return toResponse(reviewRepository.save(review));
    }

    // ── VERIFICAR SE USUÁRIO PODE AVALIAR ────────────────────────
    public boolean canReview(UUID productId) {
        User user = getCurrentUser();
        if (reviewRepository.existsByUserIdAndProductId(user.getId(), productId)) return false;
        return orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .filter(o -> o.getStatus() == OrderStatus.DELIVERED)
                .flatMap(o -> o.getItems().stream())
                .anyMatch(item -> productId.equals(item.getProductId()));
    }

    // ── ADMIN: LISTAR TODAS ───────────────────────────────────────
    public List<ReviewResponse> listAll() {
        return reviewRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::toResponse).toList();
    }

    // ── ADMIN: DELETAR ────────────────────────────────────────────
    public void delete(UUID id) {
        if (!reviewRepository.existsById(id)) {
            throw new ResourceNotFoundException("Avaliação não encontrada");
        }
        reviewRepository.deleteById(id);
    }

    private ReviewResponse toResponse(Review r) {
        return new ReviewResponse(
                r.getId(),
                r.getProductId(),
                r.getUser().getEmail(),
                r.getUser().getFullName(),
                r.getRating(),
                r.getComment(),
                r.getCreatedAt()
        );
    }
}
