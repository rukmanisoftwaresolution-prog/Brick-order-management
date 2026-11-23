import { Injectable } from '@angular/core';
import { Content, TableCell, TDocumentDefinitions } from 'pdfmake/interfaces';
import { Customer } from './customer-api.service';
import { Payment } from './logistics-api.service';

const IST_TIME_ZONE = 'Asia/Kolkata';

@Injectable({ providedIn: 'root' })
export class PaymentStatementPdfService {
  buildDocument(
    customerPayment: Payment,
    payments: readonly Payment[],
    customer?: Customer,
    generatedAt = new Date()
  ): TDocumentDefinitions {
    const customerPayments = payments.filter(
      (payment) => payment.customerId === customerPayment.customerId
    );
    const successfulTotal = customerPayments
      .filter((payment) => payment.paymentStatus === 'SUCCESSFUL')
      .reduce((sum, payment) => sum + payment.amount, 0);
    const addressParts = customer
      ? [
        ...(customer.address ?? '').split(','),
        customer.city,
        customer.state,
        customer.pincode
      ].map((part) => part?.trim()).filter((part): part is string => !!part)
      : [];
    const address = [...new Map(addressParts.map((part) => [part.toLocaleLowerCase(), part])).values()]
      .join(', ');
    const customerDetails = [
      { label: 'Customer', value: customerPayment.customerName },
      { label: 'Customer code', value: customerPayment.customerCode },
      ...(customer?.customerType ? [{ label: 'Type', value: customer.customerType }] : []),
      ...(customer?.contactPerson ? [{ label: 'Contact', value: customer.contactPerson }] : []),
      ...(customer?.mobileNumber ? [{ label: 'Mobile', value: customer.mobileNumber }] : []),
      ...(customer?.email ? [{ label: 'Email', value: customer.email }] : [])
    ];
    const detailRows: TableCell[][] = [];
    for (let index = 0; index < customerDetails.length; index += 2) {
      const first = customerDetails[index];
      const second = customerDetails[index + 1];
      detailRows.push([
        { text: first.label, color: '#77827b' },
        { text: first.value, bold: true },
        ...(second
          ? [{ text: second.label, color: '#77827b' }, { text: second.value, bold: true }]
          : [{ text: '' }, { text: '' }])
      ]);
    }
    if (address) {
      detailRows.push([
        { text: 'Address', color: '#77827b' },
        { text: address, colSpan: 3 },
        '',
        ''
      ]);
    }

    const content: Content[] = [
      { text: 'Brickworks ERP', fontSize: 10, bold: true, color: '#397361' },
      { text: 'Customer Payment Statement', fontSize: 19, bold: true, color: '#20332a', margin: [0, 5, 0, 3] },
      { text: `Generated: ${formatStatementTimestamp(generatedAt)} IST`, fontSize: 8, color: '#77827b' },
      {
        text: 'Customer details',
        fontSize: 11,
        bold: true,
        color: '#20332a',
        margin: [0, 20, 0, 8],
        headlineLevel: 1
      },
      {
        table: {
          widths: [78, '*', 78, '*'],
          body: detailRows
        },
        layout: {
          fillColor: () => '#f6f9f7',
          hLineColor: () => '#e3eae5',
          vLineColor: () => '#f6f9f7',
          paddingLeft: () => 8,
          paddingRight: () => 8,
          paddingTop: () => 7,
          paddingBottom: () => 7
        },
        fontSize: 8
      }
    ];

    content.push(
      { text: 'Payment summary', fontSize: 11, bold: true, color: '#20332a', margin: [0, 20, 0, 8] },
      {
        table: {
          widths: ['*', '*'],
          body: [[
            { text: `Total transactions: ${customerPayments.length}`, bold: true },
            { text: `Successful payments received: INR (₹) ${formatNumber(successfulTotal)}`, bold: true }
          ]]
        },
        layout: {
          fillColor: () => '#edf3ef',
          hLineColor: () => '#dfe8e2',
          vLineColor: () => '#dfe8e2',
          paddingLeft: () => 10,
          paddingRight: () => 10,
          paddingTop: () => 10,
          paddingBottom: () => 10
        }
      },
      { text: 'Payment history', fontSize: 11, bold: true, color: '#20332a', margin: [0, 20, 0, 8] }
    );

    if (customerPayments.length) {
      const tableRows: TableCell[][] = customerPayments.map((payment) => [
        formatPaymentDate(payment.paymentDate),
        `${formatStatementDateTime(payment.createdAt)} IST`,
        payment.invoiceNumber || 'Advance payment',
        payment.orderNumber || '—',
        payment.paymentType.replace(/_/g, ' '),
        payment.referenceNumber || '—',
        payment.paymentStatus,
        { text: `₹ ${formatNumber(payment.amount)}`, alignment: 'right' as const }
      ]);
      const header: TableCell[] = [
        'Payment Date',
        'Recorded At (IST)',
        'Invoice / Advance',
        'Order Number',
        'Payment Method',
        'Reference Number',
        'Payment Status',
        { text: 'Amount (₹)', alignment: 'right' }
      ];

      content.push({
        table: {
          headerRows: 1,
          keepWithHeaderRows: 1,
          widths: [80, 125, 105, 75, 85, '*', 80, 90],
          body: [header, ...tableRows]
        },
        layout: {
          fillColor: (rowIndex: number) => rowIndex === 0 ? '#edf3ef' : null,
          hLineColor: () => '#dfe6e1',
          vLineColor: () => '#e8ede9',
          paddingLeft: () => 6,
          paddingRight: () => 6,
          paddingTop: () => 6,
          paddingBottom: () => 6
        },
        fontSize: 8
      });
    } else {
      content.push({
        text: 'No payment history is available for this customer.',
        color: '#77827b',
        margin: [0, 5, 0, 0]
      });
    }

    return {
      pageSize: 'A4',
      pageOrientation: 'landscape',
      pageMargins: [36, 34, 36, 36],
      defaultStyle: { font: 'Roboto', fontSize: 9, color: '#33443a' },
      content,
      footer: (currentPage, pageCount) => ({
        text: `Page ${currentPage} of ${pageCount}`,
        alignment: 'right',
        fontSize: 8,
        color: '#77827b',
        margin: [36, 0, 36, 12]
      })
    };
  }

  async download(
    customerPayment: Payment,
    payments: readonly Payment[],
    customer?: Customer
  ): Promise<void> {
    const document = this.buildDocument(customerPayment, payments, customer);
    const [pdfMake, pdfFonts] = await Promise.all([
      import('pdfmake/build/pdfmake'),
      import('pdfmake/build/vfs_fonts')
    ]);
    const createdPdf = pdfMake.createPdf(document, undefined, undefined, pdfFonts.default);
    const fileName = `Payment_Statement_${toFilePart(customerPayment.customerName || customerPayment.customerCode)}.pdf`;

    await new Promise<void>((resolve, reject) => {
      try {
        createdPdf.getBlob((blob) => {
          let objectUrl: string | undefined;
          try {
            objectUrl = URL.createObjectURL(blob);
            const link = window.document.createElement('a');
            link.href = objectUrl;
            link.download = fileName;
            link.click();
            window.setTimeout(() => {
              if (objectUrl) URL.revokeObjectURL(objectUrl);
            }, 1000);
            resolve();
          } catch (error) {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
            reject(error);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}

export function formatStatementTimestamp(value: Date): string {
  const date = new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TIME_ZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(value);
  const time = formatStatementTime(value.toISOString());
  return `${date}, ${time}`;
}

function formatPaymentDate(value: string): string {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'UTC',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

function formatStatementTime(value: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }).format(new Date(value)).replace(/\b(am|pm)\b/i, (period) => period.toUpperCase());
}

function formatStatementDateTime(value: string): string {
  const date = new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TIME_ZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(value));
  return `${date}, ${formatStatementTime(value)}`;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function toFilePart(value: string): string {
  const safeValue = value.normalize('NFKD').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return safeValue || 'Customer';
}
