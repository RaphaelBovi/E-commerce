package com.ecommerce.Banner;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "banners")
public class Banner {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    private String subtitle;

    private String imageUrl;

    private String linkUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BannerPosition position;

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false)
    private int displayOrder = 0;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Banner() {}

    public UUID getId()               { return id; }
    public String getTitle()          { return title; }
    public String getSubtitle()       { return subtitle; }
    public String getImageUrl()       { return imageUrl; }
    public String getLinkUrl()        { return linkUrl; }
    public BannerPosition getPosition() { return position; }
    public boolean isActive()         { return active; }
    public int getDisplayOrder()      { return displayOrder; }
    public Instant getCreatedAt()     { return createdAt; }

    public void setTitle(String title)           { this.title = title; }
    public void setSubtitle(String subtitle)     { this.subtitle = subtitle; }
    public void setImageUrl(String imageUrl)     { this.imageUrl = imageUrl; }
    public void setLinkUrl(String linkUrl)       { this.linkUrl = linkUrl; }
    public void setPosition(BannerPosition p)    { this.position = p; }
    public void setActive(boolean active)        { this.active = active; }
    public void setDisplayOrder(int order)       { this.displayOrder = order; }
}
