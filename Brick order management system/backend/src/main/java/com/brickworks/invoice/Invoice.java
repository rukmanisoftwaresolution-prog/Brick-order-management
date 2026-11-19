package com.brickworks.invoice;

import com.brickworks.customer.Customer;
import com.brickworks.order.SalesOrder;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "invoices")
public class Invoice {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "invoice_number", nullable = false, unique = true, length = 30)
    private String invoiceNumber;
    @OneToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "order_id", nullable = false, unique = true)
    private SalesOrder order;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;
    @Column(name = "invoice_date", nullable = false)
    private LocalDate invoiceDate;
    @Column(name = "taxable_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal taxableAmount;
    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal cgst = BigDecimal.ZERO;
    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal sgst = BigDecimal.ZERO;
    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal igst = BigDecimal.ZERO;
    @Column(name = "invoice_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal invoiceAmount;
    @Column(name = "pdf_storage_key", length = 500)
    private String pdfStorageKey;

    protected Invoice() { }

    public Long getId() { return id; }
    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String value) { invoiceNumber = value; }
    public SalesOrder getOrder() { return order; }
    public void setOrder(SalesOrder value) { order = value; }
    public Customer getCustomer() { return customer; }
    public void setCustomer(Customer value) { customer = value; }
    public LocalDate getInvoiceDate() { return invoiceDate; }
    public void setInvoiceDate(LocalDate value) { invoiceDate = value; }
    public BigDecimal getTaxableAmount() { return taxableAmount; }
    public void setTaxableAmount(BigDecimal value) { taxableAmount = value; }
    public BigDecimal getCgst() { return cgst; }
    public void setCgst(BigDecimal value) { cgst = value; }
    public BigDecimal getSgst() { return sgst; }
    public void setSgst(BigDecimal value) { sgst = value; }
    public BigDecimal getIgst() { return igst; }
    public void setIgst(BigDecimal value) { igst = value; }
    public BigDecimal getInvoiceAmount() { return invoiceAmount; }
    public void setInvoiceAmount(BigDecimal value) { invoiceAmount = value; }
    public String getPdfStorageKey() { return pdfStorageKey; }
    public void setPdfStorageKey(String value) { pdfStorageKey = value; }
}
