package com.brickworks.report;

import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import org.springframework.stereotype.Repository;

@Repository
public class OperationsReportRepository {
    private final EntityManager entityManager;

    public OperationsReportRepository(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    public Object[] orderSummary(LocalDate from, LocalDate to) {
        StringBuilder jpql = new StringBuilder("""
                select count(o), coalesce(sum(o.totalAmount), 0)
                from SalesOrder o
                where 1 = 1
                """);
        if (from != null) jpql.append(" and o.orderDate >= :fromDate");
        if (to != null) jpql.append(" and o.orderDate <= :toDate");
        TypedQuery<Object[]> query = entityManager.createQuery(jpql.toString(), Object[].class);
        if (from != null) query.setParameter("fromDate", from);
        if (to != null) query.setParameter("toDate", to);
        return query.getSingleResult();
    }

    public Object[] paymentSummary(LocalDate from, LocalDate to) {
        StringBuilder jpql = new StringBuilder("""
                select count(p), coalesce(sum(p.amount), 0)
                from Payment p
                where 1 = 1
                """);
        if (from != null) jpql.append(" and p.paymentDate >= :fromDate");
        if (to != null) jpql.append(" and p.paymentDate <= :toDate");
        TypedQuery<Object[]> query = entityManager.createQuery(jpql.toString(), Object[].class);
        if (from != null) query.setParameter("fromDate", from);
        if (to != null) query.setParameter("toDate", to);
        return query.getSingleResult();
    }

    public long deliveryCount(LocalDate from, LocalDate to) {
        Instant fromInstant = from == null ? null : from.atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant toExclusive = to == null ? null : to.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC);
        StringBuilder jpql = new StringBuilder("""
                select count(d)
                from Delivery d
                where 1 = 1
                """);
        if (fromInstant != null) jpql.append(" and d.createdAt >= :fromInstant");
        if (toExclusive != null) jpql.append(" and d.createdAt < :toInstant");
        TypedQuery<Long> query = entityManager.createQuery(jpql.toString(), Long.class);
        if (fromInstant != null) query.setParameter("fromInstant", fromInstant);
        if (toExclusive != null) query.setParameter("toInstant", toExclusive);
        return query.getSingleResult();
    }

    public Object[] productionSummary(LocalDate from, LocalDate to) {
        StringBuilder jpql = new StringBuilder("""
                select count(p), coalesce(sum(p.actualQuantity), 0), coalesce(sum(p.rejectedQuantity), 0)
                from ProductionEntry p
                where 1 = 1
                """);
        if (from != null) jpql.append(" and p.productionDate >= :fromDate");
        if (to != null) jpql.append(" and p.productionDate <= :toDate");
        TypedQuery<Object[]> query = entityManager.createQuery(jpql.toString(), Object[].class);
        if (from != null) query.setParameter("fromDate", from);
        if (to != null) query.setParameter("toDate", to);
        return query.getSingleResult();
    }

    public Object[] inventorySummary() {
        return entityManager.createQuery("""
                select count(i), coalesce(sum(i.availableStock), 0), coalesce(sum(i.reservedStock), 0),
                    coalesce(sum(i.damagedStock), 0), coalesce(sum(i.deliveredStock), 0)
                from Inventory i
                """, Object[].class)
                .getSingleResult();
    }
}
