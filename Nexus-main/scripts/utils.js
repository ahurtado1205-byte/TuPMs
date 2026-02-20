const Utils = {
    formatDate: (date) => {
        return new Intl.DateTimeFormat('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(new Date(date));
    },

    formatDateTime: (date) => {
        return new Intl.DateTimeFormat('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    },

    getShortDayName: (date) => {
        return new Intl.DateTimeFormat('es-AR', { weekday: 'short' }).format(new Date(date));
    },

    isSameDay: (d1, d2) => {
        const date1 = new Date(d1);
        const date2 = new Date(d2);
        return date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate();
    },

    generateId: () => Math.random().toString(36).substr(2, 9),

    calculateStay: (checkin, checkout) => {
        const diffTime = Math.abs(new Date(checkout) - new Date(checkin));
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },

    formatCurrency: (amount) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: Store.hotelInfo.currency || 'USD'
        }).format(amount);
    },

    // --- PRICING ENGINE ---
    calculatePrice: (roomTypeId, ratePlanId, checkin, checkout) => {
        const nights = Utils.calculateStay(checkin, checkout);
        const roomType = Store.getRoomType(roomTypeId);
        const ratePlan = Store.getRatePlan(ratePlanId);

        if (!roomType || !ratePlan) return { total: 0, breakdown: [] };

        let breakdown = [];
        let total = 0;
        let curr = new Date(checkin);

        for (let i = 0; i < nights; i++) {
            const dateStr = curr.toISOString().split('T')[0];
            // Check calendar override or use base
            let base = roomType.baseRate;
            if (Store.ratesCalendar[dateStr] && Store.ratesCalendar[dateStr][roomTypeId]) {
                base = Store.ratesCalendar[dateStr][roomTypeId].base || base;
            }

            const dailyPrice = base * ratePlan.multiplier;
            breakdown.push({ date: new Date(curr), amount: dailyPrice });
            total += dailyPrice;
            curr.setDate(curr.getDate() + 1);
        }

        return { total, breakdown, nights };
    },

    getConfirmationMessage: (res, hotel) => {
        const type = Store.getRoomType(res.roomTypeId);
        if (!type) return `Hola ${res.firstName}, tenemos un problema con tu reserva #${res.id}. Por favor contáctanos.`;

        let msg = hotel.confirmationTemplate || '';

        const replacements = {
            '{firstName}': res.firstName || '',
            '{lastName}': res.lastName || '',
            '{hotelName}': hotel.name || 'Nexus PMS',
            '{hotelAddress}': hotel.address || '',
            '{hotelPhone}': hotel.phone || '',
            '{resId}': res.id || '',
            '{roomName}': res.roomId && res.roomId !== 'unassigned' ? res.roomId : (type.name || 'Sin asignar'),
            '{bedType}': res.bedType === 'mat' ? 'Cama Matrimonial' : 'Camas Twin',
            '{paxCount}': res.paxCount || 0,
            '{checkin}': res.checkin ? Utils.formatDate(res.checkin) : '',
            '{checkout}': res.checkout ? Utils.formatDate(res.checkout) : '',
            '{checkinHours}': hotel.policies?.checkinHours || '14:00',
            '{checkoutHours}': hotel.policies?.checkoutHours || '10:00',
            '{breakfastHours}': hotel.policies?.breakfastHours || '07:30 - 10:30',
            '{total}': Utils.formatCurrency(res.total || 0),
            '{balance}': Utils.formatCurrency((res.total || 0) - (res.paid || 0)),
            '{rules}': (hotel.policies?.rules || []).join('\n')
        };

        Object.keys(replacements).forEach(key => {
            msg = msg.split(key).join(replacements[key]);
        });
        return msg;
    },

    sendWhatsApp: (resId) => {
        const res = Store.reservations.find(r => r.id === resId);
        if (!res) return;
        const phone = (res.phone || '').replace(/\D/g, '');
        if (!phone) {
            alert('⚠️ El huésped no tiene un número de teléfono válido.');
            return;
        }
        const msg = encodeURIComponent(Utils.getConfirmationMessage(res, Store.hotelInfo));
        window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    },

    sendEmail: (resId) => {
        const res = Store.reservations.find(r => r.id === resId);
        if (!res) return;
        if (!res.email) {
            alert('⚠️ El huésped no tiene un email válido.');
            return;
        }
        const hotel = Store.hotelInfo;
        const subject = encodeURIComponent(`Confirmación de Reserva #${res.id} - ${hotel.name}`);
        const body = encodeURIComponent(Utils.getConfirmationMessage(res, hotel).replace(/\n/g, '%0D%0A'));
        window.location.href = `mailto:${res.email}?subject=${subject}&body=${body}`;
    },

    exportQuotePDF: (quoteData) => {
        const hotel = Store.hotelInfo;
        const type = Store.getRoomType(quoteData.typeId);
        const nights = Utils.calculateStay(quoteData.from, quoteData.to);

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head>
                <title>Presupuesto_${quoteData.name.replace(/\s/g, '_')}</title>
                <style>
                    :root { --accent: #00f2ff; --bg: #05070a; }
                    body { font-family: 'Outfit', 'Segoe UI', sans-serif; padding: 50px; color: #333; line-height: 1.6; background: #fff; }
                    .header { border-bottom: 4px solid var(--accent); padding-bottom: 25px; margin-bottom: 40px; display: flex; justify-content: space-between; align-items: flex-end; }
                    .title { font-size: 32px; font-weight: 900; color: #000; text-transform: uppercase; letter-spacing: -1px; }
                    .hotel-brand { text-align: right; }
                    .grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 50px; margin-bottom: 50px; }
                    .card { background: #f8fafc; padding: 25px; border-radius: 16px; border: 1px solid #e2e8f0; }
                    .label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 800; letter-spacing: 1px; margin-bottom: 8px; }
                    .value { font-size: 18px; font-weight: 600; color: #0f172a; }
                    .price-box { background: #0f172a; color: #fff; padding: 30px; border-radius: 20px; text-align: center; margin-top: 30px; position: relative; overflow: hidden; }
                    .price-box::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 5px; background: var(--accent); }
                    .original-price { font-size: 18px; text-decoration: line-through; opacity: 0.5; margin-bottom: 5px; }
                    .final-price { font-size: 48px; font-weight: 900; color: var(--accent); line-height: 1; }
                    .currency { font-size: 16px; opacity: 0.8; margin-left: 5px; }
                    .footer { margin-top: 60px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 30px; }
                    .highlight { color: var(--accent); font-weight: 700; }
                    @media print { .no-print { display: none; } body { padding: 20px; } }
                </style>
            </head>
            <body>
                <div style="display:flex; justify-content:center; margin-bottom:30px;" class="no-print">
                    <button onclick="window.print()" style="padding: 12px 30px; background: #000; color: #fff; border: none; border-radius: 50px; cursor: pointer; font-weight: 700; display: flex; align-items: center; gap: 10px; box-shadow: 0 10px 20px rgba(0,0,0,0.1);">
                        🖨️ IMPRIMIR O GUARDAR PDF
                    </button>
                </div>

                <div class="header">
                    <div>
                        <div class="label">Propuesta de Estadía</div>
                        <div class="title">Presupuesto</div>
                    </div>
                    <div class="hotel-brand">
                        <div style="font-size: 24px; font-weight: 900;">${hotel.name}</div>
                        <div style="font-size: 13px; color: #64748b;">${hotel.address}</div>
                    </div>
                </div>

                <div class="grid">
                    <div>
                        <div class="label">Preparado para</div>
                        <div style="font-size: 28px; font-weight: 800; margin-bottom: 30px;">${quoteData.name}</div>
                        
                        <div class="card">
                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
                                <div>
                                    <div class="label">Check-in</div>
                                    <div class="value">${Utils.formatDate(quoteData.from)}</div>
                                </div>
                                <div>
                                    <div class="label">Check-out</div>
                                    <div class="value">${Utils.formatDate(quoteData.to)}</div>
                                </div>
                                <div>
                                    <div class="label">Noches</div>
                                    <div class="value">${nights}</div>
                                </div>
                                <div>
                                    <div class="label">Huéspedes</div>
                                    <div class="value">${quoteData.pax} Personas</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div class="label">Categoría Seleccionada</div>
                        <div style="font-size: 22px; font-weight: 700; margin-bottom: 15px;">${type ? type.name : 'Junior Suite'}</div>
                        <p style="font-size: 14px; color: #64748b; margin-bottom: 25px;">Experiencia exclusiva que incluye desayuno buffet artesanal, acceso a Spa & Relax, y Wi-Fi de alta velocidad en todo el establecimiento.</p>
                        
                        <div class="price-box">
                            <div class="label" style="color:rgba(255,255,255,0.5)">Inversión Total</div>
                            ${quoteData.originalTotal && quoteData.originalTotal > quoteData.total ? `<div class="original-price">${Utils.formatCurrency(quoteData.originalTotal)}</div>` : ''}
                            <div class="final-price">${Utils.formatCurrency(quoteData.total)}<span class="currency">${hotel.currency || 'USD'}</span></div>
                            <div style="font-size: 12px; margin-top: 15px; opacity: 0.7;">* Incluye Impuestos y Tasas</div>
                        </div>
                    </div>
                </div>

                <div style="border-left: 4px solid var(--accent); padding-left: 20px; margin-top: 50px;">
                    <div class="label">Términos y Condiciones</div>
                    <div style="font-size: 13px; color: #475569; max-width: 600px;">
                        Esta cotización es de carácter informativo y no garantiza la reserva del cupo. 
                        La disponibilidad está sujeta a cambios sin previo aviso hasta la confirmación mediante seña. 
                        Propuesta válida por 48 horas desde su emisión.
                    </div>
                </div>

                <div class="footer">
                    ${hotel.name} • ${hotel.phone} • ${hotel.email} • ${hotel.address}
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
    },

    exportProforma: (resId) => {
        const res = Store.reservations.find(r => r.id === resId);
        if (!res) return;
        const hotel = Store.hotelInfo;
        const type = Store.getRoomType(res.roomTypeId);

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head>
                <title>Proforma_${res.id}</title>
                <style>
                    body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #333; line-height: 1.6; }
                    .header { border-bottom: 3px solid var(--accent-gold, #d4af37); padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
                    .proforma-title { font-size: 28px; font-weight: 800; color: #d4af37; text-transform: uppercase; letter-spacing: 2px; }
                    .hotel-info { text-align: right; }
                    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
                    .section-title { font-size: 14px; text-transform: uppercase; color: #888; font-weight: 800; border-bottom: 1px solid #eee; margin-bottom: 15px; padding-bottom: 5px; }
                    .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
                    .total-box { background: #fdfaf0; border: 2px solid #d4af37; padding: 20px; border-radius: 12px; text-align: center; margin-top: 20px; }
                    .total-val { font-size: 32px; font-weight: 800; color: #d4af37; }
                    .disclaimer { margin-top: 50px; font-size: 11px; color: #999; text-align: center; font-style: italic; }
                    @media print { .no-print { display: none; } }
                </style>
            </head>
            <body>
                <button class="no-print" onclick="window.print()" style="padding: 10px 20px; background: #d4af37; color: white; border: none; border-radius: 5px; cursor: pointer; margin-bottom: 20px;">Imprimir Proforma / Presupuesto</button>
                <div class="header">
                    <div class="proforma-title">Proforma / Presupuesto</div>
                    <div class="hotel-info">
                        <div style="font-weight: 800; font-size: 18px;">${hotel.name}</div>
                        <div style="font-size: 12px; opacity: 0.7;">${hotel.address}</div>
                    </div>
                </div>
                <div class="grid">
                    <div>
                        <div class="section-title">Datos del Huésped</div>
                        <div style="font-size: 18px; font-weight: 600;">${res.lastName}, ${res.firstName}</div>
                        <div style="font-size: 14px; opacity: 0.8;">${res.email || ''}</div>
                        <div style="font-size: 14px; opacity: 0.8;">${res.phone || ''}</div>
                    </div>
                    <div>
                        <div class="section-title">Detalles de la Estadía</div>
                        <div class="detail-row"><span>Ingreso:</span> <strong>${Utils.formatDate(res.checkin)}</strong></div>
                        <div class="detail-row"><span>Egreso:</span> <strong>${Utils.formatDate(res.checkout)}</strong></div>
                        <div class="detail-row"><span>Noches:</span> <strong>${Utils.calculateStay(res.checkin, res.checkout)}</strong></div>
                    </div>
                </div>
                <div class="section-title">Alojamiento & Servicios</div>
                <div class="detail-row" style="font-size: 18px;">
                    <span>${type ? type.name : 'Habitación'} (${res.bedType === 'mat' ? 'Matrimonial' : 'Twin'})</span>
                    <strong>${Utils.formatCurrency(res.total)}</strong>
                </div>
                <div style="font-size: 13px; opacity: 0.7; margin-top: 5px;">* Incluye desayuno y acceso a áreas comunes.</div>
                
                <div class="total-box">
                    <div style="font-size: 14px; text-transform: uppercase; font-weight: 700;">Importe Total a Pagar</div>
                    <div class="total-val">${Utils.formatCurrency(res.total)}</div>
                    <div style="font-size: 12px; opacity: 0.6; margin-top: 5px;">Valores expresados en ${hotel.currency || 'USD'}</div>
                </div>

                <div class="disclaimer">
                    ${hotel.proformaDisclaimer}
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
    },

    exportPDF: (resId) => {
        const res = Store.reservations.find(r => r.id === resId);
        const hotel = Store.hotelInfo;
        const type = Store.getRoomType(res.roomTypeId);

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head>
                <title>Voucher_${res.id}</title>
                <style>
                    body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #333; line-height: 1.6; }
                    .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
                    .hotel-name { font-size: 24px; font-weight: bold; }
                    .res-id { color: #666; font-size: 18px; }
                    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
                    .label { font-size: 12px; text-transform: uppercase; color: #888; font-weight: bold; }
                    .val { font-size: 16px; margin-bottom: 10px; }
                    .footer { margin-top: 50px; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #999; }
                    .rules { background: #f9f9f9; padding: 20px; border-radius: 8px; margin-top: 20px; }
                    @media print { .no-print { display: none; } }
                </style>
            </head>
            <body>
                <button class="no-print" onclick="window.print()">Imprimir PDF</button>
                <div class="header">
                    <div>
                        <div class="hotel-name">${hotel.name}</div>
                        <div>${hotel.tagline}</div>
                    </div>
                    <div class="res-id">VOUCHER #${res.id}</div>
                </div>
                <div class="grid">
                    <div>
                        <div class="label">Huésped</div>
                        <div class="val">${res.lastName}, ${res.firstName}</div>
                        <div class="label">Pax / Config</div>
                        <div class="val">${res.paxCount} Pax - ${res.bedType === 'mat' ? 'Matrimonial' : 'Twin'}</div>
                    </div>
                    <div>
                        <div class="label">Estadía</div>
                        <div class="val">${Utils.formatDate(res.checkin)} al ${Utils.formatDate(res.checkout)}</div>
                        <div class="label">Habitación</div>
                        <div class="val">${res.roomId || 'Sin Asignar'} (${type.name})</div>
                    </div>
                    <div>
                        <div class="label">Total Estancia</div>
                        <div class="val">${Utils.formatCurrency(res.total)}</div>
                    </div>
                    <div>
                        <div class="label">Garantía / Seña</div>
                        <div class="val">${Utils.formatCurrency(res.paid || 0)}</div>
                    </div>
                </div>
                <div class="rules">
                    <div class="label">Información Importante</div>
                    <p>Check-in: ${hotel.policies.checkinHours} | Check-out: ${hotel.policies.checkoutHours} | Desayuno: ${hotel.policies.breakfastHours}</p>
                    <div class="label">Normas</div>
                    <ul>${hotel.policies.rules.map(r => `<li>${r}</li>`).join('')}</ul>
                </div>
                <div class="footer">
                    ${hotel.address} | ${hotel.phone} | ${hotel.email}
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
    },

    // --- REPORTS HELPERS ---
    getDatesInRange: (start, end) => {
        const dates = [];
        let curr = new Date(start);
        curr.setHours(12, 0, 0, 0);
        const last = new Date(end);
        last.setHours(12, 0, 0, 0);
        while (curr <= last) {
            dates.push(new Date(curr));
            curr.setDate(curr.getDate() + 1);
        }
        return dates;
    },

    getNightsInRange: (checkin, checkout, rangeStart, rangeEnd) => {
        const start = new Date(Math.max(new Date(checkin), new Date(rangeStart)));
        const end = new Date(Math.min(new Date(checkout), new Date(rangeEnd)));
        if (start >= end) return 0;
        return Math.floor((end - start) / 86400000);
    },

    isDateInRange: (date, start, end) => {
        const d = new Date(date).setHours(0, 0, 0, 0);
        const s = new Date(start).setHours(0, 0, 0, 0);
        const e = new Date(end).setHours(0, 0, 0, 0);
        return d >= s && d <= e;
    },

    exportToCSV: (filename, data) => {
        if (!data || !data.length) return;
        const headers = Object.keys(data[0]).join(';');
        const rows = data.map(row =>
            Object.values(row).map(val =>
                typeof val === 'string' ? `"${val}"` : val
            ).join(';')
        ).join('\n');

        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers + "\n" + rows;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    // --- SEARCH ---
    universalSearch: (query) => {
        if (!query || query.length < 2) return [];
        const q = query.toLowerCase();
        return {
            reservations: Store.reservations.filter(r =>
                r.firstName.toLowerCase().includes(q) ||
                r.lastName.toLowerCase().includes(q) ||
                r.id.toLowerCase().includes(q) ||
                Utils.formatDate(r.checkin).includes(q)
            ).slice(0, 5),
            guests: Store.guests.filter(g =>
                g.name.toLowerCase().includes(q) ||
                g.doc.includes(q)
            ).slice(0, 5)
        };
    }
};

