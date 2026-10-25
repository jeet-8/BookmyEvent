import PDFDocument from "pdfkit";

/**
 * Generates an official BookMyEvent PDF movie ticket as a Buffer using PDFKit.
 * @param {Object} booking - Booking object with populated user, movieTitle, seats, cinema, etc.
 * @returns {Promise<Buffer>}
 */
export const generateTicketPdf = (booking) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: "A5",
                layout: "portrait",
                margins: { top: 25, bottom: 25, left: 25, right: 25 }
            });

            const buffers = [];
            doc.on("data", (chunk) => buffers.push(chunk));
            doc.on("end", () => resolve(Buffer.concat(buffers)));
            doc.on("error", (err) => reject(err));

            const bookingId = booking._id ? String(booking._id) : "BME-" + Date.now().toString(36).toUpperCase();
            const movieTitle = booking.movieTitle || "Movie Screening";
            const cinemaName = booking.cinema?.name || "Cinema Partner";
            const cinemaArea = booking.cinema?.area ? `${booking.cinema.area}, ` : "";
            const cinemaCity = booking.cinema?.city || "";
            const cinemaLocation = `${cinemaArea}${cinemaCity}`.trim() || "City Center";
            const showDate = booking.showDate || new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
            const showTime = booking.showTime || "Showtime";
            const seatList = Array.isArray(booking.seatNumbers) && booking.seatNumbers.length > 0
                ? booking.seatNumbers.join(", ")
                : `${booking.seats || 1} Seat(s)`;
            const totalPaid = Number(booking.totalPrice || 0).toFixed(2);
            const userName = booking.user?.username || booking.user?.name || "Valued Guest";
            const userEmail = booking.user?.email || "";
            const couponCode = booking.couponCode ? String(booking.couponCode) : null;
            const discountAmount = Number(booking.discountAmount || 0);

            // 1. Red Header Banner
            doc.rect(0, 0, doc.page.width, 70).fill("#dc2626");
            doc.fillColor("#ffffff")
                .font("Helvetica-Bold")
                .fontSize(22)
                .text("BOOKMYEVENT", 25, 20);
            doc.font("Helvetica")
                .fontSize(9)
                .fillColor("#fef2f2")
                .text("OFFICIAL MOVIE E-TICKET · ADMIT ONE PERSON PER SEAT", 25, 48);

            // 2. Booking ID & Status Bar
            doc.rect(25, 80, doc.page.width - 50, 30).fill("#f3f4f6");
            doc.fillColor("#374151")
                .fontSize(9)
                .font("Helvetica-Bold")
                .text("BOOKING ID:", 35, 90)
                .font("Helvetica")
                .fillColor("#111827")
                .text(bookingId, 110, 90);

            doc.fillColor("#15803d")
                .font("Helvetica-Bold")
                .fontSize(9)
                .text("CONFIRMED", doc.page.width - 105, 90);

            // 3. Movie Title & Screen info
            let currentY = 125;
            doc.fillColor("#111827")
                .font("Helvetica-Bold")
                .fontSize(16)
                .text(movieTitle, 25, currentY, { width: doc.page.width - 50 });

            currentY += 26;
            doc.fillColor("#4b5563")
                .font("Helvetica")
                .fontSize(10)
                .text(`${cinemaName} · ${cinemaLocation}`, 25, currentY);

            // 4. Dashed Separator
            currentY += 22;
            doc.strokeColor("#e5e7eb")
                .lineWidth(1)
                .dash(4, { space: 3 })
                .moveTo(25, currentY)
                .lineTo(doc.page.width - 25, currentY)
                .stroke()
                .undash();

            // 5. Date, Time & Seats Grid
            currentY += 15;
            const colWidth = (doc.page.width - 50) / 3;

            // Date Column
            doc.font("Helvetica")
                .fontSize(8)
                .fillColor("#6b7280")
                .text("DATE", 25, currentY)
                .font("Helvetica-Bold")
                .fontSize(11)
                .fillColor("#111827")
                .text(showDate, 25, currentY + 12);

            // Time Column
            doc.font("Helvetica")
                .fontSize(8)
                .fillColor("#6b7280")
                .text("TIME", 25 + colWidth, currentY)
                .font("Helvetica-Bold")
                .fontSize(11)
                .fillColor("#111827")
                .text(showTime, 25 + colWidth, currentY + 12);

            // Seats Column
            doc.font("Helvetica")
                .fontSize(8)
                .fillColor("#6b7280")
                .text("SEATS", 25 + colWidth * 2, currentY)
                .font("Helvetica-Bold")
                .fontSize(12)
                .fillColor("#dc2626")
                .text(seatList, 25 + colWidth * 2, currentY + 12);

            // 6. Highlighted Seat Badges Box
            currentY += 45;
            doc.rect(25, currentY, doc.page.width - 50, 48).fillAndStroke("#fef2f2", "#fca5a5");
            doc.font("Helvetica-Bold")
                .fontSize(9)
                .fillColor("#991b1b")
                .text("SELECTED SEAT(S)", 35, currentY + 10);
            doc.font("Helvetica-Bold")
                .fontSize(14)
                .fillColor("#b91c1c")
                .text(seatList, 35, currentY + 25);

            // 7. Payment & Guest Info Box
            currentY += 60;
            doc.rect(25, currentY, doc.page.width - 50, 75).fill("#f9fafb");

            doc.font("Helvetica")
                .fontSize(9)
                .fillColor("#6b7280")
                .text("Guest Name:", 35, currentY + 10)
                .fillColor("#111827")
                .font("Helvetica-Bold")
                .text(userName, 110, currentY + 10);

            if (userEmail) {
                doc.font("Helvetica")
                    .fontSize(9)
                    .fillColor("#6b7280")
                    .text("Email:", 35, currentY + 26)
                    .fillColor("#111827")
                    .font("Helvetica")
                    .text(userEmail, 110, currentY + 26);
            }

            doc.font("Helvetica")
                .fontSize(9)
                .fillColor("#6b7280")
                .text("Payment:", 35, currentY + 42)
                .fillColor("#111827")
                .font("Helvetica")
                .text("UPI (Instant QR Pay)", 110, currentY + 42);

            if (couponCode && discountAmount > 0) {
                doc.font("Helvetica")
                    .fontSize(9)
                    .fillColor("#15803d")
                    .text(`Coupon Applied (${couponCode}): -INR ${discountAmount.toFixed(2)}`, 35, currentY + 58);
            }

            // Total Amount on Right
            doc.font("Helvetica")
                .fontSize(8)
                .fillColor("#6b7280")
                .text("TOTAL AMOUNT PAID", doc.page.width - 150, currentY + 15, { width: 120, align: "right" });
            doc.font("Helvetica-Bold")
                .fontSize(16)
                .fillColor("#111827")
                .text(`INR ${totalPaid}`, doc.page.width - 150, currentY + 30, { width: 120, align: "right" });

            // 8. Security Barcode & Ticket Footer
            currentY += 88;
            doc.rect(25, currentY, doc.page.width - 50, 24).fill("#1f2937");
            doc.font("Courier-Bold")
                .fontSize(10)
                .fillColor("#ffffff")
                .text(`* ${bookingId} *`, 0, currentY + 7, { align: "center", width: doc.page.width });

            // 9. Terms and Conditions footer
            currentY += 34;
            doc.font("Helvetica")
                .fontSize(7)
                .fillColor("#9ca3af")
                .text(
                    "IMPORTANT: Present this e-ticket on your smartphone or as a printed pass at the cinema box office. " +
                    "Ticket is non-refundable once the show begins. Food and beverages subject to cinema policies.",
                    25,
                    currentY,
                    { width: doc.page.width - 50, align: "center", lineGap: 2 }
                );

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};
