package com.ecommerce.Auth.Repository;

import com.ecommerce.Auth.Entity.PendingRegistration;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PendingRegistrationRepository extends JpaRepository<PendingRegistration, String> {
}
