package com.ecommerce.Product.Entity.Dtos;

import java.util.List;

public record CsvImportResult(int imported, List<CsvRowError> errors) {
    public record CsvRowError(int row, String message) {}
}
