package com.ecommerce.Banner;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class BannerService {

    @Autowired private BannerRepository repository;

    public List<BannerDto> getActiveByPosition(BannerPosition position) {
        return repository.findByPositionAndActiveTrueOrderByDisplayOrderAsc(position)
                .stream().map(BannerDto::from).toList();
    }

    public List<BannerDto> getAll() {
        return repository.findAllByOrderByPositionAscDisplayOrderAsc()
                .stream().map(BannerDto::from).toList();
    }

    public BannerDto create(BannerRequest req) {
        var banner = new Banner();
        apply(banner, req);
        return BannerDto.from(repository.save(banner));
    }

    public BannerDto update(UUID id, BannerRequest req) {
        var banner = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Banner não encontrado"));
        apply(banner, req);
        return BannerDto.from(repository.save(banner));
    }

    public void toggleActive(UUID id) {
        var banner = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Banner não encontrado"));
        banner.setActive(!banner.isActive());
        repository.save(banner);
    }

    public void delete(UUID id) {
        repository.deleteById(id);
    }

    private void apply(Banner banner, BannerRequest req) {
        banner.setTitle(req.title());
        banner.setSubtitle(req.subtitle());
        banner.setImageUrl(req.imageUrl());
        banner.setLinkUrl(req.linkUrl());
        banner.setPosition(req.position());
        banner.setActive(req.active());
        banner.setDisplayOrder(req.displayOrder());
    }
}
