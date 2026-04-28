package com.ecommerce.Auth.Repository;

import com.ecommerce.Auth.Entity.PendingGoogleSetup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PendingGoogleSetupRepository extends JpaRepository<PendingGoogleSetup, String> {}
