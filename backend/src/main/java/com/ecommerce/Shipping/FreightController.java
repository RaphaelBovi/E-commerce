package com.ecommerce.Shipping;

import com.ecommerce.Shipping.Dto.FreightCalculateRequest;
import com.ecommerce.Shipping.Dto.FreightOption;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/freight")
public class FreightController {

    @Autowired
    private FreightService freightService;

    @PostMapping("/calculate")
    public ResponseEntity<List<FreightOption>> calculate(@Valid @RequestBody FreightCalculateRequest request) {
        return ResponseEntity.ok(freightService.calculate(request));
    }
}
