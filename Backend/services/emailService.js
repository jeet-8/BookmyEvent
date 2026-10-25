import nodemailer from "nodemailer";

/**
 * Creates Nodemailer transporter configured for Brevo SMTP.
 */
const createBrevoTransporter = () => {
    const smtpHost = process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com";
    const smtpPort = Number(process.env.BREVO_SMTP_PORT) || 587;
    const smtpUser = process.env.BREVO_SMTP_USER || process.env.SENDER_EMAIL;
    const smtpPass = process.env.BREVO_API_KEY;

    return nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
            user: smtpUser,
            pass: smtpPass
        },
        connectionTimeout: 10000,
        greetingTimeout: 8000
    });
};

/**
 * Fallback to Brevo Transactional Email REST API v3 with base64 attachment.
 */
const sendViaBrevoRestApi = async ({ toEmail, toName, subject, htmlContent, pdfBuffer, filename }) => {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
            "api-key": process.env.BREVO_API_KEY,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            sender: {
                name: "BookMyEvent",
                email: process.env.SENDER_EMAIL
            },
            to: [{ email: toEmail, name: toName || "Customer" }],
            subject,
            htmlContent,
            attachment: [
                {
                    name: filename,
                    content: pdfBuffer.toString("base64")
                }
            ]
        })
    });

    if (!response.ok) {
        let details = "";
        try {
            const data = await response.json();
            details = data?.message || JSON.stringify(data);
        } catch {
            details = await response.text().catch(() => "");
        }
        throw new Error(`Brevo HTTP API failed (${response.status}): ${details}`);
    }

    return true;
};

/**
 * Sends booking confirmation email with attached PDF ticket.
 * Tries Nodemailer Brevo SMTP first; automatically falls back to Brevo REST API.
 */
export const sendTicketEmail = async ({ booking, pdfBuffer }) => {
    const toEmail = booking.user?.email;
    const toName = booking.user?.username || booking.user?.name || "Moviegoer";
    const bookingId = booking._id ? String(booking._id) : "BME-" + Date.now();
    const movieTitle = booking.movieTitle || "Movie";
    const filename = `Ticket-${bookingId}.pdf`;

    if (!toEmail) {
        console.warn(`No recipient email found for booking ${bookingId}. Skipping email dispatch.`);
        return false;
    }

    const showDate = booking.showDate || "Selected Date";
    const showTime = booking.showTime || "Selected Time";
    const cinemaName = booking.cinema?.name || "Cinema Partner";
    const cinemaCity = booking.cinema?.city ? `(${booking.cinema.city})` : "";
    const seatList = Array.isArray(booking.seatNumbers) && booking.seatNumbers.length > 0
        ? booking.seatNumbers.join(", ")
        : `${booking.seats} Seat(s)`;
    const totalAmount = Number(booking.totalPrice || 0).toFixed(2);

    const subject = `Your Movie Ticket: ${movieTitle} [${bookingId}] - BookMyEvent`;
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px; }
        .card { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        .header { background: #dc2626; color: #ffffff; padding: 24px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; letter-spacing: 1px; }
        .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; }
        .content { padding: 24px 20px; color: #1f2937; }
        .ticket-box { background: #f9fafb; border: 1px dashed #d1d5db; border-radius: 8px; padding: 18px; margin: 18px 0; }
        .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
        .label { color: #6b7280; }
        .value { font-weight: 600; color: #111827; }
        .seats-highlight { color: #dc2626; font-size: 16px; font-weight: 700; }
        .badge { display: inline-block; background: #dcfce7; color: #15803d; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; }
        .footer { text-align: center; padding: 16px 20px 24px; font-size: 12px; color: #9ca3af; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>BookMyEvent</h1>
          <p>Your Movie Tickets Are Confirmed!</p>
        </div>
        <div class="content">
          <p style="font-size: 16px; margin-top: 0;">Hi <strong>${toName}</strong>,</p>
          <p>Thank you for booking with BookMyEvent. Your official e-ticket is attached to this email as a PDF. You can present it at the cinema box office or turnstile.</p>
          
          <div class="ticket-box">
            <div style="text-align: right; margin-bottom: 12px;">
              <span class="badge">Booking Confirmed</span>
            </div>
            <div style="font-size: 18px; font-weight: bold; margin-bottom: 12px; color: #111827;">
              ${movieTitle}
            </div>
            <div class="row">
              <span class="label">Cinema:</span>
              <span class="value">${cinemaName} ${cinemaCity}</span>
            </div>
            <div class="row">
              <span class="label">Date & Time:</span>
              <span class="value">${showDate} · ${showTime}</span>
            </div>
            <div class="row">
              <span class="label">Seat Numbers:</span>
              <span class="value seats-highlight">${seatList}</span>
            </div>
            <div class="row">
              <span class="label">Total Paid:</span>
              <span class="value">INR ${totalAmount}</span>
            </div>
            <div class="row">
              <span class="label">Booking Ref:</span>
              <span class="value" style="font-family: monospace;">${bookingId}</span>
            </div>
          </div>

          <p style="font-size: 13px; color: #4b5563; line-height: 1.5;">
            📎 <strong>Download Ticket:</strong> Find the attached <strong>${filename}</strong> to view your entry pass, barcode, and seat allocation.
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} BookMyEvent · Instant Movie Ticketing. All rights reserved.
        </div>
      </div>
    </body>
    </html>
    `;

    // Attempt 1: Nodemailer with Brevo SMTP
    try {
        const transporter = createBrevoTransporter();
        const info = await transporter.sendMail({
            from: `"BookMyEvent" <${process.env.SENDER_EMAIL}>`,
            to: `"${toName}" <${toEmail}>`,
            subject,
            html: htmlContent,
            attachments: [
                {
                    filename,
                    content: pdfBuffer,
                    contentType: "application/pdf"
                }
            ]
        });
        console.log(`Ticket email sent via Brevo SMTP to ${toEmail}: ${info.messageId}`);
        return true;
    } catch (smtpError) {
        console.warn(`Nodemailer SMTP failed (${smtpError.message}). Attempting fallback to Brevo REST API...`);
    }

    // Attempt 2: Brevo REST API fallback
    try {
        await sendViaBrevoRestApi({
            toEmail,
            toName,
            subject,
            htmlContent,
            pdfBuffer,
            filename
        });
        console.log(`Ticket email sent via Brevo REST API fallback to ${toEmail}`);
        return true;
    } catch (restError) {
        console.error(`Failed to dispatch ticket email via both SMTP and REST API:`, restError.message);
        // Do not fail the whole booking if email delivery encounters a 3rd party issue, but log it
        return false;
    }
};
