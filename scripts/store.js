const Store = {
    // --- DATA MODEL ---
    hotelInfo: {
        name: 'NEXUS PMS',
        tagline: 'Reservations & Control',
        address: 'Av. Libertador 1234, Bariloche',
        phone: '+54 9 11 1234 5678',
        email: 'nexus@hotel.com',
        currency: 'USD',
        timezone: 'GMT-3',
        taxes: 0.21,
        policies: {
            checkinHours: '14:00',
            checkoutHours: '10:00',
            breakfastHours: '07:30 - 10:30',
            depositRequired: 0.3,
            rules: [
                '🚫 Prohibido fumar en áreas cerradas.',
                '🤫 Respetar el silencio de 22:00 a 08:00.',
                '🐾 Pet Friendly previa coordinación.',
                '🏊 El uso de piscina requiere ducha previa.'
            ]
        },
        confirmationTemplate: `🏔️ *¡BIENVENIDO A EL PARAÍSO!* 🏔️\n\nHola *{firstName}*, es un placer confirmarte tu estadía en *{hotelName}*.\n\n📍 *Nº Confirmación:* {resId}\n\n📅 *Detalles de tu visita:* \n• Check-in: {checkin} (desde las {checkinHours}hs)\n• Check-out: {checkout} (hasta las {checkoutHours}hs)\n• Desayuno: {breakfastHours}\n\n🛏️ *Tu rincón:* {roomName} ({bedType})\n👥 *Pax:* {paxCount}\n\n💰 *Total:* {total}\n⚠️ *Saldo a pagar:* {balance}\n\n---\n📜 *Normas del Hotel:*\n{rules}\n\n📍 *Ubicación:* {hotelAddress}\n📞 *WhatsApp:* {hotelPhone}\n\n¡Estamos ansiosos por recibirte! ✨`,
        proformaDisclaimer: `Este documento es un presupuesto informativo y no constituye una confirmación de reserva definitiva hasta tanto no se perciba la correspondiente seña. Tarifas sujetas a disponibilidad al momento de la contratación efectiva. Válida por 48 horas.`,
        systemDate: new Date().toISOString().split('T')[0] // Operational date of the hotel
    },

    roomTypes: [
        { id: 'std', name: 'Standard', capacity: 2, baseRate: 100, color: '#3b82f6' },
        { id: 'sup', name: 'Superior', capacity: 3, baseRate: 150, color: '#10b981' },
        { id: 'dlx', name: 'Deluxe', capacity: 2, baseRate: 250, color: '#bc13fe' },
        { id: 'ste', name: 'Suite', capacity: 4, baseRate: 500, color: '#ffcc00' }
    ],

    ratePlans: [
        { id: 'A', name: 'Flexible', cancelPolicy: '24h', refundable: true, breakfast: true, minNights: 1, multiplier: 1.0, conditions: [] },
        { id: 'B', name: 'No Reembolsable', cancelPolicy: 'NR', refundable: false, breakfast: true, minNights: 1, multiplier: 0.85, conditions: [] },
        { id: 'C', name: 'Larga Estadía', cancelPolicy: '7d', refundable: true, breakfast: false, minNights: 5, multiplier: 0.75, conditions: [] },
        { id: 'D', name: 'Último Minuto', cancelPolicy: 'NR', refundable: false, breakfast: true, minNights: 1, multiplier: 0.95, conditions: [] }
    ],

    ratesCalendar: {}, // { '2026-02-20': { std: { A: 100, B: 85 } } }

    rooms: [
        { id: '101', name: '101', typeId: 'std', status: 'clean' },
        { id: '102', name: '102', typeId: 'std', status: 'dirty' },
        { id: '103', name: '103', typeId: 'sup', status: 'clean' },
        { id: '201', name: '201', typeId: 'sup', status: 'in-progress' },
        { id: '202', name: '202', typeId: 'dlx', status: 'clean' },
        { id: '203', name: '203', typeId: 'dlx', status: 'ooo' },
        { id: '301', name: '301', typeId: 'ste', status: 'clean' }
    ],

    guests: [
        {
            id: 'g-1',
            firstName: 'John', lastName: 'Doe',
            docType: 'DNI', docNumber: '12345678',
            nationality: 'AR', birthDate: '1985-06-15',
            email: 'john@example.com', phone: '+5491112345678',
            address: 'Av. Libertad 123', city: 'Buenos Aires', country: 'AR',
            preferences: 'Piso alto, sin alfombra',
            flags: ['VIP'],
            companions: [],
            notes: '',
            createdAt: new Date(),
            updatedAt: new Date()
        }
    ],

    reservations: [],
    payments: [],
    folios: {}, // { resId: { charges: [], extras: [], balance: 0 } }
    quotes: [], // { id, name, from, to, pax, typeId, total, contact, followUpDate, createdAt }
    tasks: [],
    auditLog: [],
    users: [
        { id: 'u-1', name: 'Admin', role: 'admin' },
        { id: 'u-2', name: 'Juan', role: 'front' }
    ],

    currentUser: { id: 'u-1', name: 'Admin', role: 'admin' },

    // --- CONFIG ---
    rackStartDate: new Date(new Date().setDate(new Date().getDate() - 2)),
    rackDaysToShow: 21,
    availabilityStartDate: new Date(),
    ratesStartDate: new Date(),

    // --- INITIALIZATION ---
    init: () => {
        const saved = localStorage.getItem('NEXUS_STORE');
        if (saved) {
            const data = JSON.parse(saved);
            // Master data (rooms, roomTypes, ratePlans) are now editable and saved
            Store.hotelInfo = data.hotelInfo || Store.hotelInfo;
            Store.rooms = data.rooms || Store.rooms;
            Store.rooms.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
            Store.roomTypes = data.roomTypes || Store.roomTypes;
            Store.ratePlans = data.ratePlans || Store.ratePlans;
            Store.reservations = data.reservations || [];
            Store.guests = data.guests || [];
            Store.payments = data.payments || [];
            Store.tasks = data.tasks || [];
            Store.auditLog = data.auditLog || [];
            Store.folios = data.folios || {};
            Store.quotes = data.quotes || [];
            Store.ratesCalendar = data.ratesCalendar || {};

            // Re-convert dates from strings
            Store.rackStartDate = new Date(data.rackStartDate || new Date());
            Store.availabilityStartDate = new Date(data.availabilityStartDate || new Date());
            Store.ratesStartDate = new Date(data.ratesStartDate || new Date());
            Store.reservations.forEach(r => {
                // Migration: Ensure roomId is always camelCase
                if (r.roomid && !r.roomId) {
                    r.roomId = r.roomid;
                    delete r.roomid;
                }
                r.checkin = new Date(r.checkin);
                r.checkout = new Date(r.checkout);
                r.createdAt = new Date(r.createdAt);
            });
            Store.payments.forEach(p => p.date = new Date(p.date));
            Store.auditLog.forEach(a => {
                if (a.timestamp) a.timestamp = new Date(a.timestamp);
            });
            Store.quotes.forEach(q => {
                q.createdAt = new Date(q.createdAt);
                if (q.from) q.from = new Date(q.from);
                if (q.to) q.to = new Date(q.to);
            });
            // Re-convert guest dates
            Store.guests.forEach(g => {
                if (g.createdAt) g.createdAt = new Date(g.createdAt);
                if (g.updatedAt) g.updatedAt = new Date(g.updatedAt);
            });

            // Clean up expired holds (24h pre-reservations)
            const now = new Date();
            let changed = false;
            Store.reservations.forEach(r => {
                if (r.holdUntil) {
                    r.holdUntil = new Date(r.holdUntil);
                    if (r.status === 'tentativa' && r.holdUntil < now) {
                        r.status = 'cancelada';
                        r.notes = (r.notes || '') + '\n[AUTO] Hold expirado tras 24h.';
                        changed = true;
                    }
                }
            });
            if (changed) Store.save();
        } else {
            Store.seed();
        }
    },

    getSystemDate: () => new Date(Store.hotelInfo.systemDate + 'T12:00:00'),

    runNightAudit: () => {
        const current = Store.getSystemDate();
        current.setDate(current.getDate() + 1);
        Store.hotelInfo.systemDate = current.toISOString().split('T')[0];

        // Sync view dates to the new system date
        Store.rackStartDate = new Date(current.getTime());
        Store.rackStartDate.setDate(Store.rackStartDate.getDate() - 2);
        Store.availabilityStartDate = new Date(current.getTime());
        Store.ratesStartDate = new Date(current.getTime());

        Store.addAudit('NIGHT_AUDIT', 'system', 'date', null, Store.hotelInfo.systemDate);
        Store.notify();
        alert(`🌙 Auditoría Nocturna Exitosa\nEl sistema ahora opera con fecha: ${Utils.formatDate(Store.hotelInfo.systemDate)}`);
    },

    updateRatePlan: (id, updates) => {
        const index = Store.ratePlans.findIndex(p => p.id === id);
        if (index !== -1) {
            Store.ratePlans[index] = { ...Store.ratePlans[index], ...updates };
            Store.notify();
        }
    },

    deleteRatePlan: (id) => {
        Store.ratePlans = Store.ratePlans.filter(p => p.id !== id);
        Store.notify();
    },

    seed: () => {
        const today = new Date();
        Store.reservations = [
            {
                id: '101-' + today.toISOString().slice(0, 10).replace(/-/g, ''),
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                market: 'IND',
                source: 'Whatsapp',
                status: 'in-house',
                checkin: new Date(new Date().setDate(new Date().getDate() - 1)),
                checkout: new Date(new Date().setDate(new Date().getDate() + 2)),
                roomId: '101',
                roomTypeId: 'std',
                ratePlanId: 'A',
                paxCount: 2,
                bedType: 'mat',
                total: 300,
                paid: 100,
                channel: 'Directo',
                createdAt: new Date()
            }
        ];
        Store.save();
    },

    save: () => {
        localStorage.setItem('NEXUS_STORE', JSON.stringify({
            hotelInfo: Store.hotelInfo,
            rooms: Store.rooms,
            roomTypes: Store.roomTypes,
            ratePlans: Store.ratePlans,
            reservations: Store.reservations,
            guests: Store.guests,
            ratesCalendar: Store.ratesCalendar,
            tasks: Store.tasks,
            quotes: Store.quotes,
            settings: Store.settings,
            auditLog: Store.auditLog
        }));
    },

    notify: () => {
        // Always sort rooms by name (natural sort) before saving and notifying
        Store.rooms.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

        Store.save();
        Store.listeners.forEach(fn => fn());
    },

    addTask: (task) => {
        const newTask = {
            id: Utils.generateId(),
            createdAt: new Date(),
            status: 'pending',
            ...task
        };
        Store.tasks.push(newTask);
        Store.log('Tarea Creada', 'task', newTask.id);
        Store.notify();
    },

    reportsFilters: {
        from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0],
        channel: 'all',
        roomType: 'all',
        includeHolds: false
    },
    settings: {
        theme: localStorage.getItem('nexus-theme') || 'dark'
    },
    listeners: [],
    subscribe: (fn) => Store.listeners.push(fn),

    setTheme: (theme) => {
        Store.settings.theme = theme;
        localStorage.setItem('nexus-theme', theme);
        document.body.setAttribute('data-theme', theme);
        Store.notify();
    },

    // --- HELPERS ---
    getRoom: (id) => Store.rooms.find(r => r.id === id),
    getRoomType: (id) => Store.roomTypes.find(t => t.id === id),
    getGuest: (id) => Store.guests.find(g => g.id === id),
    getRatePlan: (id) => Store.ratePlans.find(p => p.id === id),

    // --- CALCULATIONS & STATS ---
    getRevenueForDate: (res, date) => {
        if (res.status === 'cancelada') return 0;
        const d = new Date(date).toISOString().split('T')[0];

        // Priority 1: Breakdown from Utils.calculatePrice if we recalculate it
        // Since we don't store breakdown by night always, we compute it on the fly
        // if not provided.
        const priceData = Utils.calculatePrice(res.roomTypeId, res.ratePlanId, res.checkin, res.checkout);
        const nightData = priceData.breakdown.find(b => b.date.toISOString().split('T')[0] === d);

        return nightData ? nightData.amount : 0;
    },

    getDailyStats: (date) => {
        const d = new Date(date);
        d.setHours(12, 0, 0, 0);
        const dTime = d.getTime();

        const totalRooms = Store.rooms.length;
        const available = Store.rooms.filter(r => r.status !== 'ooo').length;

        const soldReservations = Store.reservations.filter(r => {
            if (r.status === 'cancelada') return false;
            const cin = new Date(r.checkin).setHours(0, 0, 0, 0);
            const cout = new Date(r.checkout).setHours(0, 0, 0, 0);
            return dTime >= cin && dTime < cout;
        });

        const revenue = soldReservations.reduce((sum, res) => {
            const priceInfo = Utils.calculatePrice(res.roomTypeId, res.ratePlanId, res.checkin, res.checkout);
            const nights = Utils.calculateStay(res.checkin, res.checkout) || 1;
            return sum + (priceInfo.total / nights);
        }, 0);

        const soldCount = soldReservations.length;

        return {
            date: d.toISOString().split('T')[0],
            available,
            sold: soldCount,
            occupancy: available > 0 ? (soldCount / available) * 100 : 0,
            revenue,
            adr: soldCount > 0 ? revenue / soldCount : 0,
            revpar: available > 0 ? revenue / available : 0,
            arrivals: Store.reservations.filter(r => r.status !== 'cancelada' && Utils.isSameDay(r.checkin, d)).length,
            departures: Store.reservations.filter(r => r.status !== 'cancelada' && Utils.isSameDay(r.checkout, d)).length,
            stays: soldReservations.filter(r => !Utils.isSameDay(r.checkin, d)).length,
            inhouse: soldCount,
            guests: soldReservations.reduce((sum, r) => sum + (parseInt(r.adults) || 1) + (parseInt(r.children) || 0), 0)
        };
    },

    isRoomAvailable: (roomId, checkin, checkout, excludeResId = null) => {
        if (!roomId || roomId === 'unassigned') return true;

        // Check if room is OOO
        const room = Store.getRoom(roomId);
        if (room && room.status === 'ooo') return false;

        return !Store.reservations.some(res => {
            if (res.id === excludeResId) return false;
            if (res.status === 'cancelada') return false;
            if (res.roomId !== roomId) return false;
            const s1 = new Date(checkin).getTime();
            const e1 = new Date(checkout).getTime();
            const s2 = new Date(res.checkin).getTime();
            const e2 = new Date(res.checkout).getTime();
            return s1 < e2 && e1 > s2;
        });
    },

    checkAvailabilityInRange: (roomTypeId, checkin, checkout, excludeResId = null) => {
        const startDate = new Date(checkin);
        const endDate = new Date(checkout);
        const roomsInCat = Store.rooms.filter(r => r.typeId === roomTypeId && r.status !== 'ooo');
        const totalRoomsCount = roomsInCat.length;

        let minAvail = totalRoomsCount;
        let curr = new Date(startDate);
        while (curr < endDate) {
            const soldOnDate = Store.reservations.filter(res => {
                if (res.id === excludeResId || res.status === 'cancelada') return false;
                if (res.roomTypeId !== roomTypeId) return false;
                const cin = new Date(res.checkin).getTime();
                const cout = new Date(res.checkout).getTime();
                const d = curr.getTime();
                return d >= cin && d < cout;
            }).length;

            const avail = totalRoomsCount - soldOnDate;
            if (avail < minAvail) minAvail = avail;
            curr.setDate(curr.getDate() + 1);
        }
        return minAvail;
    },

    // --- ACTIONS ---
    addAudit: (action, entityType, entityId, before, after) => {
        Store.auditLog.push({
            timestamp: new Date(),
            user: Store.currentUser.name,
            action,
            entityType,
            entityId,
            before,
            after
        });
    },

    // --- GUEST MANAGEMENT ---
    addGuest: (data) => {
        const id = 'g-' + Utils.generateId();
        const guest = {
            id,
            firstName: '', lastName: '',
            docType: 'DNI', docNumber: '',
            nationality: 'AR', birthDate: '',
            email: '', phone: '',
            address: '', city: '', country: 'AR',
            preferences: '', flags: [], companions: [], notes: '',
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        Store.guests.push(guest);
        Store.addAudit('CREATE', 'guest', id, null, guest);
        Store.notify();
        return id;
    },

    updateGuest: (id, updates) => {
        const index = Store.guests.findIndex(g => g.id === id);
        if (index !== -1) {
            const before = { ...Store.guests[index] };
            Store.guests[index] = { ...Store.guests[index], ...updates, updatedAt: new Date() };
            Store.addAudit('UPDATE', 'guest', id, before, Store.guests[index]);
            Store.notify();
            return true;
        }
        return false;
    },

    findGuestsByName: (query) => {
        const q = query.toLowerCase().trim();
        if (!q || q.length < 2) return [];
        return Store.guests.filter(g => {
            const fullName = `${g.firstName || g.name || ''} ${g.lastName || ''}`.toLowerCase();
            const doc = (g.docNumber || g.doc || '').toLowerCase();
            return fullName.includes(q) || doc.includes(q);
        });
    },

    getGuestReservations: (guestId) => {
        return Store.reservations.filter(r => r.guestId === guestId)
            .sort((a, b) => new Date(b.checkin) - new Date(a.checkin));
    },

    addReservation: (data) => {
        const today = new Date();
        const datePart = today.toISOString().slice(0, 10).replace(/-/g, '');
        const count = Store.reservations.filter(r => r.id.includes(datePart)).length + 101;
        const id = `${count}-${datePart}`;
        const res = { ...data, id, createdAt: new Date() };
        Store.reservations.push(res);
        Store.addAudit('CREATE', 'reservation', id, null, res);
        return id;
    },

    addQuote: (data) => {
        const id = 'Q-' + Utils.generateId().slice(0, 6).toUpperCase();
        const quote = { ...data, id, createdAt: new Date() };
        Store.quotes.push(quote);
        Store.addAudit('CREATE', 'quote', id, null, quote);
        Store.notify();
        return id;
    },

    updateQuote: (id, updates) => {
        const index = Store.quotes.findIndex(q => q.id === id);
        if (index !== -1) {
            const before = { ...Store.quotes[index] };
            Store.quotes[index] = { ...Store.quotes[index], ...updates };
            Store.addAudit('UPDATE', 'quote', id, before, Store.quotes[index]);
            Store.notify();
            return true;
        }
        return false;
    },

    deleteQuote: (id) => {
        const before = Store.quotes.find(q => q.id === id);
        Store.quotes = Store.quotes.filter(q => q.id !== id);
        Store.addAudit('DELETE', 'quote', id, before, null);
        Store.notify();
    },

    updateReservation: (id, updates) => {
        const index = Store.reservations.findIndex(r => r.id === id);
        if (index !== -1) {
            const before = { ...Store.reservations[index] };
            Store.reservations[index] = { ...Store.reservations[index], ...updates };
            Store.addAudit('UPDATE', 'reservation', id, before, Store.reservations[index]);
            Store.notify();
            return true;
        }
        return false;
    },

    deleteReservation: (id) => {
        const before = Store.reservations.find(r => r.id === id);
        Store.reservations = Store.reservations.filter(r => r.id !== id);
        Store.addAudit('DELETE', 'reservation', id, before, null);
        Store.notify();
    },

    updateRoomStatus: (roomId, status) => {
        const room = Store.getRoom(roomId);
        if (room) {
            const before = room.status;
            room.status = status;
            Store.addAudit('UPDATE_STATUS', 'room', roomId, before, status);
            Store.notify();
        }
    },

    addPayment: (resId, payment) => {
        const id = 'pay-' + Utils.generateId();
        const p = { ...payment, id, reservationId: resId, date: new Date() };
        Store.payments.push(p);

        // Update reservation paid amount
        const res = Store.reservations.find(r => r.id === resId);
        if (res) {
            res.paid = (res.paid || 0) + p.monto;
        }

        Store.addAudit('PAYMENT', 'reservation', resId, null, p);
        Store.notify();
    },

    addTask: (task) => {
        const id = 'task-' + Utils.generateId();
        const t = { ...task, id, status: 'pending', createdAt: new Date() };
        Store.tasks.push(t);
        Store.notify();
    },

    updateRoomTypeRate: (typeId, rate) => {
        const type = Store.getRoomType(typeId);
        if (type) {
            const before = type.baseRate;
            type.baseRate = parseFloat(rate);
            Store.addAudit('UPDATE_RATE', 'roomType', typeId, { baseRate: before }, { baseRate: type.baseRate });
            Store.notify();
        }
    },

    updateRatePlan: (id, updates) => {
        const index = Store.ratePlans.findIndex(p => p.id === id);
        if (index !== -1) {
            const before = { ...Store.ratePlans[index] };
            Store.ratePlans[index] = { ...Store.ratePlans[index], ...updates };
            Store.addAudit('UPDATE_RATE_PLAN', 'ratePlan', id, before, Store.ratePlans[index]);
            Store.notify();
        }
    },

    deleteRatePlan: (id) => {
        const before = Store.ratePlans.find(p => p.id === id);
        Store.ratePlans = Store.ratePlans.filter(p => p.id !== id);
        Store.addAudit('DELETE_RATE_PLAN', 'ratePlan', id, before, null);
        Store.notify();
    },

    updateHotelInfo: (updates) => {
        const before = { ...Store.hotelInfo };
        Store.hotelInfo = { ...Store.hotelInfo, ...updates };
        Store.addAudit('UPDATE_HOTEL_INFO', 'hotel', 'hotel-1', before, Store.hotelInfo);
        Store.notify();
    },

    updateDailyRate: (dateStr, roomTypeId, price) => {
        if (!Store.ratesCalendar[dateStr]) Store.ratesCalendar[dateStr] = {};
        if (!Store.ratesCalendar[dateStr][roomTypeId]) Store.ratesCalendar[dateStr][roomTypeId] = {};

        const before = Store.ratesCalendar[dateStr][roomTypeId].base;
        Store.ratesCalendar[dateStr][roomTypeId].base = parseFloat(price);
        Store.addAudit('UPDATE_DAILY_RATE', 'rate', `${dateStr}-${roomTypeId}`, { base: before }, { base: Store.ratesCalendar[dateStr][roomTypeId].base });
        Store.notify();
    }
};


// Auto-init
Store.init();

