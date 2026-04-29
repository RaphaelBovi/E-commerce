package com.ecommerce.Auth.Repository;

import com.ecommerce.Auth.Entity.AccountDeletionToken;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AccountDeletionTokenRepository extends JpaRepository<AccountDeletionToken, String> {
}
