import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';
import { Readable } from 'stream';

@Injectable()
export class TicketPdfService {
  async generateTicketPdf(params: {
    eventTitle: string;
    eventLocation: string;
    eventDate: string;
    eventTime: string;
    ticketTypeName: string;
    buyerName: string;
    buyerEmail: string;
    orderId: string;
    tickets: Array<{ id: string; qrCodeToken: string; seat?: string }>;
  }): Promise<Buffer> {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const buffers: Buffer[] = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => {});

    for (let i = 0; i < params.tickets.length; i++) {
      if (i > 0) doc.addPage();

      const ticket = params.tickets[i];

      doc.fontSize(22).font('Helvetica-Bold').text('VÉ SỰ KIỆN', { align: 'center' });
      doc.moveDown(0.5);

      // Border box
      doc.rect(40, doc.y, 525, 320).stroke('#22c55e');
      doc.moveDown(1);

      // Event title
      doc.fontSize(18).font('Helvetica-Bold').fillColor('#1a1a1a').text(params.eventTitle, { align: 'center' });
      doc.moveDown(0.5);

      // Event details
      doc.fontSize(11).font('Helvetica').fillColor('#555');
      const details = [
        `Địa điểm: ${params.eventLocation}`,
        `Ngày: ${params.eventDate}`,
        `Giờ: ${params.eventTime}`,
        `Loại vé: ${params.ticketTypeName}`,
      ];
      for (const detail of details) {
        doc.text(detail, { align: 'center' });
        doc.moveDown(0.2);
      }

      doc.moveDown(0.5);

      // Draw separator
      doc.moveTo(60, doc.y).lineTo(580, doc.y).stroke('#ccc');
      doc.moveDown(0.5);

      // Buyer info
      doc.fontSize(10).fillColor('#333');
      doc.text(`Người mua: ${params.buyerName} (${params.buyerEmail})`, { align: 'center' });
      doc.text(`Mã đơn: ${params.orderId}`, { align: 'center' });
      doc.text(`Mã vé: ${ticket.id.substring(0, 8).toUpperCase()}`, { align: 'center' });

      doc.moveDown(1);

      // QR Code
      const qrBuffer = await QRCode.toBuffer(ticket.qrCodeToken, { width: 150, margin: 2 });
      const qrWidth = 120;
      const pageWidth = doc.page.width - 80;
      const qrX = 40 + (pageWidth - qrWidth) / 2;
      doc.image(qrBuffer, qrX, doc.y, { width: qrWidth });

      doc.moveDown(4);
      doc.fontSize(8).fillColor('#999').text('Vui lòng xuất trình mã QR này tại cửa vào.', { align: 'center' });
    }

    doc.end();

    return new Promise((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
    });
  }
}
