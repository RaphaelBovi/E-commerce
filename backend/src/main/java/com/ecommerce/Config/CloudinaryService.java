package com.ecommerce.Config;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Base64;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public CloudinaryService(@Value("${cloudinary.url:}") String cloudinaryUrl) {
        if (cloudinaryUrl == null || cloudinaryUrl.isBlank()) {
            this.cloudinary = null;
            log.warn("CLOUDINARY_URL não configurado — imagens serão mantidas em base64");
        } else {
            this.cloudinary = new Cloudinary(cloudinaryUrl);
            this.cloudinary.config.secure = true;
        }
    }

    /**
     * Se o valor for um data URI base64 (data:image/...), faz upload para o Cloudinary
     * e retorna a URL segura (https://res.cloudinary.com/...).
     * Se já for uma URL ou o Cloudinary não estiver configurado, retorna o valor inalterado.
     */
    public String uploadIfBase64(String value, String folder) {
        if (value == null || value.isBlank()) return value;
        if (!value.startsWith("data:image"))  return value; // já é URL
        if (cloudinary == null)               return value; // fallback: sem CDN

        try {
            // Extrai apenas a parte base64, descartando o prefixo "data:image/...;base64,"
            String base64Data = value.contains(",") ? value.split(",", 2)[1] : value;
            byte[] bytes = Base64.getDecoder().decode(base64Data);

            var result = cloudinary.uploader().upload(bytes,
                ObjectUtils.asMap("folder", folder, "resource_type", "image"));

            return (String) result.get("secure_url");
        } catch (Exception e) {
            log.warn("Upload Cloudinary falhou, mantendo base64: {}", e.getMessage());
            return value;
        }
    }

    public List<String> uploadListIfBase64(List<String> images, String folder) {
        if (images == null) return null;
        return images.stream()
            .map(img -> uploadIfBase64(img, folder))
            .collect(Collectors.toList());
    }
}
