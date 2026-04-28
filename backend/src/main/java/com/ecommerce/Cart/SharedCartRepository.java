package com.ecommerce.Cart;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SharedCartRepository extends JpaRepository<SharedCart, String> {}
