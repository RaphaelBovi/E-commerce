package com.ecommerce.Banner;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

// Public endpoint — returns active banners for the storefront
@RestController
@RequestMapping("/api/banners")
public class BannerController {

    @Autowired private BannerService service;

    // GET /api/banners?position=HERO  (public)
    @GetMapping
    public List<BannerDto> getActive(@RequestParam(required = false) BannerPosition position) {
        if (position != null) return service.getActiveByPosition(position);
        return service.getActiveByPosition(BannerPosition.HERO);
    }

    // ── Admin endpoints ────────────────────────────────────────────

    // GET /api/banners/admin  (ADMIN or MASTER)
    @GetMapping("/admin")
    public List<BannerDto> getAll() {
        return service.getAll();
    }

    // POST /api/banners/admin  (ADMIN or MASTER)
    @PostMapping("/admin")
    @ResponseStatus(HttpStatus.CREATED)
    public BannerDto create(@Valid @RequestBody BannerRequest req) {
        return service.create(req);
    }

    // PUT /api/banners/admin/{id}  (ADMIN or MASTER)
    @PutMapping("/admin/{id}")
    public BannerDto update(@PathVariable UUID id, @Valid @RequestBody BannerRequest req) {
        return service.update(id, req);
    }

    // PATCH /api/banners/admin/{id}/toggle  (ADMIN or MASTER)
    @PatchMapping("/admin/{id}/toggle")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void toggle(@PathVariable UUID id) {
        service.toggleActive(id);
    }

    // DELETE /api/banners/admin/{id}  (ADMIN or MASTER)
    @DeleteMapping("/admin/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }
}
