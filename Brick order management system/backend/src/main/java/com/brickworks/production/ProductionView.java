package com.brickworks.production;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ProductionView(Long id, Long productId, String productCode, String productName,
                             LocalDate productionDate, Long targetQuantity, Long actualQuantity,
                             Long rejectedQuantity, Long acceptedQuantity, BigDecimal rawMaterialConsumption,
                             String kilnName, String machineName, String remarks) { }
