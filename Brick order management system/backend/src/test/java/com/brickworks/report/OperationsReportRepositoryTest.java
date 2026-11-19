package com.brickworks.report;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class OperationsReportRepositoryTest {
    private static final LocalDate FROM = LocalDate.of(2026, 11, 1);
    private static final LocalDate TO = LocalDate.of(2026, 11, 30);

    @Test
    void buildsQueriesAndBindsOnlyPresentDateFilters() {
        List<DateRange> ranges = List.of(
                new DateRange(FROM, TO),
                new DateRange(FROM, null),
                new DateRange(null, TO),
                new DateRange(null, null));

        for (DateRange range : ranges) {
            assertQueriesForRange(range);
        }
    }

    private void assertQueriesForRange(DateRange range) {
        EntityManager entityManager = mock(EntityManager.class);
        TypedQuery<Object[]> orderQuery = objectQuery();
        TypedQuery<Object[]> paymentQuery = objectQuery();
        TypedQuery<Long> deliveryQuery = longQuery();
        TypedQuery<Object[]> productionQuery = objectQuery();
        when(entityManager.createQuery(anyString(), eq(Object[].class)))
                .thenReturn(orderQuery, paymentQuery, productionQuery);
        when(entityManager.createQuery(anyString(), eq(Long.class))).thenReturn(deliveryQuery);
        OperationsReportRepository repository = new OperationsReportRepository(entityManager);

        repository.orderSummary(range.from(), range.to());
        repository.paymentSummary(range.from(), range.to());
        repository.deliveryCount(range.from(), range.to());
        repository.productionSummary(range.from(), range.to());

        ArgumentCaptor<String> objectQueries = ArgumentCaptor.forClass(String.class);
        verify(entityManager, times(3)).createQuery(objectQueries.capture(), eq(Object[].class));
        assertDatePredicates(objectQueries.getAllValues().get(0), "o.orderDate", range, "<=");
        assertDatePredicates(objectQueries.getAllValues().get(1), "p.paymentDate", range, "<=");
        assertDatePredicates(objectQueries.getAllValues().get(2), "p.productionDate", range, "<=");

        ArgumentCaptor<String> deliveryJpql = ArgumentCaptor.forClass(String.class);
        verify(entityManager).createQuery(deliveryJpql.capture(), eq(Long.class));
        assertDatePredicates(deliveryJpql.getValue(), "d.createdAt", range, "<");

        assertBoundParameters(orderQuery, "fromDate", "toDate", range);
        assertBoundParameters(paymentQuery, "fromDate", "toDate", range);
        assertBoundParameters(deliveryQuery, "fromInstant", "toInstant", range);
        assertBoundParameters(productionQuery, "fromDate", "toDate", range);

        if (range.from() != null) {
            verify(deliveryQuery).setParameter("fromInstant", range.from().atStartOfDay().toInstant(ZoneOffset.UTC));
        }
        if (range.to() != null) {
            verify(deliveryQuery).setParameter("toInstant", range.to().plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC));
        }
    }

    private TypedQuery<Object[]> objectQuery() {
        TypedQuery<Object[]> query = mock(TypedQuery.class);
        when(query.setParameter(anyString(), any())).thenReturn(query);
        when(query.getSingleResult()).thenReturn(new Object[]{0L, BigDecimal.ZERO, 0L});
        return query;
    }

    private TypedQuery<Long> longQuery() {
        TypedQuery<Long> query = mock(TypedQuery.class);
        when(query.setParameter(anyString(), any())).thenReturn(query);
        when(query.getSingleResult()).thenReturn(0L);
        return query;
    }

    private void assertDatePredicates(String jpql, String field, DateRange range, String upperOperator) {
        assertEquals(jpql.contains(field + " >= :" + (field.equals("d.createdAt") ? "fromInstant" : "fromDate")),
                range.from() != null);
        assertEquals(jpql.contains(field + " " + upperOperator + " :" + (field.equals("d.createdAt") ? "toInstant" : "toDate")),
                range.to() != null);
        assertEquals(jpql.contains("is null"), false);
    }

    private void assertBoundParameters(TypedQuery<?> query, String fromName, String toName, DateRange range) {
        int parameterCount = (range.from() == null ? 0 : 1) + (range.to() == null ? 0 : 1);
        ArgumentCaptor<String> parameterNames = ArgumentCaptor.forClass(String.class);
        if (parameterCount > 0) {
            verify(query, times(parameterCount)).setParameter(parameterNames.capture(), any());
        } else {
            verify(query, times(0)).setParameter(anyString(), any());
        }
        if (range.from() != null) {
            org.junit.jupiter.api.Assertions.assertTrue(parameterNames.getAllValues().contains(fromName));
        }
        if (range.to() != null) {
            org.junit.jupiter.api.Assertions.assertTrue(parameterNames.getAllValues().contains(toName));
        }
    }

    private record DateRange(LocalDate from, LocalDate to) { }
}
