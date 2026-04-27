package com.ecommerce.Banner;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface BannerRepository extends JpaRepository<Banner, UUID> {
    List<Banner> findByPositionAndActiveTrueOrderByDisplayOrderAsc(BannerPosition position);
    List<Banner> findAllByOrderByPositionAscDisplayOrderAsc();
}
