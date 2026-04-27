package com.ecommerce.Config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Limita requisições por IP para endpoints sensíveis.
 * Usa sliding window (janela deslizante) por IP+path em memória.
 * Retorna 429 com Retry-After quando o limite é excedido.
 */
@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RateLimitFilter extends OncePerRequestFilter {

    // path exato → { maxRequests, windowSeconds }
    private static final Map<String, int[]> LIMITS = Map.of(
        "/api/auth/login",         new int[]{10, 60},
        "/api/auth/register",      new int[]{5,  60},
        "/api/freight/calculate",  new int[]{20, 60},
        "/api/coupons/validate",   new int[]{20, 60}
    );

    // "IP:path" → timestamps das requisições dentro da janela
    private final Map<String, Deque<Long>> requestLog = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        int[] limit = LIMITS.get(path);

        if (limit != null) {
            String ip         = resolveClientIp(request);
            int maxRequests   = limit[0];
            int windowSeconds = limit[1];
            String key        = ip + ":" + path;
            long now          = System.currentTimeMillis();
            long windowStart  = now - (windowSeconds * 1000L);

            Deque<Long> timestamps = requestLog.computeIfAbsent(key, k -> new ArrayDeque<>());

            synchronized (timestamps) {
                // descarta timestamps fora da janela
                while (!timestamps.isEmpty() && timestamps.peekFirst() < windowStart) {
                    timestamps.pollFirst();
                }

                if (timestamps.size() >= maxRequests) {
                    long retryAfter = (timestamps.peekFirst() + windowSeconds * 1000L - now) / 1000L;
                    log.warn("Rate limit atingido: {} → {}", ip, path);
                    response.setStatus(429);
                    response.setHeader("Retry-After", String.valueOf(Math.max(1, retryAfter)));
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write(
                        "{\"error\":\"Muitas requisições. Tente novamente em " + Math.max(1, retryAfter) + " segundos.\"}"
                    );
                    return;
                }

                timestamps.addLast(now);
            }
        }

        chain.doFilter(request, response);
    }

    // Respeita X-Forwarded-For para ambientes com proxy reverso (Render, Nginx)
    private String resolveClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
