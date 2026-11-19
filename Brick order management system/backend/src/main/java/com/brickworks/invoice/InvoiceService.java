package com.brickworks.invoice;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class InvoiceService {
    private final InvoiceRepository invoices;

    public InvoiceService(InvoiceRepository invoices) {
        this.invoices = invoices;
    }

    public Page<InvoiceView> search(String term, Pageable pageable) {
        return invoices.search(term == null ? "" : term.trim(), pageable).map(this::toView);
    }

    private InvoiceView toView(Invoice invoice) {
        return new InvoiceView(invoice.getId(), invoice.getInvoiceNumber(), invoice.getOrder().getOrderNumber(),
                invoice.getCustomer().getCustomerName(), invoice.getInvoiceDate(), invoice.getTaxableAmount(),
                invoice.getCgst(), invoice.getSgst(), invoice.getIgst(), invoice.getInvoiceAmount());
    }
}
