package com.ecommerce.Review;

import com.ecommerce.Review.Dto.CreateReviewRequest;
import com.ecommerce.Review.Dto.ReviewSummaryResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    // GET /api/reviews/{productId} — resumo + lista de avaliações do produto
    @GetMapping("/{productId}")
    public ResponseEntity<ReviewSummaryResponse> getReviews(@PathVariable UUID productId) {
        return ResponseEntity.ok(reviewService.getProductReviews(productId));
    }

    // POST /api/reviews/{productId} — cria avaliação (requer pedido DELIVERED com o produto)
    @PostMapping("/{productId}")
    public ResponseEntity<?> createReview(@PathVariable UUID productId,
                                          @Valid @RequestBody CreateReviewRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reviewService.createReview(productId, request));
    }

    // GET /api/reviews/{productId}/can-review — verifica se o usuário logado pode avaliar
    @GetMapping("/{productId}/can-review")
    public ResponseEntity<Map<String, Boolean>> canReview(@PathVariable UUID productId) {
        return ResponseEntity.ok(Map.of("canReview", reviewService.canReview(productId)));
    }
}
