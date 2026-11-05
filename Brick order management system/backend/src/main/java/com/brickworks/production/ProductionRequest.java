package com.brickworks.production;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public record ProductionRequest(@NotNull Long productId, @NotNull LocalDate productionDate,
                                @NotNull @PositiveOrZero Long targetQuantity,
                                @NotNull @PositiveOrZero Long actualQuantity,
                                @NotNull @PositiveOrZero Long rejectedQuantity,
                                @NotNull @PositiveOrZero BigDecimal rawMaterialConsumption,
                                @Size(max = 100) String kilnName, @Size(max = 100) String machineName,
                                @Size(max = 1000) String remarks) { }
