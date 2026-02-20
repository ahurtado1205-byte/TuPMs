const UI = {
    // --- DASHBOARD & KPIs ---
    renderKPIs: () => {
        const today = Store.getSystemDate();
        const stats = Store.getDailyStats(today);

        if (document.getElementById('kpi-occupancy')) document.getElementById('kpi-occupancy').textContent = `${Math.round(stats.occupancy)}%`;
        if (document.getElementById('kpi-arrivals')) document.getElementById('kpi-arrivals').textContent = stats.arrivals;
        if (document.getElementById('kpi-departures')) document.getElementById('kpi-departures').textContent = stats.departures;
        if (document.getElementById('kpi-inhouse')) document.getElementById('kpi-inhouse').textContent = stats.sold;
        if (document.getElementById('kpi-revpar')) document.getElementById('kpi-revpar').textContent = Utils.formatCurrency(stats.revpar);
        if (document.getElementById('kpi-adr')) document.getElementById('kpi-adr').textContent = Utils.formatCurrency(stats.adr);

        const options = { weekday: 'long', day: 'numeric', month: 'long' };
        const dateStr = today.toLocaleDateString('es-AR', options).toUpperCase();

        const headerInfo = document.getElementById('dashboard-header-info');
        if (headerInfo) {
            headerInfo.innerHTML = `
                <div class="today-badge" style="margin-bottom: 0; background: var(--bg-secondary); border: 1px solid var(--accent-cyan); padding: 0.5rem 1rem; border-radius: 50px; display: flex; align-items: center; gap: 10px;">
                    <ion-icon name="calendar-outline" style="color: var(--accent-cyan);"></ion-icon>
                    <span class="day-name" style="font-size: 0.9rem; font-weight: 800; color: var(--accent-cyan);">${dateStr}</span>
                    <span style="font-size: 0.7rem; opacity: 0.5; text-transform: uppercase;">(Fecha del Sistema)</span>
                </div>
            `;
        }
    },

    // --- MODULE 1 & 2: ROOM RACK (Visual secret weapon) ---
    renderRack: () => {
        const container = document.getElementById('view-content');
        const DAY_W = 52; // px per day column
        const ROW_H = 40; // px per room row
        const LABEL_W = 160; // px for left label column
        const days = Store.rackDaysToShow || 14;

        const dates = Array.from({ length: days }, (_, i) => {
            const d = new Date(Store.rackStartDate);
            d.setDate(d.getDate() + i);
            return d;
        });

        const rackStart = new Date(Store.rackStartDate);
        rackStart.setHours(0, 0, 0, 0);

        // Group rooms by type
        const groups = Store.roomTypes.map(type => ({
            type,
            rooms: Store.rooms.filter(r => r.typeId === type.id)
        })).filter(g => g.rooms.length > 0);

        const totalWidth = LABEL_W + days * DAY_W;

        // Status color map
        const statusColors = {
            'confirmada': { bg: '#16a34a', text: '#fff', border: '#15803d' },
            'tentativa': { bg: '#d97706', text: '#fff', border: '#b45309' },
            'in-house': { bg: '#0284c7', text: '#fff', border: '#0369a1' },
            'checkout': { bg: '#64748b', text: '#fff', border: '#475569' },
            'cancelada': { bg: '#dc2626', text: '#fff', border: '#b91c1c' },
        };

        container.innerHTML = `
            <div style="display:flex; flex-direction:column; height:100%; gap:0;">

                <!-- TOOLBAR -->
                <div style="display:flex; align-items:center; justify-content:space-between; padding:0.8rem 0; flex-wrap:wrap; gap:0.8rem; flex-shrink:0;">
                    <div style="display:flex; align-items:center; gap:0.5rem;">
                        <button class="btn btn-secondary btn-sm" onclick="UI.moveRack(-7)" title="Semana anterior"><ion-icon name="chevron-back"></ion-icon></button>
                        <button class="btn btn-secondary btn-sm" onclick="UI.resetRack()" style="font-weight:700;">HOY</button>
                        <button class="btn btn-secondary btn-sm" onclick="UI.moveRack(7)" title="Semana siguiente"><ion-icon name="chevron-forward"></ion-icon></button>
                        <input type="date" value="${Store.rackStartDate.toISOString().split('T')[0]}"
                            onclick="this.showPicker()"
                            onchange="Store.rackStartDate = new Date(this.value + 'T00:00:00'); UI.renderRack();"
                            style="padding:0.35rem 0.6rem; border-radius:8px; border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--text-primary); font-size:0.8rem;">
                        <select onchange="Store.rackDaysToShow = parseInt(this.value); UI.renderRack();"
                            style="padding:0.35rem 0.6rem; border-radius:8px; border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--text-primary); font-size:0.8rem;">
                            <option value="14" ${days === 14 ? 'selected' : ''}>14 días</option>
                            <option value="21" ${days === 21 ? 'selected' : ''}>21 días</option>
                            <option value="28" ${days === 28 ? 'selected' : ''}>28 días</option>
                        </select>
                    </div>
                    <div style="display:flex; align-items:center; gap:0.6rem;">
                        <!-- Legend -->
                        <div style="display:flex; gap:0.8rem; font-size:0.7rem; align-items:center; opacity:0.8; margin-right:0.5rem;">
                            <span style="display:flex;align-items:center;gap:3px;"><span style="width:10px;height:10px;border-radius:2px;background:#16a34a;display:inline-block;"></span>Confirmada</span>
                            <span style="display:flex;align-items:center;gap:3px;"><span style="width:10px;height:10px;border-radius:2px;background:#d97706;display:inline-block;"></span>Tentativa</span>
                            <span style="display:flex;align-items:center;gap:3px;"><span style="width:10px;height:10px;border-radius:2px;background:#0284c7;display:inline-block;"></span>In-House</span>
                            <span style="display:flex;align-items:center;gap:3px;"><span style="width:10px;height:10px;border-radius:2px;background:#64748b;display:inline-block;"></span>Checkout</span>
                        </div>
                        <button class="btn btn-secondary btn-sm" onclick="UI.openUnassignedModal()">
                            <ion-icon name="list-outline"></ion-icon>
                            Sin asignar (${Store.reservations.filter(r => (!r.roomId || r.roomId === 'unassigned') && r.status !== 'cancelada').length})
                        </button>
                        <button class="btn btn-primary btn-sm" onclick="UI.openReservationModal()">
                            <ion-icon name="add"></ion-icon> Nueva Reserva
                        </button>
                    </div>
                </div>

                <!-- RACK TABLE -->
                <div style="flex:1; overflow:auto; border-radius:16px; border:1px solid var(--border-color); background: var(--bg-secondary);" class="glass">
                    <div style="min-width:${totalWidth}px; position:relative;">

                        <!-- STICKY HEADER -->
                        <div style="display:flex; position:sticky; top:0; z-index:20; background:var(--bg-secondary); border-bottom:2px solid var(--border-color);">
                            <div style="width:${LABEL_W}px; min-width:${LABEL_W}px; padding:0.6rem 1rem; font-size:0.65rem; font-weight:800; text-transform:uppercase; letter-spacing:.06em; color:var(--accent-cyan); border-right:2px solid var(--border-color); display:flex; align-items:center;">
                                HABITACIÓN
                            </div>
                            ${dates.map(d => {
            const isToday = Utils.isSameDay(d, new Date());
            const isSun = d.getDay() === 0;
            const isSat = d.getDay() === 6;
            return `<div style="
                                    width:${DAY_W}px; min-width:${DAY_W}px; text-align:center; padding:0.4rem 0;
                                    border-right:1px solid var(--border-color);
                                    background:${isToday ? 'rgba(var(--accent-cyan-rgb, 0, 150, 170), 0.15)' : (isSat || isSun) ? 'rgba(0,0,0,0.05)' : 'transparent'};
                                ">
                                    <div style="font-size:0.55rem; font-weight:700; opacity:${isToday ? '1' : '0.6'}; color:${isToday ? 'var(--accent-cyan)' : 'var(--text-secondary)'}; text-transform:uppercase;">${Utils.getShortDayName(d)}</div>
                                    <div style="font-size:0.95rem; font-weight:${isToday ? '900' : '600'}; color:${isToday ? 'var(--accent-cyan)' : 'var(--text-primary)'};">${d.getDate()}</div>
                                    <div style="font-size:0.5rem; opacity:0.5; color:var(--text-muted);">${d.toLocaleDateString('es-AR', { month: 'short' })}</div>
                                </div>`;
        }).join('')}
                        </div>

                        <!-- BODY: groups + rows -->
                        ${groups.map(group => {
            const catColor = group.type.color || 'var(--accent-cyan)';

            const rowsHtml = group.rooms.map(room => {
                const isOOO = room.status === 'ooo';

                // 1. Get reservations for this room first (needed for split cells below)
                const resOnRoom = Store.reservations.filter(r => r.roomId === room.id && r.status !== 'cancelada');

                // 2. Build day cells
                const cellsHtml = dates.map(d => {
                    const dateISO = d.toISOString();
                    const isToday = Utils.isSameDay(d, new Date());
                    const isSun = d.getDay() === 0;
                    const isSat = d.getDay() === 6;

                    // Split Cell Logic
                    const hasIn = resOnRoom.some(r => Utils.isSameDay(r.checkin, d));
                    const hasOut = resOnRoom.some(r => Utils.isSameDay(r.checkout, d));
                    const isDayUse = resOnRoom.some(r => Utils.isSameDay(r.checkin, d) && Utils.isSameDay(r.checkout, d));

                    const baseBg = isToday ? 'rgba(var(--accent-cyan-rgb, 0, 150, 170), 0.05)' : (isSat || isSun) ? 'rgba(0,0,0,0.02)' : 'transparent';

                    return `<div style="
                                        width:${DAY_W}px; min-width:${DAY_W}px; height:${ROW_H}px;
                                        border-right:1px solid var(--border-color);
                                        display:flex;
                                        background:${baseBg};
                                        cursor:${isOOO ? 'not-allowed' : 'pointer'};
                                        position:relative;
                                        transition:background 0.15s;
                                    "
                                    ${!isOOO ? `onclick="UI.quickReserve('${room.id}', '${dateISO}')"
                                    ondragover="UI.handleDragOver(event)"
                                    ondrop="UI.handleDrop(event,'${room.id}','${dateISO}')"` : ''}
                                    onmouseover="if(!${isOOO}) this.style.background='rgba(0,200,220,0.15)'"
                                    onmouseout="this.style.background='${baseBg}'"
                                    >
                                        <!-- LEFT: OUT / Morning (50%) -->
                                        <div style="flex: 0 0 50%; height:100%; display:flex; align-items:flex-end; padding:4px;
                                            background:${hasOut && !isDayUse ? 'rgba(239,68,68,0.2)' : 'transparent'};">
                                            ${hasOut && !isDayUse ? `<ion-icon name="log-out-outline" style="font-size:0.7rem; color:#ef4444; opacity:0.8;"></ion-icon>` : ''}
                                        </div>
                                        
                                        <!-- RIGHT: IN / Afternoon (50%) -->
                                        <div style="flex: 0 0 50%; height:100%; display:flex; align-items:flex-start; justify-content:flex-end; padding:4px;
                                            background:${hasIn && !isDayUse ? 'rgba(34,197,94,0.2)' : 'transparent'};">
                                            ${hasIn && !isDayUse ? `<ion-icon name="log-in-outline" style="font-size:0.7rem; color:#22c55e; opacity:0.8;"></ion-icon>` : ''}
                                        </div>

                                        <!-- OVERLAY: DAY USE -->
                                        ${isDayUse ? `
                                            <div style="position:absolute; inset:4px; background:rgba(212,175,55,0.2); border:1.5px dashed var(--accent-gold); border-radius:4px; display:flex; align-items:center; justify-content:center; z-index:2;">
                                                <ion-icon name="sunny" style="font-size:0.7rem; color:var(--accent-gold);"></ion-icon>
                                            </div>
                                        ` : ''}
                                    </div>`;
                }).join('');

                // Build reservation bars
                const barsHtml = resOnRoom.map(res => {
                    const cin = new Date(res.checkin); cin.setHours(0, 0, 0, 0);
                    const cout = new Date(res.checkout); cout.setHours(0, 0, 0, 0);
                    const rackEnd = new Date(rackStart); rackEnd.setDate(rackEnd.getDate() + days);

                    if (cout <= rackStart || cin >= rackEnd) return '';

                    const clampedStart = cin < rackStart ? rackStart : cin;
                    const clampedEnd = cout > rackEnd ? rackEnd : cout;

                    const startOffset = Math.round((clampedStart - rackStart) / 86400000);
                    const barDays = Math.round((clampedEnd - clampedStart) / 86400000);
                    if (barDays <= 0) return '';

                    const left = startOffset * DAY_W + 2;
                    const width = barDays * DAY_W - 4;
                    const col = statusColors[res.status] || statusColors['confirmada'];
                    const isPastCheckout = cout < new Date();

                    return `<div style="
                                        position:absolute;
                                        left:${left}px; width:${width}px;
                                        top:4px; height:${ROW_H - 8}px;
                                        background:${col.bg};
                                        border:1.5px solid ${col.border};
                                        border-radius:5px;
                                        display:flex; align-items:center;
                                        padding:0 8px;
                                        overflow:hidden;
                                        cursor:pointer;
                                        opacity:${isPastCheckout ? '0.65' : '1'};
                                        box-shadow: 0 2px 6px rgba(0,0,0,0.35);
                                        transition: filter 0.15s, transform 0.15s;
                                        z-index:5;
                                    "
                                    draggable="true"
                                    ondragstart="UI.handleDragStart(event, '${res.id}')"
                                    onclick="event.stopPropagation(); UI.openReservationModal('${res.id}')"
                                    onmouseover="this.style.filter='brightness(1.15)'; this.style.transform='scaleY(1.05)'"
                                    onmouseout="this.style.filter=''; this.style.transform=''"
                                    title="${res.lastName}, ${res.firstName} | ${Utils.formatDate(res.checkin)} → ${Utils.formatDate(res.checkout)}">
                                        <span style="font-size:0.68rem; font-weight:700; color:${col.text}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; letter-spacing:0.02em;">
                                            ${cin < rackStart ? '◀ ' : ''}${res.lastName}, ${res.firstName}
                                        </span>
                                    </div>`;
                }).join('');

                const oooBar = isOOO ? `<div style="
                                    position:absolute; left:0; top:0; width:100%; height:100%;
                                    background: repeating-linear-gradient(
                                        45deg,
                                        rgba(239,68,68,0.12),
                                        rgba(239,68,68,0.12) 6px,
                                        rgba(0,0,0,0.05) 6px,
                                        rgba(0,0,0,0.05) 12px
                                    );
                                    display:flex; align-items:center; justify-content:center;
                                    pointer-events:none; z-index:3;
                                ">
                                    <span style="font-size:0.6rem; font-weight:800; color:#ef4444; text-transform:uppercase; letter-spacing:.08em; background:rgba(0,0,0,0.4); padding:2px 8px; border-radius:4px;">OOO</span>
                                </div>` : '';

                return `
                                <div style="display:flex; border-bottom:1px solid var(--border-color); height:${ROW_H}px; position:relative;">
                                    <!-- Room label (sticky left) -->
                                    <div style="
                                        width:${LABEL_W}px; min-width:${LABEL_W}px; height:${ROW_H}px;
                                        display:flex; align-items:center; gap:8px; padding:0 0.8rem;
                                        border-right:2px solid var(--border-color);
                                        background:var(--bg-secondary);
                                        position:sticky; left:0; z-index:10;
                                        border-left: 3px solid ${catColor};
                                    ">
                                        <div style="width:8px; height:8px; border-radius:50%; background:${room.status === 'clean' ? '#22c55e' :
                        room.status === 'dirty' ? '#ef4444' :
                            room.status === 'in-progress' ? '#f59e0b' :
                                room.status === 'ooo' ? '#6b7280' : '#94a3b8'
                    }; flex-shrink:0;"></div>
                                        <div style="overflow:hidden;">
                                            <div style="font-size:0.8rem; font-weight:700; color:var(--text-primary); white-space:nowrap;">${room.name}</div>
                                            <div style="font-size:0.58rem; opacity:0.5; text-transform:uppercase; white-space:nowrap;">${group.type.name}</div>

                                        </div>
                                    </div>
                                    <!-- Timeline cells -->
                                    <div style="display:flex; position:relative; flex:1;">
                                        ${cellsHtml}
                                        ${oooBar}
                                        ${barsHtml}
                                    </div>
                                </div>`;
            }).join('');

            return rowsHtml;

        }).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    renderAvailability: () => {
        const container = document.getElementById('view-content');
        const startDate = Store.availabilityStartDate;
        const daysToShow = 14;
        const dates = Array.from({ length: daysToShow }, (_, i) => {
            const d = new Date(startDate);
            d.setDate(d.getDate() + i);
            return d;
        });

        container.innerHTML = `
            <div class="view-header">
                <div>
                    <h2>Consulta de Disponibilidad</h2>
                    <div style="display:flex; gap:0.5rem; align-items:center; margin-top:0.5rem;">
                        <button class="btn btn-secondary btn-sm" onclick="UI.moveAvailability(-7)"><ion-icon name="chevron-back"></ion-icon></button>
                        <input type="date" class="btn-secondary" style="padding: 0.4rem; border-radius: 8px;" id="avail-date-picker" 
                               value="${startDate.toISOString().split('T')[0]}" 
                               onclick="this.showPicker()"
                               onchange="UI.changeAvailabilityDate(this.value)">
                        <button class="btn btn-secondary btn-sm" onclick="UI.moveAvailability(7)"><ion-icon name="chevron-forward"></ion-icon></button>
                    </div>
                </div>
                <div class="actions">
                    <button class="btn btn-secondary" onclick="UI.renderRack()">Ver Room Rack</button>
                    <button class="btn btn-primary" onclick="UI.openReservationModal()">+ Nueva Reserva</button>
                </div>
            </div>

            <div class="glass table-container anim-fade-in" style="margin-top:1.5rem; border-radius: 20px; overflow-x: auto; border: 1px solid var(--border-color);">
                <table class="nexus-table availability-table" style="min-width: 1200px; table-layout: fixed; border-collapse: collapse;">
                    <thead>
                        <tr style="background: rgba(255,255,255,0.03);">
                            <th style="width:200px; padding: 1.2rem; text-align: left; border-right: 1px solid var(--border-color); color:var(--accent-cyan); font-weight:900; font-size:0.8rem; text-transform:uppercase; letter-spacing:0.05em;">CATEGORÍA / DÍA</th>
                            ${dates.map(d => {
            const isToday = Utils.isSameDay(d, new Date());
            return `<th style="width:80px; text-align:center; padding: 1rem 0.5rem; ${isToday ? 'background: rgba(var(--accent-cyan-rgb), 0.05);' : ''}">
                                    <div style="font-size:0.6rem; opacity:0.5; font-weight:700;">${Utils.getShortDayName(d).toUpperCase()}</div>
                                    <div style="font-size:1.1rem; font-weight:800;">${d.getDate()}</div>
                                </th>`;
        }).join('')}
                        </tr>
                        <tr style="background: rgba(0,0,0,0.18); border-bottom: 2px solid var(--border-color);">
                            <td style="padding: 0.5rem 1.2rem; border-right: 1px solid var(--border-color); font-size:0.6rem; font-weight:800; text-transform:uppercase; letter-spacing:0.06em; color:var(--text-secondary); white-space:nowrap;">
                                🏨 Total disponibles
                            </td>
                             ${dates.map(date => {
            const totalRooms = Store.rooms.filter(r => r.status !== 'ooo').length;
            const soldTotal = Store.reservations.filter(r => {
                const cin = new Date(r.checkin).getTime();
                const cout = new Date(r.checkout).getTime();
                const d = date.getTime();
                return r.status !== 'cancelada' && d >= cin && d < cout;
            }).length;
            const avail = totalRooms - soldTotal;   // ← NO clamp, show negatives
            const pct = totalRooms > 0 ? avail / totalRooms : 0;
            const isNegative = avail < 0;
            const isToday = Utils.isSameDay(date, new Date());
            const color = isNegative ? '#dc2626' : avail === 0 ? '#ef4444' : pct < 0.3 ? '#f59e0b' : '#22c55e';
            const bgColor = isNegative ? 'rgba(220,38,38,0.25)' : `${color}22`;
            const badgeSize = isNegative ? '26px' : '22px';
            const displayVal = isNegative ? `${avail}` : `${avail}`;
            const tooltip = isNegative
                ? `⚠️ SOBREVENTA: ${avail} (${Math.abs(avail)} hab. en exceso) el ${Utils.formatDate(date)}`
                : `${avail} hab. disponibles el ${Utils.formatDate(date)}`;
            return `<td style="text-align:center; padding:0.35rem 0; border-left:1px solid var(--border-color); ${isToday ? 'background:rgba(var(--accent-cyan-rgb, 0, 150, 170), 0.08);' : ''}">
                <span style="
                    display:inline-flex; align-items:center; justify-content:center;
                    width:${badgeSize}; height:${badgeSize}; border-radius:50%;
                    background:${bgColor}; border:${isNegative ? '2px' : '1.5px'} solid ${color};
                    font-size:${isNegative ? '0.6rem' : '0.65rem'}; font-weight:900; color:${color};
                    cursor:pointer; transition:transform 0.15s;
                    ${isNegative ? 'animation: pulseRed 1.2s infinite;' : ''}
                " title="${tooltip}"
                onclick="UI.openReservationModal(null,{date:'${date.toISOString()}'})"
                onmouseover="this.style.transform='scale(1.2)'"
                onmouseout="this.style.transform=''"
                >${displayVal}</span>
            </td>`;
        }).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${Store.roomTypes.map(type => {
            const totalInCat = Store.rooms.filter(r => r.typeId === type.id && r.status !== 'ooo').length;
            return `
                <tr style="border-bottom: 1px solid var(--border-color);">
                                    <td style="border-right: 1px solid var(--border-color); padding: 1rem 1.2rem; border-left: 4px solid ${type.color || 'var(--accent-cyan)'}; background: var(--bg-secondary);">
                                        <div style="font-weight:700; font-size:0.9rem; color:var(--text-primary);">${type.name}</div>
                                        <div style="font-size:0.65rem; color:var(--text-secondary); margin-top:2px;">${totalInCat} unidades</div>
                                    </td>
                                    ${dates.map(date => {
                const soldInCatCount = Store.reservations.filter(r => {
                    const cin = new Date(r.checkin).getTime();
                    const cout = new Date(r.checkout).getTime();
                    const d = date.getTime();
                    return r.status !== 'cancelada' && r.roomTypeId === type.id && d >= cin && d < cout;
                }).length;

                const oooInCat = Store.rooms.filter(r => r.typeId === type.id && r.status === 'ooo').length;
                const dailyTotal = Store.rooms.filter(r => r.typeId === type.id).length;
                const avail = dailyTotal - soldInCatCount - oooInCat;
                const percent = dailyTotal > 0 ? (avail / dailyTotal) : 0;

                let stateClass = 'state-high';
                if (avail <= 0) stateClass = 'state-none';
                else if (percent < 0.3) stateClass = 'state-low';

                return `
                                            <td class="avail-cell ${stateClass}" 
                                                onclick="UI.openReservationModal(null, { date: '${date.toISOString()}', roomTypeId: '${type.id}' })"
                                                style="text-align:center; padding: 1rem 0; cursor:pointer;">
                                                <div class="avail-num" style="font-size:1.2rem; font-weight:900; color:var(--text-primary);">${avail}</div>
                                                ${avail > 0 ? `<div class="avail-price" style="font-size:0.6rem; color:var(--text-secondary);">${Utils.formatCurrency(type.baseRate)}</div>` : ''}
                                            </td>
                                        `;
            }).join('')}
                                </tr>
                            `;
        }).join('')}
                    </tbody>
                    <tfoot style="border-top:2px solid var(--accent-cyan); background: rgba(0, 150, 170, 0.08);">
                        <tr>
                            <td style="padding: 1rem 1.2rem; border-right: 1px solid var(--border-color); border-left: 4px solid var(--accent-cyan); color:var(--accent-cyan); font-weight:900; font-size:0.72rem; text-transform:uppercase; letter-spacing:0.05em;">
                                🏨 LIBRES POR DÍA
                            </td>
                            ${dates.map(date => {
            const stats = Store.getDailyStats(date);
            const totalLibres = Math.max(0, stats.available - stats.sold);
            const isToday = Utils.isSameDay(date, new Date());
            return `
                                    <td style="text-align:center; padding: 1rem 0; border-left:1px solid var(--border-color); ${isToday ? 'background: rgba(0,150,170,0.1);' : ''}">
                                        <div style="font-size:1.5rem; color: var(--accent-cyan); font-weight:900; line-height:1;">${totalLibres}</div>
                                    </td>
                                `;
        }).join('')}
                        </tr>
                    </tfoot>
                </table>
            </div>


            
            <div class="legend" style="margin-top:2rem; display:flex; gap:1.5rem; font-size:0.8rem; opacity:0.7;">
                <div style="display:flex; align-items:center; gap:0.5rem;"><div style="width:10px; height:10px; border-radius:2px; background:rgba(16, 185, 129, 0.2); border:1px solid var(--accent-cyan);"></div> Alta Disp.</div>
                <div style="display:flex; align-items:center; gap:0.5rem;"><div style="width:10px; height:10px; border-radius:2px; background:rgba(245, 158, 11, 0.2); border:1px solid var(--accent-gold);"></div> Baja Disp.</div>
                <div style="display:flex; align-items:center; gap:0.5rem;"><div style="width:10px; height:10px; border-radius:2px; background:rgba(239, 68, 68, 0.2); border:1px solid #ef4444;"></div> Sin Disp.</div>
            </div>
        `;
    },

    moveAvailability: (days) => {
        Store.availabilityStartDate.setDate(Store.availabilityStartDate.getDate() + days);
        UI.renderAvailability();
    },

    changeAvailabilityDate: (dateStr) => {
        Store.availabilityStartDate = new Date(dateStr + 'T12:00:00');
        UI.renderAvailability();
    },

    moveRack: (days) => {
        Store.rackStartDate.setDate(Store.rackStartDate.getDate() + days);
        UI.renderRack();
    },
    resetRack: () => {
        const today = Store.getSystemDate();
        const start = new Date(today.getTime());
        start.setDate(start.getDate() - 2);
        Store.rackStartDate = start;
        UI.renderRack();
    },
    quickReserve: (roomId, date) => {
        UI.openReservationModal(null, { roomId, checkin: date });
    },

    handleDragStart: (e, resId) => {
        e.dataTransfer.setData('resId', resId);
        e.dataTransfer.effectAllowed = 'move';
        // Visual feedback: dim the dragged bar
        setTimeout(() => { if (e.target) e.target.style.opacity = '0.4'; }, 0);
        e.target.addEventListener('dragend', () => {
            e.target.style.opacity = '1';
        }, { once: true });
    },

    openUnassignedModal: () => {
        const unassigned = Store.reservations.filter(r => (!r.roomId || r.roomId === 'unassigned') && r.status !== 'cancelada');

        const html = `
            <div class="modal-content glass anim-pop" style="max-width:800px; max-height: 85vh; display: flex; flex-direction: column;">
                <div class="modal-header" style="flex-shrink: 0;">
                    <div style="display:flex; align-items:center; gap:0.8rem;">
                        <ion-icon name="list-outline" style="font-size:1.5rem; color:var(--accent-gold);"></ion-icon>
                        <h2>Reservas por Asignar</h2>
                    </div>
                    <button class="close-modal" onclick="closeSecondaryModal()">×</button>
                </div>
                
                <div style="padding: 1rem 2rem; background: rgba(var(--accent-cyan-rgb), 0.05); border-bottom: 1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center; flex-shrink: 0;">
                    <div>
                        <span style="font-size:0.8rem; opacity:0.7;">Pendientes:</span>
                        <strong style="color:var(--accent-gold); font-size:1.1rem; margin-left:0.5rem;">${unassigned.length}</strong>
                    </div>
                    <button class="btn btn-primary" onclick="UI.openAutoAssignDialog()" ${unassigned.length === 0 ? 'disabled' : ''} style="background:var(--accent-cyan); color:#000;">
                        <ion-icon name="flash-outline"></ion-icon> AUTOASIGNAR TODO
                    </button>
                </div>

                <div id="unassigned-modal-list" style="flex-grow: 1; overflow-y: auto; padding: 1.5rem; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; scrollbar-gutter: stable;">
                    ${unassigned.length === 0 ? `
                        <div style="grid-column: 1 / -1; text-align:center; padding: 4rem 1rem; opacity:0.5;">
                            <ion-icon name="checkmark-circle-outline" style="font-size:3rem; margin-bottom:1rem;"></ion-icon>
                            <p>¡No hay reservas pendientes de asignar!</p>
                        </div>
                    ` : unassigned.map(res => `
                        <div class="unassigned-item glass anim-fade-in" style="padding: 1rem; border-radius: 12px; border: 1px solid var(--border-color); cursor: pointer; transition: transform 0.2s;" onclick="UI.openReservationModal('${res.id}')">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.8rem;">
                                <strong style="font-size:0.95rem;">${res.lastName}</strong>
                                <span class="status-pill status-${res.status}" style="font-size:0.6rem;">${res.status}</span>
                            </div>
                            <div style="font-size:0.75rem; opacity:0.8; margin-bottom:0.8rem;">
                                <div style="display:flex; align-items:center; gap:0.4rem; margin-bottom:0.3rem;">
                                    <ion-icon name="calendar-outline" style="color:var(--accent-cyan)"></ion-icon>
                                    ${Utils.formatDate(res.checkin)} - ${Utils.formatDate(res.checkout)}
                                </div>
                                <div style="display:flex; align-items:center; gap:0.4rem;">
                                    <ion-icon name="bed-outline" style="color:var(--accent-gold)"></ion-icon>
                                    ${Store.getRoomType(res.roomTypeId)?.name || 'N/A'}
                                </div>
                            </div>
                            <button class="btn btn-secondary btn-sm" style="width:100%; font-size:0.65rem;" onclick="event.stopPropagation(); UI.autoAssignSingle('${res.id}')">
                                AUTOASIGNAR
                            </button>
                        </div>
                    `).join('')}
                </div>
                
                <div class="modal-footer" style="padding: 1rem 2rem; border-top: 1px solid var(--border-color); background: rgba(0,0,0,0.1); flex-shrink: 0;">
                    <button class="btn btn-secondary" onclick="closeSecondaryModal()" style="width:100%;">CERRAR</button>
                </div>
            </div>
        `;

        const modal = document.createElement('div');
        modal.id = 'secondary-modal';
        modal.className = 'modal-backdrop';
        modal.innerHTML = html;
        document.body.appendChild(modal);
    },

    autoAssignSingle: (resId) => {
        const res = Store.reservations.find(r => r.id === resId);
        if (!res) return;

        const availableRooms = Store.rooms.filter(room => {
            if (room.typeId !== res.roomTypeId) return false;
            if (room.status === 'ooo') return false;
            return Store.isRoomAvailable(room.id, res.checkin, res.checkout, res.id);
        });

        if (availableRooms.length > 0) {
            const chosenRoom = availableRooms[0];
            Store.updateReservation(resId, { roomId: chosenRoom.id });
            alert(`✅ Reserva de ${res.lastName} asignada con éxito a la Habitación ${chosenRoom.name}.`);
            closeSecondaryModal();
            UI.openUnassignedModal(); // Refresh modal
        } else {
            alert(`⚠️ No se encontraron habitaciones ${Store.getRoomType(res.roomTypeId)?.name} libres para estas fechas. Deberás asignarla manualmente o forzar una categoría.`);
        }
    },

    openAutoAssignDialog: () => {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const plus30 = new Date(today); plus30.setDate(plus30.getDate() + 30);
        const plus30Str = plus30.toISOString().split('T')[0];

        const allUnassigned = Store.reservations.filter(r => (!r.roomId || r.roomId === 'unassigned') && r.status !== 'cancelada');

        const html = `
            <div class="modal-content glass anim-pop" style="max-width:480px;">
                <div class="modal-header">
                    <div style="display:flex; align-items:center; gap:0.8rem;">
                        <ion-icon name="flash-outline" style="font-size:1.5rem; color:var(--accent-cyan);"></ion-icon>
                        <h2>Auto-Asignación de Habitaciones</h2>
                    </div>
                    <button class="close-modal" onclick="closeSecondaryModal()">×</button>
                </div>

                <div style="padding: 2rem; display:flex; flex-direction:column; gap:1.5rem;">
                    <p style="font-size:0.9rem; opacity:0.8; line-height:1.6;">
                        El sistema asignará automáticamente la mejor habitación disponible a todas las reservas sin asignar cuyo <strong>check-in</strong> caiga dentro del rango seleccionado.
                    </p>

                    <div class="form-grid" style="grid-template-columns:1fr 1fr; gap:1rem;">
                        <div class="form-group">
                            <label>Desde (Check-in)</label>
                            <input type="date" id="aa-from" value="${todayStr}" onchange="UI.refreshAutoAssignPreview()">
                        </div>
                        <div class="form-group">
                            <label>Hasta (Check-in)</label>
                            <input type="date" id="aa-to" value="${plus30Str}" onchange="UI.refreshAutoAssignPreview()">
                        </div>
                    </div>

                    <div id="aa-preview" style="padding:1rem; background:rgba(0,0,0,0.15); border-radius:12px; border:1px solid var(--border-color); font-size:0.85rem; min-height:60px;">
                        <div style="opacity:0.5; text-align:center;">Seleccioná un rango para ver la previsualización.</div>
                    </div>

                    <div style="display:flex; gap:1rem;">
                        <button class="btn btn-secondary" onclick="closeSecondaryModal()" style="flex:1;">CANCELAR</button>
                        <button class="btn btn-primary" id="aa-confirm-btn" onclick="UI.confirmAutoAssign()" style="flex:2; background:var(--accent-cyan); color:#000; font-weight:800;">
                            <ion-icon name="flash-outline"></ion-icon> CONFIRMAR Y ASIGNAR
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Close the unassigned modal first and open this one
        closeSecondaryModal();
        const modal = document.createElement('div');
        modal.id = 'secondary-modal';
        modal.className = 'modal-backdrop';
        modal.innerHTML = html;
        document.body.appendChild(modal);

        // Trigger initial preview
        setTimeout(() => UI.refreshAutoAssignPreview(), 100);
    },

    refreshAutoAssignPreview: () => {
        const fromVal = document.getElementById('aa-from')?.value;
        const toVal = document.getElementById('aa-to')?.value;
        const preview = document.getElementById('aa-preview');
        const confirmBtn = document.getElementById('aa-confirm-btn');
        if (!fromVal || !toVal || !preview) return;

        const from = new Date(fromVal + 'T00:00:00');
        const to = new Date(toVal + 'T23:59:59');

        if (from > to) {
            preview.innerHTML = `<div style="color:#ef4444; text-align:center;">⚠️ La fecha inicial debe ser anterior a la fecha final.</div>`;
            if (confirmBtn) confirmBtn.disabled = true;
            return;
        }

        const inRange = Store.reservations.filter(r => {
            if (r.roomId && r.roomId !== 'unassigned') return false;
            if (r.status === 'cancelada') return false;
            const cin = new Date(r.checkin);
            return cin >= from && cin <= to;
        });

        if (inRange.length === 0) {
            preview.innerHTML = `<div style="opacity:0.5; text-align:center;">No hay reservas sin asignar con check-in en ese rango.</div>`;
            if (confirmBtn) confirmBtn.disabled = true;
            return;
        }

        if (confirmBtn) confirmBtn.disabled = false;

        preview.innerHTML = `
            <div style="font-weight:700; color:var(--accent-cyan); margin-bottom:0.8rem;">
                ${inRange.length} reserva${inRange.length > 1 ? 's' : ''} para asignar:
            </div>
            <div style="display:flex; flex-direction:column; gap:0.4rem; max-height:160px; overflow-y:auto;">
                ${inRange.map(r => `
                    <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.8rem; padding:0.3rem 0; border-bottom:1px solid var(--border-color);">
                        <span><strong>${r.lastName}, ${r.firstName}</strong></span>
                        <span style="opacity:0.7;">${Utils.formatDate(r.checkin)} → ${Utils.formatDate(r.checkout)}</span>
                        <span style="color:var(--accent-gold); font-size:0.7rem;">${Store.getRoomType(r.roomTypeId)?.name || '?'}</span>
                    </div>
                `).join('')}
            </div>
        `;
    },

    confirmAutoAssign: () => {
        const fromVal = document.getElementById('aa-from')?.value;
        const toVal = document.getElementById('aa-to')?.value;
        if (!fromVal || !toVal) return;

        const from = new Date(fromVal + 'T00:00:00');
        const to = new Date(toVal + 'T23:59:59');

        const unassigned = Store.reservations.filter(r => {
            if (r.roomId && r.roomId !== 'unassigned') return false;
            if (r.status === 'cancelada') return false;
            const cin = new Date(r.checkin);
            return cin >= from && cin <= to;
        });

        let assignedCount = 0;
        let failedCount = 0;
        let failedDetails = [];

        unassigned.forEach(res => {
            const availableRooms = Store.rooms.filter(room => {
                if (room.typeId !== res.roomTypeId) return false;
                if (room.status === 'ooo') return false;
                return Store.isRoomAvailable(room.id, res.checkin, res.checkout, res.id);
            });

            if (availableRooms.length > 0) {
                Store.updateReservation(res.id, { roomId: availableRooms[0].id });
                assignedCount++;
            } else {
                failedCount++;
                failedDetails.push(`• ${res.lastName}, ${res.firstName} (${Store.getRoomType(res.roomTypeId)?.name})`);
            }
        });

        closeSecondaryModal();
        UI.renderRack();

        let msg = '';
        if (assignedCount > 0) msg += `✅ ${assignedCount} reserva${assignedCount > 1 ? 's asignadas' : ' asignada'} con éxito.\n`;
        if (failedCount > 0) msg += `\n⚠️ ${failedCount} no pudieron asignarse por falta de disponibilidad:\n${failedDetails.join('\n')}\n\nDeberás resolverlas manualmente.`;
        if (msg) alert(msg);
    },

    autoAssignAll: () => {
        // Legacy: now routes through the dialog
        UI.openAutoAssignDialog();
    },

    renderUnassignedList: () => {
        const list = document.getElementById('unassigned-list');
        const unassigned = Store.reservations.filter(r => (!r.roomId || r.roomId === 'unassigned') && r.status !== 'cancelada');

        if (unassigned.length === 0) {
            list.innerHTML = `<div style="text-align:center; padding:2rem; opacity:0.5;">No hay reservas pendientes.</div>`;
            return;
        }

        list.innerHTML = unassigned.map(res => `
            <div class="unassigned-item glass anim-fade-in" 
                 draggable="true" 
                 ondragstart="UI.handleDragStart(event, '${res.id}')"
                 onclick="UI.openReservationModal('${res.id}')">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <strong>${res.lastName}, ${res.firstName}</strong>
                    <span class="status-badge" data-status="${res.status}">${res.status}</span>
                </div>
                <div style="font-size:0.8rem; margin-top:0.5rem; opacity:0.8;">
                    <ion-icon name="calendar-outline"></ion-icon> ${Utils.formatDate(res.checkin)} - ${Utils.formatDate(res.checkout)}
                    <br>
                    <ion-icon name="bed-outline"></ion-icon> ${Store.getRoomType(res.roomTypeId)?.name || 'N/A'}
                </div>
            </div>
        `).join('');
    },

    handleDragOver: (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        // Visual feedback on the target cell
        if (e.currentTarget && !e.currentTarget.dataset.dragover) {
            e.currentTarget.dataset.dragover = '1';
            e.currentTarget._origBg = e.currentTarget.style.background;
            e.currentTarget.style.background = 'rgba(0, 200, 220, 0.28)';
            e.currentTarget.style.outline = '2px dashed var(--accent-cyan)';
            e.currentTarget.addEventListener('dragleave', function onLeave() {
                this.style.background = this._origBg || '';
                this.style.outline = '';
                delete this.dataset.dragover;
                this.removeEventListener('dragleave', onLeave);
            }, { once: true });
        }
    },

    handleDrop: (e, roomId, dateISO) => {
        e.preventDefault();
        e.stopPropagation();

        // Reset cell style
        if (e.currentTarget) {
            e.currentTarget.style.background = e.currentTarget._origBg || '';
            e.currentTarget.style.outline = '';
            delete e.currentTarget.dataset.dragover;
        }

        const resId = e.dataTransfer.getData('resId');   // ← typo fix: was 'resid'
        const res = Store.reservations.find(r => r.id === resId);
        if (!res) { console.warn('Drop: reserva no encontrada', resId); return; }

        const newCheckin = new Date(dateISO);
        newCheckin.setHours(12, 0, 0, 0);

        const stayMs = new Date(res.checkout) - new Date(res.checkin);
        const newCheckout = new Date(newCheckin.getTime() + stayMs);

        const nights = Math.round(stayMs / 86400000);
        const isSameRoom = roomId === res.roomId;
        const originRoom = res.roomId && res.roomId !== 'unassigned' ? `Hab. ${res.roomId}` : 'Sin asignar';

        // Check for same position (no-op)
        const sameDate = Utils.isSameDay(newCheckin, new Date(res.checkin));
        if (isSameRoom && sameDate) return;

        const msg = [
            `📋 MOVER RESERVA`,
            ``,
            `Huésped: ${res.lastName}, ${res.firstName}`,
            `De: ${originRoom} — ${Utils.formatDate(res.checkin)}`,
            `A:  Hab. ${roomId}  — ${Utils.formatDate(newCheckin)}`,
            `Duración: ${nights} noche${nights > 1 ? 's' : ''}`,
            ``,
            `¿Confirmar el cambio?`
        ].join('\n');

        if (!confirm(msg)) {
            UI.renderRack();
            return;
        }

        // Validate room type match (warn but allow)
        const targetRoom = Store.rooms.find(r => r.id === roomId);
        if (targetRoom && targetRoom.typeId !== res.roomTypeId) {
            const targetType = Store.getRoomType(targetRoom.typeId);
            const resType = Store.getRoomType(res.roomTypeId);
            if (!confirm(`⚠️ ATENCIÓN: Estás moviendo la reserva a una categoría diferente.\n\nCategoría reservada: ${resType?.name}\nCategoría destino:   ${targetType?.name}\n\n¿Continuar de todas formas?`)) {
                UI.renderRack();
                return;
            }
        }

        // Check availability
        if (!Store.isRoomAvailable(roomId, newCheckin, newCheckout, resId)) {
            alert(`🚫 La habitación ${roomId} no está disponible para esas fechas.\nVerificá que no haya otra reserva asignada o que la habitación no esté fuera de servicio.`);
            UI.renderRack();
            return;
        }

        // Persist
        Store.updateReservation(resId, {
            roomId: roomId,
            checkin: newCheckin,
            checkout: newCheckout
        });

        UI.renderRack();
    },

    // --- MODULE 3 & 8: RATES & CHANNELS ---
    renderRates: (tab = 'calendar') => {
        const container = document.getElementById('view-content');
        const startDate = Store.ratesStartDate;
        const currentPlanId = UI.activeRatePlanId || 'A';

        container.innerHTML = `
            <div class="view-header">
                <div>
                    <h2>Revenue & Tarifas</h2>
                    ${tab === 'calendar' ? `
                        <div style="display:flex; gap:1rem; align-items:center; margin-top:0.8rem;">
                            <div style="display:flex; gap:0.3rem; align-items:center; background: rgba(255,255,255,0.05); padding: 0.3rem; border-radius: 10px; border: 1px solid var(--border-color);">
                                <button class="btn btn-secondary btn-sm" onclick="UI.moveRates(-7)" style="padding: 0.3rem;"><ion-icon name="chevron-back"></ion-icon></button>
                                <input type="date" class="btn-secondary" style="background:transparent; border:none; padding: 0.4rem; border-radius: 8px; font-size: 0.85rem;" 
                                       value="${startDate.toISOString().split('T')[0]}" 
                                       onclick="this.showPicker()"
                                       onchange="UI.changeRatesDate(this.value)">
                                <button class="btn btn-secondary btn-sm" onclick="UI.moveRates(7)" style="padding: 0.3rem;"><ion-icon name="chevron-forward"></ion-icon></button>
                            </div>
                            <div style="display:flex; gap:0.5rem; align-items:center; background: rgba(var(--accent-gold-rgb), 0.1); padding: 0.3rem 0.8rem; border-radius: 10px; border: 1px solid rgba(var(--accent-gold-rgb), 0.3);">
                                <small style="font-size:0.65rem; text-transform:uppercase; color:var(--accent-gold); font-weight:700;">Vista de Plan:</small>
                                <select class="btn-secondary btn-sm" style="background:transparent; border:none; padding: 0.2rem; font-weight:600;" id="rates-plan-selector" onchange="UI.changeRatesPlan(this.value)">
                                    ${Store.ratePlans.map(p => `<option value="${p.id}" ${currentPlanId === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                    ` : ''}
                </div>
                <div class="tabs">
                    <button class="btn ${tab === 'calendar' ? 'btn-primary' : 'btn-secondary'}" onclick="UI.renderRates('calendar')">Calendario</button>
                    <button class="btn ${tab === 'plans' ? 'btn-primary' : 'btn-secondary'}" onclick="UI.renderRates('plans')">Planes de Tarifa</button>
                </div>
            </div>
            <div id="rates-content" class="anim-fade-in"></div>
        `;

        if (tab === 'calendar') {
            const endDate7 = new Date(startDate); endDate7.setDate(endDate7.getDate() + 6);
            const blockToolbar = `
            <div style="
                display:flex; flex-wrap:wrap; gap:0.8rem; align-items:flex-end;
                padding:0.9rem 1.2rem; margin-bottom:1rem;
                background:linear-gradient(135deg,rgba(0,150,170,0.08),rgba(0,0,0,0.04));
                border:1px solid var(--border-color); border-radius:14px;
            ">
                <div style="font-size:0.58rem; font-weight:800; text-transform:uppercase; color:var(--accent-cyan); letter-spacing:.08em; width:100%; margin-bottom:-2px;">
                    <ion-icon name="calendar-outline" style="vertical-align:middle; margin-right:4px;"></ion-icon>
                    Aplicar tarifa por bloque de fechas
                </div>
                <div>
                    <small style="font-size:0.6rem; opacity:0.6; display:block; margin-bottom:2px;">Categoría</small>
                    <select id="block-type" style="background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:8px; padding:0.38rem 0.6rem; font-size:0.8rem; color:var(--text-primary);">
                        <option value="__all__">— Todas —</option>
                        ${Store.roomTypes.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <small style="font-size:0.6rem; opacity:0.6; display:block; margin-bottom:2px;">Desde</small>
                    <input type="date" id="block-from" value="${startDate.toISOString().split('T')[0]}" onclick="this.showPicker()"
                        style="background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:8px; padding:0.38rem 0.6rem; font-size:0.8rem; color:var(--text-primary);">
                </div>
                <div>
                    <small style="font-size:0.6rem; opacity:0.6; display:block; margin-bottom:2px;">Hasta</small>
                    <input type="date" id="block-to" value="${endDate7.toISOString().split('T')[0]}" onclick="this.showPicker()"
                        style="background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:8px; padding:0.38rem 0.6rem; font-size:0.8rem; color:var(--text-primary);">
                </div>
                <div>
                    <small style="font-size:0.6rem; opacity:0.6; display:block; margin-bottom:2px;">Precio</small>
                    <input type="number" id="block-price" placeholder="150" step="5" min="0"
                        style="width:85px; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:8px; padding:0.38rem 0.6rem; font-size:0.8rem; color:var(--text-primary);">
                </div>
                <button onclick="UI.applyBlockRate()" style="
                    background:var(--accent-cyan); color:#000; border:none; border-radius:10px;
                    padding:0.48rem 1.1rem; font-size:0.75rem; font-weight:900; cursor:pointer;
                    text-transform:uppercase; letter-spacing:.06em; white-space:nowrap; align-self:flex-end;
                ">APLICAR →</button>
                <button onclick="UI.clearBlockRate()" style="
                    background:transparent; color:var(--text-secondary); border:1px solid var(--border-color);
                    border-radius:10px; padding:0.48rem 0.8rem; font-size:0.72rem; cursor:pointer;
                    white-space:nowrap; align-self:flex-end;
                " title="Limpiar overrides del rango">✕ Limpiar rango</button>
            </div>`;

            document.getElementById('rates-content').innerHTML = blockToolbar + `
                <div class="glass table-container">
                    <table class="nexus-table">
                        <thead>
                            <tr>
                                <th>Categoría</th>
                                <th>Base Rate</th>
                                ${Array.from({ length: 7 }, (_, i) => {
                const d = new Date(startDate); d.setDate(startDate.getDate() + i);
                const isToday = Utils.isSameDay(d, new Date());
                return `<th style="text-align:center; ${isToday ? 'background:rgba(var(--accent-cyan-rgb),0.1);' : ''}">${Utils.formatDate(d)}</th>`;
            }).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${Store.roomTypes.map(t => `
                                <tr>
                                    <td><strong>${t.name}</strong></td>
                                    <td style="text-align:center;">
                                        <div style="display:flex; align-items:center; justify-content:center; gap:0.4rem;">
                                            <span style="font-size:0.8rem; opacity:0.5">$</span>
                                            <input type="number" value="${t.baseRate}" class="rate-input"
                                                style="width:70px; text-align:center; background:rgba(0,0,0,0.2); border:1px solid var(--border-color); border-radius:6px; color:var(--accent-cyan); font-weight:700;"
                                                onchange="Store.updateRoomTypeRate('${t.id}', this.value); UI.renderRates('calendar');">
                                        </div>
                                    </td>
                                    ${Array.from({ length: 7 }, (_, i) => {
                const d = new Date(startDate); d.setDate(startDate.getDate() + i);
                const dateStr = d.toISOString().split('T')[0];
                const isToday = Utils.isSameDay(d, new Date());
                const override = Store.ratesCalendar[dateStr]?.[t.id]?.base;
                const price = override || t.baseRate;
                const totalRooms = Store.rooms.filter(r => r.typeId === t.id && r.status !== 'ooo').length;
                const dMid = new Date(dateStr + 'T12:00:00').getTime();
                const sold = Store.reservations.filter(r => {
                    if (r.status === 'cancelada' || r.roomTypeId !== t.id) return false;
                    return dMid >= new Date(r.checkin).setHours(0, 0, 0, 0) && dMid < new Date(r.checkout).setHours(0, 0, 0, 0);
                }).length;
                const avail = totalRooms - sold;
                const aColor = avail <= 0 ? '#ef4444' : avail <= 1 ? '#f59e0b' : '#22c55e';
                return `<td style="${isToday ? 'background:rgba(0,200,220,0.04);' : ''}">
                    <div style="display:flex; flex-direction:column; align-items:center; gap:3px;">
                        <input type="number"
                               value="${price}" step="5" class="rate-input"
                               style="width:70px; text-align:center; border-radius:8px; background:rgba(0,0,0,0.2); font-weight:700;
                                      ${override ? 'border-color:var(--accent-gold); color:var(--accent-gold);' : 'border-color:var(--border-color); color:var(--accent-cyan);'}"
                               onchange="Store.updateDailyRate('${dateStr}','${t.id}',this.value); UI.renderRates('calendar');">
                        <span style="font-size:0.52rem; font-weight:700; color:${aColor}; letter-spacing:.02em;"
                              title="${avail} lib. de ${totalRooms} para ${t.name} el ${dateStr}">
                            ${avail < 0 ? '⚠ ' : ''}${avail}/${totalRooms} lib.
                        </span>
                    </div>
                </td>`;
            }).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            document.getElementById('rates-content').innerHTML = `
                <div class="plans-grid">
                    ${Store.ratePlans.map(p => `
                        <div class="plan-card glass">
                            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                                <h3>${p.name}</h3>
                                <div style="display:flex; gap:0.5rem;">
                                    <button class="btn-icon" title="Editar" onclick="UI.openRatePlanModal('${p.id}')"><ion-icon name="create-outline"></ion-icon></button>
                                    <button class="btn-icon text-danger" title="Eliminar" onclick="if(confirm('¿Borrar plan?')) Store.deleteRatePlan('${p.id}')"><ion-icon name="trash-outline"></ion-icon></button>
                                </div>
                            </div>
                            <div class="plan-tag">${Math.round(p.multiplier * 100)}%</div>
                            <p style="margin-top:0.8rem; font-size:0.85rem; opacity:0.8;">Política: ${p.cancelPolicy}</p>
                            <ul style="margin-top:1rem; font-size:0.85rem;">
                                <li>Min: ${p.minNights} noches</li>
                                <li>Refundable: ${p.refundable ? '✅' : '❌'}</li>
                                <li>Desayuno: ${p.breakfast ? '✅' : '❌'}</li>
                                ${(p.conditions || []).map(c => `<li style="list-style-type: '• '; margin-left:1.2rem; color:var(--accent-cyan); font-weight:600;">${c}</li>`).join('')}
                            </ul>
                        </div>
                    `).join('')}
                    <div class="plan-card glass flex-center" style="border:2px dashed var(--border-color); cursor:pointer;" onclick="UI.openRatePlanModal()">
                        <div style="text-align:center;">
                            <ion-icon name="add-circle-outline" style="font-size:2.5rem; opacity:0.5;"></ion-icon>
                            <div style="font-weight:700; margin-top:0.5rem;">Nuevo Plan</div>
                        </div>
                    </div>
                </div>
            `;
        }
    },

    // --- MODULE 6 & 7: HOUSEKEEPING & OPERATION ---
    activeRatePlanId: 'A',
    changeRatesPlan: (planId) => {
        UI.activeRatePlanId = planId;
        UI.renderRates('calendar');
    },

    moveRates: (days) => {
        Store.ratesStartDate.setDate(Store.ratesStartDate.getDate() + days);
        UI.renderRates('calendar');
    },

    changeRatesDate: (dateStr) => {
        Store.ratesStartDate = new Date(dateStr + 'T12:00:00');
        UI.renderRates('calendar');
    },

    // --- Rates Logic ---
    applyBlockRate: () => {
        const typeId = document.getElementById('block-type').value;
        const fromDate = document.getElementById('block-from').value;
        const toDate = document.getElementById('block-to').value;
        const price = parseFloat(document.getElementById('block-price').value);

        if (isNaN(price) || !fromDate || !toDate) {
            alert('Por favor completa las fechas y el precio.');
            return;
        }

        const start = new Date(fromDate + 'T12:00:00');
        const end = new Date(toDate + 'T12:00:00');

        if (end < start) {
            alert('La fecha "Hasta" debe ser mayor o igual a "Desde".');
            return;
        }

        const typesToApply = typeId === '__all__' ? Store.roomTypes.map(t => t.id) : [typeId];

        // Iterate through each day in the range
        let current = new Date(start);
        while (current <= end) {
            const dateStr = current.toISOString().split('T')[0];
            typesToApply.forEach(tid => {
                Store.updateDailyRate(dateStr, tid, price);
            });
            current.setDate(current.getDate() + 1);
        }

        UI.renderRates('calendar');
        Utils.showMessage(`Tarifa de ${Utils.formatCurrency(price)} aplicada correctamente.`, 'success');
    },

    clearBlockRate: () => {
        const typeId = document.getElementById('block-type').value;
        const fromDate = document.getElementById('block-from').value;
        const toDate = document.getElementById('block-to').value;

        if (!fromDate || !toDate) return;
        if (!confirm('¿Estás seguro de borrar los precios especiales en este rango? Se volverá a la tarifa base.')) return;

        const start = new Date(fromDate + 'T12:00:00');
        const end = new Date(toDate + 'T12:00:00');

        let current = new Date(start);
        while (current <= end) {
            const dateStr = current.toISOString().split('T')[0];
            if (Store.ratesCalendar[dateStr]) {
                if (typeId === '__all__') {
                    delete Store.ratesCalendar[dateStr];
                } else {
                    delete Store.ratesCalendar[dateStr][typeId];
                    if (Object.keys(Store.ratesCalendar[dateStr]).length === 0) {
                        delete Store.ratesCalendar[dateStr];
                    }
                }
            }
            current.setDate(current.getDate() + 1);
        }

        UI.renderRates('calendar');
        Utils.showMessage('Rango de tarifas restablecido.', 'info');
    },

    openRatePlanModal: (planId = null) => {
        const plan = planId ? Store.ratePlans.find(p => p.id === planId) : null;
        const isNew = !plan;

        const html = `
            <div class="modal-content glass anim-pop" style="max-width:520px;">
                <div class="modal-header">
                    <div style="display:flex; align-items:center; gap:0.8rem;">
                        <ion-icon name="pricetag-outline" style="font-size:1.5rem; color:var(--accent-gold);"></ion-icon>
                        <h2>${isNew ? 'Nuevo Plan Tarifario' : 'Editar Plan: ' + plan.name}</h2>
                    </div>
                    <button class="close-modal" onclick="closeSecondaryModal()">×</button>
                </div>

                <div style="padding: 2rem; display:flex; flex-direction:column; gap:1.2rem;">
                    <div class="form-grid" style="grid-template-columns:1fr 1fr; gap:1rem;">
                        <div class="form-group" style="grid-column: span 2;">
                            <label>Nombre del Plan</label>
                            <input type="text" id="rp-name" value="${plan?.name || ''}" placeholder="Ej: No Reembolsable" required>
                        </div>

                        <div class="form-group">
                            <label>Descuento sobre tarifa base (%)</label>
                            <div style="display:flex; align-items:center; gap:0.5rem;">
                                <input type="number" id="rp-multiplier" value="${plan ? Math.round(plan.multiplier * 100) : 100}" min="1" max="200" step="1" style="text-align:center;">
                                <span style="font-size:0.8rem; opacity:0.6;">%</span>
                            </div>
                            <small style="font-size:0.65rem; opacity:0.6; margin-top:0.3rem; display:block;">100% = sin descuento. 85% = 15% de descuento.</small>
                        </div>

                        <div class="form-group">
                            <label>Política de Cancelación</label>
                            <select id="rp-cancelPolicy">
                                <option value="24h" ${plan?.cancelPolicy === '24h' ? 'selected' : ''}>24 horas</option>
                                <option value="48h" ${plan?.cancelPolicy === '48h' ? 'selected' : ''}>48 horas</option>
                                <option value="7d" ${plan?.cancelPolicy === '7d' ? 'selected' : ''}>7 días</option>
                                <option value="30d" ${plan?.cancelPolicy === '30d' ? 'selected' : ''}>30 días</option>
                                <option value="NR" ${plan?.cancelPolicy === 'NR' ? 'selected' : ''}>No Reembolsable</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label>Noches Mínimas</label>
                            <input type="number" id="rp-minNights" value="${plan?.minNights || 1}" min="1" max="30" step="1">
                        </div>

                        <div class="form-group" style="display:flex; flex-direction:column; justify-content:center;">
                            <div style="display:flex; align-items:center; gap:0.8rem; padding: 1rem; background: rgba(0,0,0,0.05); border-radius:12px; border: 1px solid var(--border-color);">
                                <input type="checkbox" id="rp-refundable" ${plan?.refundable !== false ? 'checked' : ''} style="width:18px; height:18px; cursor:pointer;">
                                <label for="rp-refundable" style="margin:0; cursor:pointer; font-size:0.9rem;">✅ Reembolsable</label>
                            </div>
                        </div>

                        <div id="best-rate-advisor" style="display:none; grid-column: span 2; align-items:center; gap:1rem; padding: 0.9rem 1.2rem; background: rgba(0, 150, 170, 0.08); border: 1px solid rgba(0,150,170,0.3); border-radius: 12px; margin-top:0.5rem; border-left: 4px solid var(--accent-cyan);"></div>

                        <div class="form-group" style="display:flex; flex-direction:column; justify-content:center;">
                            <div style="display:flex; align-items:center; gap:0.8rem; padding: 1rem; background: rgba(0,0,0,0.05); border-radius:12px; border: 1px solid var(--border-color);">
                                <input type="checkbox" id="rp-breakfast" ${plan?.breakfast !== false ? 'checked' : ''} style="width:18px; height:18px; cursor:pointer;">
                                <label for="rp-breakfast" style="margin:0; cursor:pointer; font-size:0.9rem;">🍳 Desayuno Incluido</label>
                            </div>
                        </div>
                    </div>

                    <div style="display:flex; gap:1rem; margin-top:0.5rem;">
                        <button class="btn btn-secondary" onclick="closeSecondaryModal()" style="flex:1;">CANCELAR</button>
                        <button class="btn btn-primary" onclick="UI.saveRatePlan('${planId || ''}')" style="flex:2; background: linear-gradient(135deg, var(--accent-gold), #f59e0b); color:#000; font-weight:700;">
                            <ion-icon name="save-outline"></ion-icon> ${isNew ? 'CREAR PLAN' : 'GUARDAR CAMBIOS'}
                        </button>
                    </div>
                </div>
            </div>
        `;

        const modal = document.createElement('div');
        modal.id = 'secondary-modal';
        modal.className = 'modal-backdrop';
        modal.innerHTML = html;
        document.body.appendChild(modal);
    },

    saveRatePlan: (planId) => {
        const name = document.getElementById('rp-name').value.trim();
        if (!name) { alert('Ingresá un nombre para el plan.'); return; }

        const multiplier = parseFloat(document.getElementById('rp-multiplier').value) / 100;
        const updates = {
            name,
            multiplier,
            cancelPolicy: document.getElementById('rp-cancelPolicy').value,
            minNights: parseInt(document.getElementById('rp-minNights').value) || 1,
            refundable: document.getElementById('rp-refundable').checked,
            breakfast: document.getElementById('rp-breakfast').checked,
        };

        if (planId) {
            Store.updateRatePlan(planId, updates);
        } else {
            const newPlan = {
                id: 'rp-' + Utils.generateId().slice(0, 6),
                ...updates
            };
            Store.ratePlans.push(newPlan);
            Store.notify();
        }

        closeSecondaryModal();
        UI.renderRates('plans');
    },

    renderHousekeeping: () => {
        const container = document.getElementById('view-content');
        container.innerHTML = `
            <div class="view-header">
                <h2>Housekeeping & Maintenance</h2>
                <button class="btn btn-secondary" onclick="UI.renderHousekeepingDetailedReport()"><ion-icon name="document-text-outline"></ion-icon> Ver Reporte de Armado</button>
                <button class="btn btn-primary" onclick="UI.openTaskModal()">+ Nueva Tarea</button>
            </div>
            <div id="hk-dynamic-content">
                <div class="hk-grid">
                    <div class="glass stats-panel">
                        <h3>Estado de Unidades</h3>
                        <div class="hk-stats">
                            <div class="stat"><span>Limpia</span> <strong>${Store.rooms.filter(r => r.status === 'clean').length}</strong></div>
                            <div class="stat"><span>Sucia</span> <strong>${Store.rooms.filter(r => r.status === 'dirty').length}</strong></div>
                            <div class="stat"><span>En Progreso</span> <strong>${Store.rooms.filter(r => r.status === 'in-progress').length}</strong></div>
                            <div class="stat"><span>Fuera de Servicio</span> <strong>${Store.rooms.filter(r => r.status === 'ooo').length}</strong></div>
                        </div>
                    </div>
                    <div class="glass table-container">
                        <table class="nexus-table">
                            <thead>
                                <tr><th>Habitación</th><th>Tipo</th><th>Estado</th><th>Acciones</th></tr>
                            </thead>
                            <tbody>
                                ${Store.rooms.map(r => `
                                            <tr>
                                                <td><strong>${r.name}</strong></td>
                                                <td>${r.typeId.toUpperCase()}</td>
                                                <td><span class="status-pill status-${r.status}">${r.status.toUpperCase()}</span></td>
                                                <td>
                                                    <select onchange="Store.updateRoomStatus('${r.id}', this.value)" class="btn-secondary">
                                                        <option value="clean" ${r.status === 'clean' ? 'selected' : ''}>Limpia</option>
                                                        <option value="dirty" ${r.status === 'dirty' ? 'selected' : ''}>Sucia</option>
                                                        <option value="in-progress" ${r.status === 'in-progress' ? 'selected' : ''}>En Progreso</option>
                                                        <option value="ooo" ${r.status === 'ooo' ? 'selected' : ''}>OOO</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    renderHousekeepingDetailedReport: () => {
        const content = document.getElementById('hk-dynamic-content');
        const today = new Date();

        const resForToday = Store.reservations.filter(r => {
            const start = new Date(r.checkin);
            const end = new Date(r.checkout);
            return (Utils.isSameDay(start, today) || (today > start && today < end)) && r.status !== 'cancelada';
        });

        content.innerHTML = `
            <div class="glass anim-fade-in" style="padding:2rem;">
                <div class="actions" style="display:flex; gap:0.5rem; align-items:center;">
                    <button class="btn btn-secondary btn-sm" onclick="window.print()"><ion-icon name="print-outline"></ion-icon> Imprimir</button>
                    <button class="btn btn-wa btn-sm" id="btn-share-hk"><ion-icon name="logo-whatsapp"></ion-icon> Enviar</button>
                    <button class="btn btn-secondary btn-sm" onclick="UI.renderHousekeeping()">Volver al Listado</button>
                </div>
            </div>
            <div class="table-container anim-fade-in" id="printable-hk-report">
                <table class="nexus-table">
                    <thead>
                        <tr><th>Habitación</th><th>Huésped</th><th>Estado</th><th>Armado</th><th>Cuna/Bebé</th><th>Pax</th></tr>
                    </thead>
                    <tbody>
                        ${resForToday.map(r => `
                            <tr>
                                <td><strong>${r.roomId === 'unassigned' ? '<span style="color:var(--accent-gold);">(!) Pendiente</span>' : `H.${r.roomId}`}</strong></td>
                                <td>${r.lastName}, ${r.firstName}</td>
                                <td><span class="status-pill status-${r.status}">${r.status.toUpperCase()}</span></td>
                                <td><span class="price-pill" style="background:var(--accent-cyan); color:#000; border:none; padding:4px 10px; font-size:0.75rem;">${r.bedType === 'mat' ? 'MATRIMONIAL' : 'TWIN (2 INDIV)'}</span></td>
                                <td>${r.babyCount > 0 ? `<strong>SI (${r.babyCount})</strong> ✅` : '<span style="opacity:0.4">No</span>'}</td>
                                <td><strong>${r.paxCount}</strong></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div style="margin-top:2rem; font-size:0.8rem; opacity:0.6;">
                * Este reporte muestra configuraciones para ingresos del día y huéspedes en casa. Reporte generado: ${Utils.formatDateTime(new Date())}
            </div>
        `;

        document.getElementById('btn-share-hk').onclick = () => {
            let text = `📋 *REPORTE DE ARMADO NEXUS - ${Utils.formatDate(new Date())}*\n\n`;
            resForToday.forEach(r => {
                const room = r.roomId === 'unassigned' ? '(!) PENDIENTE' : `HAB ${r.roomId}`;
                text += `• *${room}:* ${r.lastName} (${r.paxCount} pax) - _${r.bedType === 'mat' ? 'MATRIMONIAL' : 'TWIN'}_ ${r.babyCount > 0 ? '[CON CUNA]' : ''}\n`;
            });
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        };
    },

    openTaskModal: () => {
        const html = `
            <div class="modal-content glass anim-pop" style="max-width:450px;">
                <div class="modal-header">
                    <h2>Nueva Tarea / Orden</h2>
                    <button class="close-modal" onclick="closeSecondaryModal()">×</button>
                </div>
                <form onsubmit="UI.saveTask(event)">
                    <div class="form-group">
                        <label>Sector / Habitación</label>
                        <select id="task-room" required>
                            <option value="General">Áreas Comunes</option>
                            ${Store.rooms.map(r => `<option value="${r.name}">Habitación ${r.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Tipo</label>
                        <select id="task-type">
                            <option value="Mantenimiento">🛠️ Mantenimiento</option>
                            <option value="Limpieza">🧹 Limpieza Extra</option>
                            <option value="Insumos">📦 Reposición Insumos</option>
                            <option value="Otro">📝 Otro</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Descripción del Problema/Tarea</label>
                        <textarea id="task-desc" required placeholder="Ej: Falla luz baño, falta toallas, etc." style="min-height:100px;"></textarea>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="closeSecondaryModal()">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Crear Tarea</button>
                    </div>
                </form>
            </div>
        `;
        const modal = document.createElement('div');
        modal.id = 'secondary-modal';
        modal.className = 'modal-backdrop';
        modal.innerHTML = html;
        document.body.appendChild(modal);
    },

    saveTask: (e) => {
        e.preventDefault();
        const task = {
            room: document.getElementById('task-room').value,
            type: document.getElementById('task-type').value,
            description: document.getElementById('task-desc').value,
            assignedTo: 'Sin asignar',
            priority: 'medium'
        };
        Store.addTask(task);
        alert('✅ Tarea registrada correctamente.');
        closeSecondaryModal();
        UI.renderHousekeeping();
    },

    // --- MODULE 9: INTELLIGENCE & REPORTS ---
    renderIntelligence: () => {
        const container = document.getElementById('view-content');
        container.innerHTML = `
            <div class="view-header">
                <h2>Intelligence Hub</h2>
            </div>
            <div class="reports-grid">
                <div class="glass report-card">
                    <h3>Ocupación Mensual</h3>
                    <div class="dummy-chart"><div class="line"></div></div>
                    <div class="stat-row"><span>Actual:</span> <strong>74%</strong></div>
                    <div class="stat-row"><span>Forecast:</span> <strong>82%</strong></div>
                </div>
                <div class="glass report-card">
                    <h3>ADR & RevPAR</h3>
                    <div class="stat-big">${Utils.formatCurrency(124)} <small>ADR</small></div>
                    <div class="stat-big">${Utils.formatCurrency(92)} <small>RevPAR</small></div>
                </div>
                <div class="glass report-card">
                    <h3>Canales de Origen</h3>
                    <div class="channel-list">
                        <div class="channel-item"><span>Directo</span> <strong>45%</strong></div>
                        <div class="channel-item"><span>Booking.com</span> <strong>30%</strong></div>
                        <div class="channel-item"><span>WhatsApp</span> <strong>25%</strong></div>
                    </div>
                </div>
            </div>
            <div class="glass table-container" style="margin-top:2rem">
                <h3>Últimos Movimientos de Auditoría</h3>
                <table class="nexus-table">
                    <thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Entidad</th></tr></thead>
                    <tbody>
                        ${Store.auditLog.slice(-10).reverse().map(a => `
                            <tr>
                                <td>${Utils.formatDateTime(a.timestamp)}</td>
                                <td>${a.user}</td>
                                <td><strong>${a.action}</strong></td>
                                <td>${a.entityType} (${a.entityId})</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
`;
    },

    // --- MODULE 1 & 4 & 5: RESERVATION MODAL ---
    // --- Reusable promo hero banner ---
    buildRateAdvisorHtml: (typeId, currentPlanId, checkin, checkout, applyCallback) => {
        if (!typeId || !checkin || !checkout) return '';
        const nights = Math.max(1, Math.ceil((new Date(checkout) - new Date(checkin)) / 86400000));
        const eligible = Store.ratePlans
            .filter(p => nights >= (p.minNights || 1))
            .map(p => ({ ...p, total: Utils.calculatePrice(typeId, p.id, checkin, checkout).total }))
            .sort((a, b) => a.total - b.total);
        if (!eligible.length) return '';
        const best = eligible[0];
        const current = Utils.calculatePrice(typeId, currentPlanId, checkin, checkout).total;
        if (best.id === currentPlanId || best.total >= current) return '';
        const saving = current - best.total;

        // Policy tags
        const policies = [];
        if (best.code || best.id) policies.push(`<span style="font-size:0.6rem; background:rgba(255,255,255,0.07); border-radius:4px; padding:2px 6px;">🏷 ${best.id}</span>`);
        if (best.refundable === false) policies.push(`<span style="font-size:0.6rem; background:rgba(255,255,255,0.07); border-radius:4px; padding:2px 6px;">❌ No reembolsable</span>`);
        if (best.includesBreakfast) policies.push(`<span style="font-size:0.6rem; background:rgba(255,255,255,0.07); border-radius:4px; padding:2px 6px;">☕ Desayuno incl.</span>`);
        const policyRow = policies.length ? `<div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:6px; opacity:0.75;">Política: ${policies.join(' ')}</div>` : '';

        return `
        <div style="
            display:flex; align-items:center; gap:1rem;
            padding:0.9rem 1.2rem;
            background:linear-gradient(135deg, rgba(0,150,170,0.12), rgba(0,200,180,0.06));
            border:1px solid rgba(0,200,200,0.35);
            border-left:4px solid var(--accent-cyan);
            border-radius:14px;
            margin-bottom:1.2rem;
        ">
            <div style="flex-shrink:0; width:36px; height:36px; background:rgba(0,200,200,0.15); border-radius:50%; display:flex; align-items:center; justify-content:center;">
                <ion-icon name="bulb-outline" style="font-size:1.2rem; color:var(--accent-cyan);"></ion-icon>
            </div>
            <div style="flex:1; min-width:0;">
                <div style="font-size:0.6rem; font-weight:900; color:var(--accent-cyan); text-transform:uppercase; letter-spacing:.08em; margin-bottom:3px;">MEJOR TARIFA DISPONIBLE</div>
                <div style="font-size:0.9rem; font-weight:700; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                    ${best.name} &mdash; ${Utils.formatCurrency(best.total)}
                    <span style="color:#22c55e; font-size:0.8rem; margin-left:8px;">✓ Ahorrás ${Utils.formatCurrency(saving)}</span>
                </div>
                ${policyRow}
            </div>
            <button type="button" onclick="${applyCallback}" style="
                flex-shrink:0;
                background:var(--accent-cyan); color:#000;
                border:none; border-radius:10px; padding:0.55rem 1.2rem;
                font-size:0.75rem; font-weight:900; cursor:pointer;
                text-transform:uppercase; letter-spacing:.06em;
                white-space:nowrap;
            ">APLICAR →</button>
        </div>`;
    },

    openReservationModal: (resId = null, partial = {}) => {
        const modal = document.getElementById('reservation-modal');
        const form = document.getElementById('reservation-form');
        const title = document.getElementById('modal-title');

        modal.classList.remove('hidden');
        _modalHasChanges = false; // reset dirty flag on every open
        const res = resId ? Store.reservations.find(r => r.id === resId) : (() => {
            // Resolve checkin: accept partial.checkin OR partial.date
            const rawCheckin = partial.checkin || partial.date || new Date();
            const checkinDate = new Date(rawCheckin);
            checkinDate.setHours(12, 0, 0, 0);
            const checkoutDate = new Date(checkinDate.getTime() + 86400000);

            // If roomId provided, auto-detect the room type
            let roomTypeId = partial.roomTypeId || Store.roomTypes[0].id;
            if (partial.roomId && partial.roomId !== 'unassigned') {
                const foundRoom = Store.rooms.find(r => r.id === partial.roomId);
                if (foundRoom) roomTypeId = foundRoom.typeId;
            }

            return {
                firstName: '', lastName: '',
                checkin: checkinDate,
                checkout: checkoutDate,
                roomTypeId,
                roomId: partial.roomId || 'unassigned',
                paxCount: 2, bedType: 'mat', status: 'tentativa', total: 0,
                ratePlanId: 'A'
            };
        })();

        title.textContent = resId ? `Reserva #${resId}` : 'Nueva Reserva';
        form.classList.remove('edit-mode');

        if (resId) {
            const type = Store.getRoomType(res.roomTypeId);
            form.innerHTML = `
                <div style="padding: 2rem;">
                    <div class="modal-main-content">
                        ${(() => {
                    const g = res.guestId ? Store.guests.find(x => x.id === res.guestId) : null;
                    const flagsHtml = g?.flags?.length ? g.flags.map(f =>
                        `<span style="background:rgba(212,175,55,0.15);color:var(--accent-gold);border:1px solid rgba(212,175,55,0.3);border-radius:50px;font-size:0.6rem;padding:0.1rem 0.5rem;font-weight:700;">${f}</span>`
                    ).join('') : '';
                    const prevStays = g ? Store.getGuestReservations(g.id).filter(r => r.id !== resId && r.status !== 'cancelada').length : 0;
                    return `
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:${g ? '1rem' : '2rem'};">
                            <div>
                                <h2 style="font-size:2rem; margin-bottom:0.4rem; color:var(--text-primary); display:flex; align-items:center; gap:0.8rem;">
                                    ${res.firstName} ${res.lastName}
                                    ${prevStays > 0 ? `<span title="Huésped frecuente" style="font-size:0.75rem;background:rgba(212,175,55,0.15);color:var(--accent-gold);border:1px solid rgba(212,175,55,0.25);border-radius:50px;padding:0.2rem 0.7rem;font-weight:700;">★ ${prevStays} estadía${prevStays > 1 ? 's' : ''} previa${prevStays > 1 ? 's' : ''}</span>` : ''}
                                </h2>
                                <div style="display:flex; gap:1rem; flex-wrap:wrap; opacity:0.75; font-size:0.9rem; margin-bottom:${g ? '0.6rem' : '0'};">
                                    <span><ion-icon name="mail-outline"></ion-icon> ${res.email || g?.email || 'Sin email'}</span>
                                    <span><ion-icon name="logo-whatsapp"></ion-icon> ${res.phone || g?.phone || 'Sin teléfono'}</span>
                                    ${g?.docNumber ? `<span><ion-icon name="card-outline"></ion-icon> ${g.docType || 'DNI'} ${g.docNumber}</span>` : ''}
                                    ${g?.nationality ? `<span><ion-icon name="earth-outline"></ion-icon> ${g.nationality}</span>` : ''}
                                </div>
                                ${flagsHtml ? `<div style="display:flex;gap:0.4rem;flex-wrap:wrap;">${flagsHtml}</div>` : ''}
                                ${!g
                            ? `<button type="button" onclick="UI.openGuestProfileModal(null,'${resId}')" style="margin-top:0.6rem;background:transparent;border:1px dashed rgba(212,175,55,0.4);color:var(--accent-gold);border-radius:8px;padding:0.25rem 0.8rem;font-size:0.7rem;cursor:pointer;display:inline-flex;align-items:center;gap:0.3rem;"><ion-icon name="person-add-outline"></ion-icon> vincular perfil de huésped</button>`
                            : `<button type="button" onclick="UI.openGuestProfileModal('${g.id}','${resId}')" style="margin-top:0.5rem;background:transparent;border:none;color:rgba(255,255,255,0.3);font-size:0.68rem;cursor:pointer;display:inline-flex;align-items:center;gap:0.3rem;"><ion-icon name="person-outline"></ion-icon> ver/editar perfil completo</button>`}
                            </div>
                            <div class="status-badge status-${res.status}" style="font-size:1rem; padding: 0.5rem 1.2rem;">${res.status.toUpperCase()}</div>
                        </div>`;
                })()}

                        <div id="best-rate-advisor" style="display:none; grid-column: span 2; align-items:center; gap:1rem; padding: 0.9rem 1.2rem; background: rgba(0, 150, 170, 0.08); border: 1px solid rgba(0,150,170,0.3); border-radius: 12px; margin-top:0.5rem; border-left: 4px solid var(--accent-cyan);"></div>

                        <!-- PROMO HERO BANNER (static, view mode) -->
                        ${(() => {
                    const nights = Utils.calculateStay(res.checkin, res.checkout);
                    return UI.buildRateAdvisorHtml(
                        res.roomTypeId, res.ratePlanId,
                        new Date(res.checkin), new Date(res.checkout),
                        `UI.switchToEditMode('${resId}')`
                    );
                })()}

                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:2rem; margin-bottom:2rem;">
                            <div class="glass" style="padding:1.5rem; border-left: 4px solid var(--accent-cyan)">
                                <div style="font-size:0.75rem; text-transform:uppercase; opacity:0.6; margin-bottom:0.5rem">Estadía</div>
                                <div style="font-size:1.1rem; font-weight:700">
                                    ${Utils.formatDate(res.checkin)} <ion-icon name="arrow-forward-outline"></ion-icon> ${Utils.formatDate(res.checkout)}
                                </div>
                                <div style="margin-top:0.4rem; font-size:0.85rem; opacity:0.8">
                                    ${Utils.calculateStay(res.checkin, res.checkout)} noches
                                </div>
                            </div>
                            <div class="glass" style="padding:1.5rem; border-left: 4px solid var(--accent-gold)">
                                <div style="font-size:0.75rem; text-transform:uppercase; opacity:0.6; margin-bottom:0.5rem">Alojamiento</div>
                                <div style="font-size:1.1rem; font-weight:700">
                                    ${res.roomId && res.roomId !== 'unassigned' ? `Hab. ${res.roomId}` : 'Sin Asignar'}
                                </div>
                                <div style="margin-top:0.4rem; font-size:0.85rem; opacity:0.8">
                                    ${type ? type.name : 'Cargando...'}
                                </div>
                            </div>
                        </div>

                        <div id="best-rate-advisor" style="display:none; grid-column: span 2; align-items:center; gap:1rem; padding: 0.9rem 1.2rem; background: rgba(0, 150, 170, 0.08); border: 1px solid rgba(0,150,170,0.3); border-radius: 12px; margin-top:0.5rem; border-left: 4px solid var(--accent-cyan);"></div>

                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:2rem;">
                            <div class="glass" style="padding:1.5rem">
                                <h3 style="margin-bottom:1rem; font-size:1rem">Detalle de Cargos</h3>
                                <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem; font-size:0.9rem; opacity:0.8;">
                                    <span>Base (${Utils.calculateStay(res.checkin, res.checkout)} noches)</span>
                                    <span>${Utils.formatCurrency(res.manualRateEnabled ? res.manualRate : (res.total / (1 - (res.discountPercent || 0) / 100) + (res.discountFixed || 0)))}</span>
                                </div>
                                ${res.discountPercent > 0 || res.discountFixed > 0 ? `
                                    <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem; color:var(--accent-gold); font-size:0.85rem;">
                                        <span>Descuento Aplicado</span>
                                        <span>- ${res.discountPercent > 0 ? `${res.discountPercent}%` : ''} ${res.discountFixed > 0 ? Utils.formatCurrency(res.discountFixed) : ''}</span>
                                    </div>
                                ` : ''}
                                ${res.manualRateEnabled ? `
                                    <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem; color:var(--accent-gold); font-size:0.85rem;">
                                        <span>Ajuste Manual</span>
                                        <span>ACTIVO</span>
                                    </div>
                                ` : ''}
                                <div style="display:flex; justify-content:space-between; color:var(--accent-cyan); font-weight:700; font-size:1.2rem; margin-top:1rem; border-top:1px solid var(--border-color); padding-top:1rem">
                                    <span>Total Final</span>
                                    <span>${Utils.formatCurrency(res.total)}</span>
                                </div>
                            </div>
                            <div class="glass" style="padding:1.5rem">
                                <h3 style="margin-bottom:1rem; font-size:1rem">Notas de la Reserva</h3>
                                <div style="font-size:0.95rem; opacity:0.9; line-height:1.6; min-height:80px;">
                                    ${res.notes || '<span style="opacity:0.4; font-style:italic;">Sin notas registradas.</span>'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="modal-footer" style="padding: 1.5rem 2rem; background: rgba(0,0,0,0.05); border-top: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
                    <div class="footer-group" style="display: flex; gap: 0.8rem; align-items: center;">
                        <button type="button" class="btn btn-primary" id="edit-btn" onclick="UI.switchToEditMode('${resId}')" style="background: linear-gradient(135deg, var(--accent-cyan), #00d4ff); min-width: 140px; color: #fff;">
                            <ion-icon name="create-outline"></ion-icon> <span>EDITAR DATOS</span>
                        </button>

                        <div class="communication-actions" style="display: flex; gap: 0.5rem; padding-left: 0.8rem; border-left: 1px solid var(--border-color);">
                            <button type="button" class="btn btn-wa" onclick="Utils.sendWhatsApp('${resId}')" title="Enviar WhatsApp" style="width: 44px; padding: 0;"><ion-icon name="logo-whatsapp" style="font-size: 1.4rem;"></ion-icon></button>
                            <button type="button" class="btn btn-mail" onclick="Utils.sendEmail('${resId}')" title="Enviar Email" style="width: 44px; padding: 0; background: rgba(30, 41, 59, 0.1); color: var(--text-primary);"><ion-icon name="mail-outline" style="font-size: 1.4rem;"></ion-icon></button>
                            <button type="button" class="btn btn-pdf" onclick="Utils.exportPDF('${resId}')" title="Descargar Voucher" style="width: 44px; padding: 0;"><ion-icon name="document-text-outline" style="font-size: 1.4rem;"></ion-icon></button>
                        </div>
                    </div>

                    <div class="footer-group" style="display: flex; gap: 0.8rem; align-items: center;">
                        <button type="button" class="btn btn-secondary" id="action-menu-btn" onclick="UI.showIWantToMenu('${resId}', event)" style="min-width: 130px; border-style: dashed;">
                            <ion-icon name="flash-outline" style="color: var(--accent-gold);"></ion-icon> I WANT TO...
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="closeModal()" style="min-width: 120px;">CANCELAR</button>
                    </div>
                </div>
            `;
        } else {
            const todayStr = new Date().toISOString().split('T')[0];
            form.innerHTML = `
                <div style="padding: 0.6rem 1.5rem; background: rgba(212,175,55,0.08); border-bottom: 1px solid rgba(212,175,55,0.2); display:flex; align-items:center; justify-content:space-between;">
                    <span style="font-size:0.7rem; opacity:0.5; text-transform:uppercase; letter-spacing:1px;">Nueva Reserva</span>
                    <button type="button" onclick="UI.openGuestProfileModal(null, '')" style="background:transparent; border:1px solid rgba(212,175,55,0.5); color:var(--accent-gold); border-radius:20px; padding:0.3rem 0.9rem; font-size:0.72rem; cursor:pointer; display:flex; align-items:center; gap:0.4rem; font-weight:700; letter-spacing:0.5px;">
                        <ion-icon name="person-outline" style="font-size:0.9rem;"></ion-icon> FICHA HUÉSPED
                    </button>
                </div>
                <div style="max-height: 65vh; overflow-y: auto; padding-right: 1.5rem; scrollbar-gutter: stable;">
                    <!-- PROMO HERO (dynamic, updated by initModalLogic) -->
                    <div id="best-rate-advisor-hero" style="padding: 0 0 0 0;"></div>
                    <div class="form-grid">
                        <div class="form-group" style="position:relative;">
                            <label>Nombre</label>
                            <input type="text" id="firstName" value="${res.firstName}" required autocomplete="off"
                                oninput="UI.guestAutocomplete(this, 'firstName')">
                            <div id="guest-suggestions" style="position:absolute;top:100%;left:0;right:0;z-index:500;background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:8px;overflow:hidden;display:none;box-shadow:0 8px 24px rgba(0,0,0,0.4);"></div>
                        </div>
                        <div class="form-group">
                            <label>Apellido</label>
                            <input type="text" id="lastName" value="${res.lastName}" required autocomplete="off"
                                oninput="UI.guestAutocomplete(this, 'lastName')">
                        </div>
                        <div class="form-group" style="grid-column: span 2;">
                            <div style="display:grid; grid-template-columns: 1fr 1fr 100px; gap:1rem; align-items: flex-end;">
                                <div class="form-group">
                                    <label>Check-in</label>
                                    <input type="date" id="checkin" value="${new Date(res.checkin).toISOString().split('T')[0]}" min="${todayStr}" required>
                                </div>
                                <div class="form-group">
                                    <label>Check-out</label>
                                    <input type="date" id="checkout" value="${new Date(res.checkout).toISOString().split('T')[0]}" required>
                                </div>
                                <div class="form-group" style="margin-bottom: 0;">
                                    <div class="glass" style="padding: 0.65rem; border-radius: 8px; text-align: center; border: 1px solid var(--border-color); background: rgba(0,0,0,0.2);">
                                        <small style="display:block; font-size:0.6rem; opacity:0.6; text-transform:uppercase;">Noches</small>
                                        <strong id="nights-display" style="font-size:1.1rem; color:var(--accent-cyan);">1</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="form-group"><label>Email</label><input type="email" id="paxEmail" value="${res.email || ''}"></div>
                        <div class="form-group"><label>WhatsApp</label><input type="text" id="paxPhone" value="${res.phone || ''}"></div>
                        <div class="form-group">
                            <label>Categoría</label>
                            <select id="roomTypeId">
                                ${Store.roomTypes.map(t => `<option value="${t.id}" ${res.roomTypeId === t.id ? 'selected' : ''}>${t.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Habitación</label>
                            <select id="roomId"></select>
                            <div style="margin-top:0.4rem; display:flex; gap:0.4rem; align-items:center;">
                                <input type="checkbox" id="forceAllRooms" style="width:12px;height:12px;">
                                <small style="font-size:0.6rem; opacity:0.7;">Ver todas las categorías</small>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Plan Tarifario</label>
                            <select id="ratePlanId">
                                ${Store.ratePlans.map(p => `<option value="${p.id}" ${res.ratePlanId === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Estado</label>
                            <select id="resStatus">
                                <option value="tentativa" ${res.status === 'tentativa' ? 'selected' : ''}>Tentativa</option>
                                <option value="confirmada" ${res.status === 'confirmada' ? 'selected' : ''}>Confirmada</option>
                            </select>
                        </div>
                        <div class="form-group" style="grid-column: span 2; padding: 1rem; background: rgba(var(--accent-cyan-rgb),0.05); border-radius: 12px; border: 1px solid var(--border-color); margin-top:0.5rem;">
                            <label style="color:var(--accent-cyan); font-size:0.75rem; text-transform:uppercase; font-weight:700;">Tarifa y Descuentos</label>
                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1.5rem; margin-top:0.8rem;">
                                <div class="form-group">
                                    <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.5rem;">
                                        <input type="checkbox" id="manualRateEnabled" style="width:14px; height:14px;">
                                        <label style="font-size:0.75rem; margin:0;">Tarifa Manual</label>
                                    </div>
                                    <input type="number" id="manualRate" value="${res.total || 0}" disabled style="opacity:0.5">
                                </div>
                                <div class="form-group">
                                    <label style="font-size:0.7rem;">Descuento (%)</label>
                                    <input type="number" id="discountPercent" value="${res.discountPercent || 0}" min="0" max="100">
                                </div>
                                <div class="form-group">
                                    <label style="font-size:0.7rem;">Descuento Fijo ($)</label>
                                    <input type="number" id="discountFixed" value="${res.discountFixed || 0}" min="0">
                                </div>
                                <div id="original-rate-box" class="glass" style="padding:0.6rem; border-radius:8px; border:1px dashed var(--border-color); display:flex; flex-direction:column; justify-content:center; align-items:center;">
                                    <small style="font-size:0.6rem; opacity:0.6; text-transform:uppercase;">Tarifa Original</small>
                                    <strong id="original-total" style="font-size:1rem; opacity:0.8;">${Utils.formatCurrency(res.total || 0)}</strong>
                                </div>
                            </div>
                        </div>

                        <div id="best-rate-advisor" style="display:none; grid-column: span 2; align-items:center; gap:1rem; padding: 0.9rem 1.2rem; background: rgba(0, 150, 170, 0.08); border: 1px solid rgba(0,150,170,0.3); border-radius: 12px; margin-top:0.5rem; border-left: 4px solid var(--accent-cyan);"></div>

                        <div class="form-group" style="grid-column: span 2; padding: 1rem; background: rgba(0,0,0,0.1); border-radius: 12px; border: 1px solid var(--border-color); margin-top:0.5rem;">
                            <label style="color:var(--accent-gold); font-size:0.75rem; text-transform:uppercase; font-weight:700;">Pax y Armado</label>
                            <div style="display:grid; grid-template-columns: 1fr 1.5fr; gap:1rem; margin-top:0.5rem;">
                                <div class="form-group">
                                    <label style="font-size:0.65rem;">Adultos</label>
                                    <input type="number" id="paxCount" value="${res.paxCount}" min="1">
                                </div>
                                <div class="form-group">
                                    <label style="font-size:0.65rem;">Tipo de Cama</label>
                                    <select id="bedType">
                                        <option value="mat" ${res.bedType === 'mat' ? 'selected' : ''}>Matrimonial</option>
                                        <option value="twin" ${res.bedType === 'twin' ? 'selected' : ''}>Twin</option>
                                    </select>
                                </div>
                            </div>
                        <div class="form-group" style="grid-column: span 2; padding: 1rem; background: rgba(0,0,0,0.1); border-radius: 12px; border: 1px solid var(--border-color); margin-top:0.5rem;">
                            <label style="color:var(--accent-gold); font-size:0.75rem; text-transform:uppercase; font-weight:700;">Notas Internas</label>
                            <textarea id="resNotes" style="width:100%; min-height:80px; margin-top:0.5rem; background:rgba(0,0,0,0.2); border:1px solid var(--border-color); border-radius:8px; padding:0.8rem; color:var(--text-primary); font-size:0.85rem;" placeholder="Ej: Late check-out solicitado, alergias, etc...">${res.notes || ''}</textarea>
                        </div>

                        <div id="additional-rooms-section" style="grid-column: span 2; margin-top:2rem;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; border-top:1px dashed var(--border-color); padding-top:1.5rem;">
                                <div>
                                    <h3 style="font-size:0.85rem; color:var(--accent-cyan); font-weight:700; margin:0;">HABITACIONES ADICIONALES</h3>
                                    <small style="opacity:0.6; font-size:0.65rem;">Reserva de grupo / mismo titular</small>
                                </div>
                                <button type="button" class="btn btn-secondary btn-sm" onclick="UI.addPartyRoomRow()" style="border-radius:20px; padding: 0.4rem 1rem;">+ Añadir Habitación</button>
                            </div>
                            <div id="party-rooms-container" class="party-container" style="display:flex; flex-direction:column; gap:1.2rem;"></div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer" style="padding: 1.5rem 2rem; background: rgba(0,0,0,0.05); border-top: 1px solid var(--border-color); display: flex; align-items: center; justify-content: flex-end; gap: 1rem;">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">CANCELAR</button>
                    <button type="submit" class="btn btn-primary" style="background: linear-gradient(135deg, var(--accent-cyan), #00d4ff); min-width: 160px; color: #fff;">CREAR RESERVA</button>
                </div>
            `;
        }

        UI.initModalLogic(resId, res);

        form.onsubmit = (e) => {
            e.preventDefault();
            const grandTotal = UI.calculateCurrentTotal();

            const checkin = new Date(document.getElementById('checkin').value + 'T12:00:00');
            const checkout = new Date(document.getElementById('checkout').value + 'T12:00:00');
            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            const ratePlanId = document.getElementById('ratePlanId').value;

            const roomsToBook = [];
            // Principal Room
            roomsToBook.push({
                roomTypeId: document.getElementById('roomTypeId').value,
                roomId: document.getElementById('roomId').value,
                paxCount: parseInt(document.getElementById('paxCount').value),
                bedType: document.getElementById('bedType').value,
                manualRateEnabled: document.getElementById('manualRateEnabled').checked,
                manualRate: parseFloat(document.getElementById('manualRate').value) || 0,
                discountPercent: parseFloat(document.getElementById('discountPercent').value) || 0,
                discountFixed: parseFloat(document.getElementById('discountFixed').value) || 0
            });

            // Additional Rooms
            document.querySelectorAll('.party-room-row').forEach(row => {
                roomsToBook.push({
                    roomTypeId: row.querySelector('.party-type').value,
                    roomId: row.querySelector('.party-room').value,
                    paxCount: parseInt(row.querySelector('.party-pax').value),
                    bedType: row.querySelector('.party-bed').value,
                    total: 0 // Will be calculated individualy
                });
            });

            // --- OVERBOOKING CHECK ---
            const catCounts = {};
            roomsToBook.forEach(r => {
                catCounts[r.roomTypeId] = (catCounts[r.roomTypeId] || 0) + 1;
            });

            let oversellAllowed = true;
            for (const [typeId, countNeeded] of Object.entries(catCounts)) {
                const avail = Store.checkAvailabilityInRange(typeId, checkin, checkout, resId);
                if (avail < countNeeded) {
                    const typeName = Store.getRoomType(typeId).name;
                    if (!confirm(`⚠️ ALERTA IMPORTANTE: SOBREVENTA\n\nNo hay suficiente disponibilidad en la categoría "${typeName.toUpperCase()}".\nQuedan ${avail} disponibles y estás intentando reservar ${countNeeded}.\n\n¿Deseas permitir la sobreventa de todas formas?`)) {
                        oversellAllowed = false;
                        break;
                    }
                }
            }
            if (!oversellAllowed) return;

            const commonData = {
                firstName, lastName,
                email: document.getElementById('paxEmail').value,
                phone: document.getElementById('paxPhone').value,
                market: 'IND',
                source: 'Whatsapp',
                checkin, checkout,
                ratePlanId,
                status: document.getElementById('resStatus').value,
                notes: document.getElementById('resNotes').value,
                guestId: document.getElementById('linked-guest-id')?.value || res.guestId || null
            };

            if (resId) {
                // For edit mode, we only update the main reservation for now
                const mainRes = roomsToBook[0];
                Store.updateReservation(resId, { ...commonData, ...mainRes, total: grandTotal });
            } else {
                // --- ROOM COLLISION CHECK (new reservation) ---
                let hasConflict = false;
                for (const roomData of roomsToBook) {
                    if (!roomData.roomId || roomData.roomId === 'unassigned') continue;
                    const conflict = Store.reservations.find(r => {
                        if (r.status === 'cancelada') return false;
                        if (r.roomId !== roomData.roomId) return false;
                        const s1 = new Date(checkin).getTime();
                        const e1 = new Date(checkout).getTime();
                        const s2 = new Date(r.checkin).getTime();
                        const e2 = new Date(r.checkout).getTime();
                        return s1 < e2 && e1 > s2;
                    });
                    if (conflict) {
                        alert(`🚫 ERROR: HABITACIÓN YA OCUPADA\n\nLa Habitación ${roomData.roomId} ya tiene una reserva para ese periodo:\n\n• ${conflict.lastName}, ${conflict.firstName}\n• ${Utils.formatDate(conflict.checkin)} → ${Utils.formatDate(conflict.checkout)}\n\nElegí otra habitación o modificá las fechas.`);
                        hasConflict = true;
                        break;
                    }
                }
                if (hasConflict) return;

                // --- OVERBOOKING CATEGORY CHECK ---
                // For each room being booked, check if the category is at capacity
                const overbooked = [];
                for (const roomData of roomsToBook) {
                    const typeId = roomData.roomTypeId;
                    const totalInCat = Store.rooms.filter(r => r.typeId === typeId && r.status !== 'ooo').length;
                    // Count existing active reservations on same category overlapping dates
                    let soldInCat = Store.reservations.filter(r => {
                        if (r.status === 'cancelada') return false;
                        if (r.roomTypeId !== typeId) return false;
                        const s1 = new Date(checkin).getTime();
                        const e1 = new Date(checkout).getTime();
                        const s2 = new Date(r.checkin).getTime();
                        const e2 = new Date(r.checkout).getTime();
                        return s1 < e2 && e1 > s2;
                    }).length;
                    const availInCat = totalInCat - soldInCat;
                    if (availInCat <= 0) {
                        const typeName = Store.getRoomType(typeId)?.name || typeId;
                        overbooked.push({ typeName, availInCat, totalInCat, soldInCat });
                    }
                }

                if (overbooked.length > 0) {
                    const detail = overbooked.map(o =>
                        `• ${o.typeName}: ${o.soldInCat}/${o.totalInCat} vendidas → disponibilidad actual: ${o.availInCat}`
                    ).join('\n');
                    const firstConfirm = confirm(
                        `⚠️ ATENCIÓN: SOBREVENTA DE CATEGORÍA\n\n` +
                        `Estás por crear una reserva en una categoría SIN disponibilidad:\n\n${detail}\n\n` +
                        `Esto generará un OVERBOOKING.\n¿Querés continuar de todas formas?`
                    );
                    if (!firstConfirm) return;

                    const secondConfirm = confirm(
                        `🔴 SEGUNDA CONFIRMACIÓN REQUERIDA\n\n` +
                        `Confirmás que querés aceptar este overbooking y guardar la reserva igualmente?\n\n` +
                        `Esta acción quedará registrada y deberás resolverla manualmente.`
                    );
                    if (!secondConfirm) return;
                }

                roomsToBook.forEach((roomData, idx) => {
                    const finalRes = { ...commonData, ...roomData, overbooking: overbooked.length > 0 };
                    if (idx > 0 || roomData.total === 0) {
                        const price = Utils.calculatePrice(roomData.roomTypeId, ratePlanId, checkin, checkout);
                        finalRes.total = price.total;
                    } else {
                        finalRes.total = grandTotal;
                    }
                    Store.addReservation(finalRes);
                });

                // Reopen modal showing the just-created reservation (first one)
                const newRes = Store.reservations[Store.reservations.length - roomsToBook.length];
                if (newRes) {
                    _modalHasChanges = false;
                    _modalSavedResId = newRes.id;
                    UI.openReservationModal(newRes.id);
                } else {
                    _forceCloseModal();
                }
                return; // skip closeModal below
            }
            // Edit saved
            _modalHasChanges = false;
            _modalSavedResId = resId;
            UI.openReservationModal(resId); // refresh view mode
        };
    },

    switchToEditMode: (resId) => {
        const res = Store.reservations.find(r => r.id === resId);
        const form = document.getElementById('reservation-form');
        form.classList.add('edit-mode');
        const todayStr = new Date().toISOString().split('T')[0];

        form.innerHTML = `
            <div style="padding: 0.6rem 1.5rem; background: rgba(212,175,55,0.08); border-bottom: 1px solid rgba(212,175,55,0.2); display:flex; align-items:center; justify-content:space-between;">
                <span style="font-size:0.7rem; opacity:0.5; text-transform:uppercase; letter-spacing:1px;">Editando Reserva #${resId}</span>
                <button type="button" onclick="UI.openGuestProfileModal(null, '${resId}')" style="background:transparent; border:1px solid rgba(212,175,55,0.5); color:var(--accent-gold); border-radius:20px; padding:0.3rem 0.9rem; font-size:0.72rem; cursor:pointer; display:flex; align-items:center; gap:0.4rem; font-weight:700; letter-spacing:0.5px;">
                    <ion-icon name="person-outline" style="font-size:0.9rem;"></ion-icon> FICHA HU\u00c9SPED
                </button>
            </div>
            <div style="max-height: 65vh; overflow-y: auto; padding-right: 1.5rem; scrollbar-gutter: stable;">
                <div class="form-grid">
                    <div class="form-group" style="position:relative;">
                        <label>Nombre</label>
                        <input type="text" id="firstName" value="${res.firstName}" required autocomplete="off"
                            oninput="UI.guestAutocomplete(this, 'firstName')">
                        <div id="guest-suggestions" style="position:absolute;top:100%;left:0;right:0;z-index:500;background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:8px;overflow:hidden;display:none;box-shadow:0 8px 24px rgba(0,0,0,0.4);"></div>
                        ${res.guestId ? `<input type="hidden" id="linked-guest-id" value="${res.guestId}">` : ''}
                    </div>
                    <div class="form-group"><label>Apellido</label><input type="text" id="lastName" value="${res.lastName}" required autocomplete="off" oninput="UI.guestAutocomplete(this, 'lastName')"></div>
                    <div class="form-group" style="grid-column: span 2;">
                        <div style="display:grid; grid-template-columns: 1fr 1fr 100px; gap:1rem; align-items: flex-end;">
                            <div class="form-group">
                                <label>Check-in</label>
                                <input type="date" id="checkin" value="${new Date(res.checkin).toISOString().split('T')[0]}" min="${todayStr}" required>
                            </div>
                            <div class="form-group">
                                <label>Check-out</label>
                                <input type="date" id="checkout" value="${new Date(res.checkout).toISOString().split('T')[0]}" required>
                            </div>
                            <div class="form-group" style="margin-bottom: 0;">
                                <div class="glass" style="padding: 0.65rem; border-radius: 8px; text-align: center; border: 1px solid var(--border-color); background: rgba(0,0,0,0.2);">
                                    <small style="display:block; font-size:0.6rem; opacity:0.6; text-transform:uppercase;">Noches</small>
                                    <strong id="nights-display" style="font-size:1.1rem; color:var(--accent-cyan);">1</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="form-group"><label>Email</label><input type="email" id="paxEmail" value="${res.email || ''}"></div>
                    <div class="form-group"><label>WhatsApp</label><input type="text" id="paxPhone" value="${res.phone || ''}"></div>
                    <div class="form-group">
                        <label>Categoría</label>
                        <select id="roomTypeId">
                            ${Store.roomTypes.map(t => `<option value="${t.id}" ${res.roomTypeId === t.id ? 'selected' : ''}>${t.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Habitación</label>
                        <select id="roomId"></select>
                        <div style="margin-top:0.4rem; display:flex; gap:0.4rem; align-items:center;">
                            <input type="checkbox" id="forceAllRooms" style="width:12px;height:12px;" ${res.roomId === 'unassigned' || !Store.rooms.find(r => r.id === res.roomId && r.typeId === res.roomTypeId) ? 'checked' : ''}>
                            <small style="font-size:0.6rem; opacity:0.7;">Ver todas las categorías</small>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Plan Tarifario</label>
                        <select id="ratePlanId">
                            ${Store.ratePlans.map(p => `<option value="${p.id}" ${res.ratePlanId === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Estado</label>
                        <select id="resStatus">
                            <option value="tentativa" ${res.status === 'tentativa' ? 'selected' : ''}>Tentativa</option>
                            <option value="confirmada" ${res.status === 'confirmada' ? 'selected' : ''}>Confirmada</option>
                            <option value="in-house" ${res.status === 'in-house' ? 'selected' : ''}>In-House</option>
                            <option value="checkout" ${res.status === 'checkout' ? 'selected' : ''}>Check-out</option>
                        </select>
                    </div>

                    <div class="form-group" style="grid-column: span 2; padding: 1rem; background: rgba(var(--accent-cyan-rgb),0.05); border-radius: 12px; border: 1px solid var(--border-color); margin-top:0.5rem;">
                        <label style="color:var(--accent-cyan); font-size:0.75rem; text-transform:uppercase; font-weight:700;">Tarifa y Descuentos</label>
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1.5rem; margin-top:0.8rem;">
                            <div class="form-group">
                                <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.5rem;">
                                    <input type="checkbox" id="manualRateEnabled" style="width:14px; height:14px;" ${res.manualRateEnabled ? 'checked' : ''}>
                                    <label style="font-size:0.75rem; margin:0;">Tarifa Manual</label>
                                </div>
                                <input type="number" id="manualRate" value="${res.manualRate || res.total}" ${res.manualRateEnabled ? '' : 'disabled style="opacity:0.5"'}>
                            </div>
                            <div class="form-group">
                                <label style="font-size:0.7rem;">Descuento (%)</label>
                                <input type="number" id="discountPercent" value="${res.discountPercent || 0}" min="0" max="100">
                            </div>
                            <div class="form-group">
                                <label style="font-size:0.7rem;">Descuento Fijo ($)</label>
                                <input type="number" id="discountFixed" value="${res.discountFixed || 0}" min="0">
                            </div>
                            <div id="original-rate-box" class="glass" style="padding:0.6rem; border-radius:12px; border:1px solid var(--border-color); display:flex; flex-direction:column; justify-content:center; align-items:center; background:rgba(0,0,0,0.2); min-height:60px;">
                                <small style="font-size:0.6rem; opacity:0.6; text-transform:uppercase; font-weight:700;">Venta Final</small>
                                <strong id="original-total" style="font-size:1.1rem; opacity:1;">${Utils.formatCurrency(res.total || 0)}</strong>
                            </div>
                        </div>
                    </div>

                    <div class="form-group" style="grid-column: span 2; padding: 1rem; background: rgba(0,0,0,0.1); border-radius: 12px; border: 1px solid var(--border-color); margin-top:0.5rem;">
                        <label style="color:var(--accent-gold); font-size:0.75rem; text-transform:uppercase; font-weight:700;">Pax y Armado</label>
                        <div style="display:grid; grid-template-columns: 1fr 1.5fr; gap:1rem; margin-top:0.5rem;">
                            <div class="form-group">
                                <label style="font-size:0.65rem;">Adultos</label>
                                <input type="number" id="paxCount" value="${res.paxCount}" min="1">
                            </div>
                            <div class="form-group">
                                <label style="font-size:0.65rem;">Tipo de Cama</label>
                                <select id="bedType">
                                    <option value="mat" ${res.bedType === 'mat' ? 'selected' : ''}>Matrimonial</option>
                                    <option value="twin" ${res.bedType === 'twin' ? 'selected' : ''}>Twin</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="form-group" style="grid-column: span 2; padding: 1rem; background: rgba(0,0,0,0.1); border-radius: 12px; border: 1px solid var(--border-color); margin-top:0.5rem;">
                        <label style="color:var(--accent-gold); font-size:0.75rem; text-transform:uppercase; font-weight:700;">Notas Internas</label>
                        <textarea id="resNotes" style="width:100%; min-height:80px; margin-top:0.5rem; background:rgba(0,0,0,0.2); border:1px solid var(--border-color); border-radius:8px; padding:0.8rem; color:var(--text-primary); font-size:0.85rem;" placeholder="Ej: Late check-out solicitado, alergias, etc...">${res.notes || ''}</textarea>
                    </div>
                </div>
                <div class="modal-footer" style="padding: 1.5rem 2rem; background: rgba(0,0,0,0.05); border-top: 1px solid var(--border-color); display: flex; align-items: center; justify-content: flex-end; gap: 1rem;">
                    <button type="button" class="btn btn-secondary" onclick="UI.openReservationModal('${resId}')">DESCARTAR</button>
                    <button type="submit" class="btn btn-primary" style="background: linear-gradient(135deg, var(--accent-cyan), #00d4ff); min-width: 160px; color: #fff;">GUARDAR CAMBIOS</button>
                </div>
            </div>
        `;

        UI.initModalLogic(resId, res);

        form.onsubmit = (e) => {
            e.preventDefault();
            const total = UI.calculateCurrentTotal();
            const mainRes = {
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                email: document.getElementById('paxEmail').value,
                phone: document.getElementById('paxPhone').value,
                market: 'IND',
                source: 'Whatsapp',
                checkin: new Date(document.getElementById('checkin').value + 'T12:00:00'),
                checkout: new Date(document.getElementById('checkout').value + 'T12:00:00'),
                roomTypeId: document.getElementById('roomTypeId').value,
                roomId: document.getElementById('roomId').value,
                paxCount: parseInt(document.getElementById('paxCount').value),
                bedType: document.getElementById('bedType').value,
                ratePlanId: document.getElementById('ratePlanId').value,
                status: document.getElementById('resStatus').value,
                total: total,
                manualRateEnabled: document.getElementById('manualRateEnabled').checked,
                manualRate: parseFloat(document.getElementById('manualRate').value) || 0,
                discountPercent: parseFloat(document.getElementById('discountPercent').value) || 0,
                discountFixed: parseFloat(document.getElementById('discountFixed').value) || 0,
                notes: document.getElementById('resNotes').value
            };
            // --- ROOM COLLISION CHECK (physical room double-booking) ---
            const roomsToValidate = [
                ...(mainRes.roomId && mainRes.roomId !== 'unassigned' ? [{ roomId: mainRes.roomId, checkin: mainRes.checkin, checkout: mainRes.checkout }] : []),
            ];

            for (const booking of roomsToValidate) {
                const conflict = Store.reservations.find(r => {
                    if (r.id === resId) return false; // exclude self
                    if (r.status === 'cancelada') return false;
                    if (r.roomId !== booking.roomId) return false;
                    const s1 = new Date(booking.checkin).getTime();
                    const e1 = new Date(booking.checkout).getTime();
                    const s2 = new Date(r.checkin).getTime();
                    const e2 = new Date(r.checkout).getTime();
                    return s1 < e2 && e1 > s2;
                });

                if (conflict) {
                    alert(`🚫 ERROR: HABITACIÓN YA OCUPADA\n\nLa Habitación ${booking.roomId} ya tiene una reserva asignada para ese periodo:\n\n• ${conflict.lastName}, ${conflict.firstName}\n• ${Utils.formatDate(conflict.checkin)} → ${Utils.formatDate(conflict.checkout)}\n\nElegí otra habitación o modificá las fechas.`);
                    return; // abort save
                }
            }

            Store.updateReservation(resId, mainRes);
            _modalHasChanges = false;
            _modalSavedResId = resId;
            UI.openReservationModal(resId); // refresh to view mode
        };
    },

    initModalLogic: (resId, res) => {
        const updateRooms = () => {
            const currentTypeid = document.getElementById('roomTypeId')?.value;
            const forceAll = document.getElementById('forceAllRooms')?.checked;
            const roomIdSelect = document.getElementById('roomId');
            const checkin = document.getElementById('checkin')?.value;
            const checkout = document.getElementById('checkout')?.value;

            if (!roomIdSelect || !currentTypeid) return;

            let filteredRooms = forceAll ? Store.rooms : Store.rooms.filter(r => r.typeId === currentTypeid);
            let html = `<option value="unassigned" ${res.roomId === 'unassigned' ? 'selected' : ''}> Sin Asignar</option>`;

            filteredRooms.forEach(room => {
                const available = Store.isRoomAvailable(room.id, checkin, checkout, resId);
                const type = Store.getRoomType(room.typeId);
                const isPreSelected = room.id === res.roomId;
                html += `<option value="${room.id}" ${isPreSelected ? 'selected' : ''} ${!available ? 'disabled' : ''}>
    ${room.id} - ${type.name} ${!available ? '(🚫)' : ''}
                </option>`;
            });
            roomIdSelect.innerHTML = html;

            // Force the pre-selected roomId (from quickReserve) even after populate
            if (res.roomId && res.roomId !== 'unassigned') {
                const matchingOption = roomIdSelect.querySelector(`option[value="${res.roomId}"]`);
                if (matchingOption && !matchingOption.disabled) {
                    roomIdSelect.value = res.roomId;
                }
            }
        };

        const updatePricing = () => {
            const currentTypeid = document.getElementById('roomTypeId')?.value;
            const currentPlanid = document.getElementById('ratePlanId')?.value || 'A';
            const checkin = document.getElementById('checkin')?.value;
            const checkout = document.getElementById('checkout')?.value;
            if (!currentTypeid || !checkin || !checkout) return;

            const nights = Math.max(1, Math.ceil((new Date(checkout + 'T12:00:00') - new Date(checkin + 'T12:00:00')) / 86400000));
            const price = Utils.calculatePrice(currentTypeid, currentPlanid, checkin, checkout);
            const originalTotal = price.total;

            const nightsDisplay = document.getElementById('nights-display');
            if (nightsDisplay) nightsDisplay.textContent = nights;

            // Manual Logic
            const manualEnabled = document.getElementById('manualRateEnabled').checked;
            const manualInput = document.getElementById('manualRate');
            const discountPercent = parseFloat(document.getElementById('discountPercent').value) || 0;
            const discountFixed = parseFloat(document.getElementById('discountFixed').value) || 0;

            manualInput.disabled = !manualEnabled;
            manualInput.style.opacity = manualEnabled ? '1' : '0.5';

            let baseToUse = manualEnabled ? (parseFloat(manualInput.value) || 0) : originalTotal;
            let finalTotal = baseToUse;

            // Apply discounts
            if (discountPercent > 0) finalTotal -= (finalTotal * (discountPercent / 100));
            if (discountFixed > 0) finalTotal -= discountFixed;

            const originalTotalDisplay = document.getElementById('original-total');
            if (originalTotalDisplay) {
                originalTotalDisplay.innerHTML = `
                    <div style="font-size:1.2rem; color:var(--accent-cyan); font-weight:800;">${Utils.formatCurrency(finalTotal)}</div>
                    ${finalTotal !== originalTotal ? `<div style="font-size:0.65rem; opacity:0.5; text-decoration:line-through; margin-top:2px">Base: ${Utils.formatCurrency(originalTotal)}</div>` : ''}
                `;
            }

            const mainSubmitBtn = document.querySelector('#reservation-form button[type="submit"]');
            if (mainSubmitBtn) {
                const actionText = resId ? 'GUARDAR' : 'CREAR';
                mainSubmitBtn.textContent = `${actionText} - ${Utils.formatCurrency(finalTotal)}`;
            }

            const pricingBreakdown = document.getElementById('pricing-breakdown');
            if (pricingBreakdown) {
                let html = `${nights} noches x ${Utils.formatCurrency(originalTotal / nights)}`;
                if (manualEnabled) html = `<span style="text-decoration:line-through; opacity:0.5;">${html}</span> <span style="color:var(--accent-gold); font-size:0.7rem;">[MANUAL]</span>`;
                pricingBreakdown.innerHTML = html;
            }

            // --- 💡 BEST RATE ADVISOR ---
            const eligiblePlans = Store.ratePlans
                .filter(p => nights >= p.minNights)
                .map(p => ({
                    ...p,
                    total: Utils.calculatePrice(currentTypeid, p.id, checkin, checkout).total
                }))
                .sort((a, b) => a.total - b.total);

            const bestPlan = eligiblePlans[0];
            const currentPlanTotal = Utils.calculatePrice(currentTypeid, currentPlanid, checkin, checkout).total;
            const advisorBox = document.getElementById('best-rate-advisor');

            if (advisorBox && bestPlan && bestPlan.id !== currentPlanid && bestPlan.total < currentPlanTotal) {
                const saving = currentPlanTotal - bestPlan.total;
                advisorBox.style.display = 'flex';
                advisorBox.innerHTML = `
                    <div style="display:flex; gap:0.8rem; align-items:center; flex:1;">
                        <span style="font-size:1.4rem;">💡</span>
                        <div>
                            <div style="font-size:0.75rem; font-weight:800; color:var(--accent-cyan); text-transform:uppercase; letter-spacing:0.05em;">Mejor Tarifa Disponible</div>
                            <div style="font-size:0.85rem; margin-top:2px;">
                                <strong>${bestPlan.name}</strong>
                                — ${Utils.formatCurrency(bestPlan.total)}
                                <span style="color:var(--accent-neon-green); font-weight:700; margin-left:4px;">✓ Ahorrás ${Utils.formatCurrency(saving)}</span>
                            </div>
                            <div style="font-size:0.65rem; opacity:0.6; margin-top:2px;">
                                Política: ${bestPlan.cancelPolicy} · ${bestPlan.refundable ? '✅ Reembolsable' : '❌ No reembolsable'} · ${bestPlan.breakfast ? '🍳 Desayuno incl.' : 'Sin desayuno'}
                            </div>
                        </div>
                    </div>
                    <button type="button" onclick="
                        document.getElementById('ratePlanId').value = '${bestPlan.id}';
                        document.getElementById('ratePlanId').dispatchEvent(new Event('change'));
                    " style="
                        white-space:nowrap; flex-shrink:0;
                        background: var(--accent-cyan); color:#000;
                        border:none; border-radius:8px; padding:0.5rem 1rem;
                        font-size:0.75rem; font-weight:800; cursor:pointer;
                        text-transform:uppercase; letter-spacing:0.05em;
                    ">APLICAR →</button>
                `;
            } else if (advisorBox) {
                advisorBox.style.display = 'none';
            }

            // --- Update HERO banner at top of form ---
            const heroBox = document.getElementById('best-rate-advisor-hero');
            if (heroBox) {
                const applyCallback = `document.getElementById('ratePlanId').value='${bestPlan?.id}'; document.getElementById('ratePlanId').dispatchEvent(new Event('change'));`;
                const heroHtml = UI.buildRateAdvisorHtml(currentTypeid, currentPlanid, checkin + 'T12:00:00', checkout + 'T12:00:00', applyCallback);
                heroBox.innerHTML = heroHtml;
                heroBox.style.padding = heroHtml ? '1rem 0 0 0' : '0';
            }

            return finalTotal;
        };

        // --- Mark form dirty on any input/change ---
        const markDirty = () => { _modalHasChanges = true; };
        ['firstName', 'lastName', 'checkin', 'checkout', 'paxEmail', 'paxPhone',
            'roomTypeId', 'roomId', 'ratePlanId', 'resStatus', 'resNotes',
            'paxCount', 'bedType', 'manualRateEnabled', 'manualRate',
            'discountPercent', 'discountFixed', 'forceAllRooms'
        ].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', markDirty);
                el.addEventListener('change', markDirty);
            }
        });

        ['roomTypeId', 'checkin', 'checkout', 'forceAllRooms', 'ratePlanId', 'manualRateEnabled', 'manualRate', 'discountPercent', 'discountFixed'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                if (el.type === 'checkbox' || el.tagName === 'SELECT') {
                    el.onchange = () => { updatePricing(); updateRooms(); UI.updateAllPartyOptions(); };
                } else {
                    el.oninput = () => { updatePricing(); updateRooms(); };
                }
            }
        });

        updatePricing();
        updateRooms();
    },

    partyRoomCount: 0,
    addPartyRoomRow: () => {
        const container = document.getElementById('party-rooms-container');
        const count = document.querySelectorAll('.party-room-row').length + 2;
        const rowId = `party-row-${Utils.generateId()}`;
        const div = document.createElement('div');
        div.className = 'party-room-row glass anim-fade-in';
        div.id = rowId;
        div.style.cssText = 'padding:1.2rem; border-left: 4px solid var(--accent-gold); position:relative;';

        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                <span style="font-size:0.7rem; font-weight:800; color:var(--accent-gold); text-transform:uppercase; letter-spacing:1px;">HABITACIÓN ADICIONAL #${count}</span>
                <button type="button" class="btn-icon text-danger" onclick="document.getElementById('${rowId}').remove(); UI.calculateCurrentTotal();" style="border:none; background:transparent;"><ion-icon name="trash-outline"></ion-icon></button>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label>Categoría</label>
                    <select class="party-type" onchange="UI.updatePartyRoomOptions('${rowId}')">
                        ${Store.roomTypes.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Habitación</label>
                    <select class="party-room">
                        <option value="unassigned">Sin Asignar</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Pax</label>
                    <input type="number" class="party-pax" value="2" min="1" oninput="UI.calculateCurrentTotal()">
                </div>
                <div class="form-group">
                    <label>Cama</label>
                    <select class="party-bed">
                        <option value="mat">Matrimonial</option>
                        <option value="twin">Twin</option>
                    </select>
                </div>
            </div>
        `;
        container.appendChild(div);
        UI.updatePartyRoomOptions(rowId);
        UI.calculateCurrentTotal();
    },

    updatePartyRoomOptions: (rowId) => {
        const row = document.getElementById(rowId);
        if (!row) return;
        const typeId = row.querySelector('.party-type').value;
        const roomSelect = row.querySelector('.party-room');
        const checkin = document.getElementById('checkin').value;
        const checkout = document.getElementById('checkout').value;

        let filteredRooms = Store.rooms.filter(r => r.typeId === typeId);
        let html = `<option value="unassigned">Sin Asignar</option>`;

        filteredRooms.forEach(room => {
            const available = Store.isRoomAvailable(room.id, checkin, checkout);
            html += `<option value="${room.id}" ${!available ? 'disabled' : ''}>${room.id} ${!available ? '(🚫)' : ''}</option>`;
        });
        roomSelect.innerHTML = html;
        UI.calculateCurrentTotal();
    },

    updateAllPartyOptions: () => {
        document.querySelectorAll('.party-room-row').forEach(row => {
            UI.updatePartyRoomOptions(row.id);
        });
    },

    calculateCurrentTotal: () => {
        const manualEnabled = document.getElementById('manualRateEnabled').checked;
        const manualRate = parseFloat(document.getElementById('manualRate').value) || 0;
        const discountPercent = parseFloat(document.getElementById('discountPercent').value) || 0;
        const discountFixed = parseFloat(document.getElementById('discountFixed').value) || 0;

        let mainRoomTotal = 0;
        if (manualEnabled) {
            mainRoomTotal = manualRate;
        } else {
            const typeid = document.getElementById('roomTypeId').value;
            const planid = document.getElementById('ratePlanId')?.value || 'A';
            const checkin = document.getElementById('checkin').value;
            const checkout = document.getElementById('checkout').value;
            const price = Utils.calculatePrice(typeid, planid, checkin, checkout);
            mainRoomTotal = price.total;
        }

        if (discountPercent > 0) mainRoomTotal -= (mainRoomTotal * (discountPercent / 100));
        if (discountFixed > 0) mainRoomTotal -= discountFixed;

        // Add additional rooms
        let grandTotal = mainRoomTotal;
        const checkin = document.getElementById('checkin').value;
        const checkout = document.getElementById('checkout').value;
        const planid = document.getElementById('ratePlanId')?.value || 'A';

        document.querySelectorAll('.party-room-row').forEach(row => {
            const typeId = row.querySelector('.party-type').value;
            const price = Utils.calculatePrice(typeId, planid, checkin, checkout);
            grandTotal += price.total;
        });

        const submitBtn = document.querySelector('#reservation-form button[type="submit"]');
        if (submitBtn) {
            const currentText = submitBtn.textContent.split(' - ')[0];
            submitBtn.textContent = `${currentText} - ${Utils.formatCurrency(grandTotal)}`;
        }

        return grandTotal;
    },

    partyRoomCount: 0,
    addPartyRoomRow: () => {
        const container = document.getElementById('party-rooms-container');
        const rowId = `party-row-${UI.partyRoomCount++}`;
        const div = document.createElement('div');
        div.className = 'party-room-row glass anim-fade-in';
        div.id = rowId;

        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.8rem;">
                <small style="font-weight:700; color:var(--accent-cyan); text-transform:uppercase; letter-spacing:1px;">Habitación Adicional</small>
                <button type="button" class="close-modal" style="font-size:1.2rem; background:transparent; border:none; cursor:pointer;" onclick="document.getElementById('${rowId}').remove()">×</button>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label>Categoría</label>
                    <select class="party-type" onchange="UI.updatePartyRoomOptions('${rowId}')">
                        ${Store.roomTypes.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Habitación</label>
                    <select class="party-room">
                        <option value="unassigned">Sin Asignar</option>
                    </select>
                </div>
            </div>
        `;
        container.appendChild(div);
        UI.updatePartyRoomOptions(rowId);
    },

    updatePartyRoomOptions: (rowId) => {
        const row = document.getElementById(rowId);
        if (!row) return;
        const typeid = row.querySelector('.party-type').value;
        const roomSelect = row.querySelector('.party-room');
        const checkin = document.getElementById('checkin').value;
        const checkout = document.getElementById('checkout').value;

        let rooms = Store.rooms.filter(r => r.typeid === typeId);
        let html = `<option value = "unassigned" > Sin Asignar</option> `;
        rooms.forEach(rm => {
            const avail = Store.isRoomAvailable(rm.id, checkin, checkout);
            html += `<option value = "${rm.id}" ${!avail ? 'disabled' : ''}> ${rm.id} ${!avail ? '(🚫)' : ''}</option> `;
        });
        roomSelect.innerHTML = html;
    },

    renderReservationsList: () => {
        const container = document.getElementById('view-content');
        container.innerHTML = `
            <div class="view-header">
                <h2>Listado de Reservas</h2>
                <div class="search-bar">
                    <ion-icon name="search-outline"></ion-icon>
                    <input type="text" placeholder="Buscar por huésped o ID..." onkeyup="UI.filterReservations(this.value)">
                </div>
            </div>
            <div class="glass table-container">
                <table class="nexus-table" id="res-list-table">
                    <thead>
                        <tr><th>ID</th><th>Huésped</th><th>PAX</th><th>Estadía</th><th>Hab</th><th>Total</th><th>Estado</th><th style="text-align:center">Acciones</th></tr>
                    </thead>
                    <tbody>
                        ${Store.reservations.sort((a, b) => b.createdAt - a.createdAt).map(r => {
            const isCheckinDay = Utils.isSameDay(new Date(r.checkin), new Date());
            const isCheckoutDay = Utils.isSameDay(new Date(r.checkout), new Date());

            let actionsView = '';
            if ((r.status === 'confirmada' || r.status === 'tentativa') && isCheckinDay) {
                actionsView = `<button class="btn btn-wa btn-sm" onclick="event.stopPropagation(); UI.quickStatusUpdate('${r.id}', 'in-house')" style="padding: 4px 12px; font-size: 0.65rem;">CHECK-IN</button>`;
            } else if (r.status === 'in-house' && isCheckoutDay) {
                actionsView = `<button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); UI.quickStatusUpdate('${r.id}', 'checkout')" style="padding: 4px 12px; font-size: 0.65rem; background:var(--accent-violet);">CHECK-OUT</button>`;
            }

            return `
                            <tr onclick="UI.openReservationModal('${r.id}')" style="cursor:pointer">
                                <td><small style="opacity:0.5">${r.id}</small></td>
                                <td><strong>${r.lastName || '---'}, ${r.firstName || '---'}</strong></td>
                                <td><small>${r.paxCount || 0} pax (${(r.bedType || r.bedtype) === 'mat' ? 'Mat' : 'Twin'})</small></td>
                                <td>${Utils.formatDate(r.checkin)} - ${Utils.formatDate(r.checkout)}</td>
                                <td><strong>${r.roomId === 'unassigned' ? '<span style="color:var(--accent-gold);">(!) Pendiente</span>' : `H.${r.roomId}`}</strong></td>
                                <td>${Utils.formatCurrency(r.total)}</td>
                                <td><span class="status-pill status-${r.status}">${r.status.toUpperCase()}</span></td>
                                <td style="text-align:center">${actionsView}</td>
                            </tr>
                        `;
        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    quickStatusUpdate: (id, status) => {
        const res = Store.reservations.find(r => r.id === id);
        const actionLabel = status === 'in-house' ? 'CHECK-IN' : 'CHECK-OUT';

        if (!confirm(`¿Estás seguro que deseas realizar el ${actionLabel} para el huésped ${res.lastName || ''}?`)) return;

        Store.updateReservation(id, { status });
        if (status === 'in-house') {
            alert(`Check-in realizado con éxito para ${res.lastName}. ¡Bienvenido!`);
        } else if (status === 'checkout') {
            alert(`Check-out finalizado para ${res.lastName}. ¡Buen viaje!`);
        }
        UI.renderReservationsList();
    },

    // --- MODULE 10: REPORTS ---
    activeReport: 'performance',
    changeReport: (rep) => {
        UI.activeReport = rep;
        UI.renderReports();
    },

    renderReports: () => {
        const container = document.getElementById('view-content');
        const filters = Store.reportsFilters;

        container.innerHTML = `
            <div id="reports-sticky-header" style="position: sticky; top: -1px; z-index: 100; background: var(--bg-primary); padding: 1rem 0; margin: -1rem 0 1.5rem 0;">
                <div class="view-header" style="margin-bottom: 1rem; padding: 0 2rem;">
                    <div style="display:flex; align-items:center; gap:1rem;">
                        <ion-icon name="stats-chart-outline" style="font-size: 1.5rem; color: var(--accent-cyan);"></ion-icon>
                        <h2 style="margin:0;">Módulo de Reportes</h2>
                    </div>
                    <div class="actions">
                        <button class="btn btn-secondary btn-sm" onclick="UI.resetReportFilters()" style="padding: 0.4rem 0.8rem; font-size: 0.7rem;">RESET FILTROS</button>
                    </div>
                </div>

                <div class="report-filter-bar glass" style="margin: 0 2rem 1.2rem 2rem; position: relative; top: 0; box-shadow: 0 8px 32px rgba(0,0,0,0.2);">
                    <div class="form-group">
                        <label>Desde</label>
                        <input type="date" id="rep-from" value="${filters.from}" onchange="UI.updateReportFilters()">
                    </div>
                    <div class="form-group">
                        <label>Hasta</label>
                        <input type="date" id="rep-to" value="${filters.to}" onchange="UI.updateReportFilters()">
                    </div>
                    <div class="form-group">
                        <label>Canal</label>
                        <select id="rep-channel" onchange="UI.updateReportFilters()">
                            <option value="all" ${filters.channel === 'all' ? 'selected' : ''}>Todos</option>
                            <option value="Whatsapp" ${filters.channel === 'Whatsapp' ? 'selected' : ''}>Whatsapp</option>
                            <option value="OTA" ${filters.channel === 'OTA' ? 'selected' : ''}>OTA</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Categoría</label>
                        <select id="rep-type" onchange="UI.updateReportFilters()">
                            <option value="all" ${filters.type === 'all' ? 'selected' : ''}>Todas</option>
                            ${Store.roomTypes.map(t => `<option value="${t.id}" ${filters.type === t.id ? 'selected' : ''}>${t.name}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <div class="report-tabs" style="display:flex; gap:0.6rem; margin: 0 2rem; overflow-x:auto; padding-bottom:0.5rem; scrollbar-width:none; -ms-overflow-style:none;">
                    <style>.report-tabs::-webkit-scrollbar { display: none; }</style>
                    <button class="btn ${UI.activeReport === 'performance' ? 'btn-primary' : 'btn-secondary'}" 
                            onclick="UI.changeReport('performance')" 
                            style="white-space:nowrap; border-radius:10px; padding: 0.5rem 1.2rem; font-size: 0.75rem;">
                        <ion-icon name="trending-up-outline"></ion-icon> PERFORMANCE
                    </button>
                    <button class="btn ${UI.activeReport === 'pickup' ? 'btn-primary' : 'btn-secondary'}" 
                            onclick="UI.changeReport('pickup')" 
                            style="white-space:nowrap; border-radius:10px; padding: 0.5rem 1.2rem; font-size: 0.75rem;">
                        <ion-icon name="git-branch-outline"></ion-icon> PICKUP & CANALES
                    </button>
                    <button class="btn ${UI.activeReport === 'breakfast' ? 'btn-primary' : 'btn-secondary'}" 
                            onclick="UI.changeReport('breakfast')" 
                            style="white-space:nowrap; border-radius:10px; padding: 0.5rem 1.2rem; font-size: 0.75rem;">
                        <ion-icon name="cafe-outline"></ion-icon> DESAYUNOS
                    </button>
                    <button class="btn ${UI.activeReport === 'notes' ? 'btn-primary' : 'btn-secondary'}" 
                            onclick="UI.changeReport('notes')" 
                            style="white-space:nowrap; border-radius:10px; padding: 0.5rem 1.2rem; font-size: 0.75rem;">
                        <ion-icon name="clipboard-outline"></ion-icon> NOTAS
                    </button>
                    <button class="btn ${UI.activeReport === 'quotes' ? 'btn-primary' : 'btn-secondary'}" 
                            onclick="UI.changeReport('quotes')" 
                            style="white-space:nowrap; border-radius:10px; padding: 0.5rem 1.2rem; font-size: 0.75rem; border: 1px solid var(--accent-gold);">
                        <ion-icon name="paper-plane-outline" style="color:var(--accent-gold)"></ion-icon> COTIZACIONES ENVIADAS
                    </button>
                    <button class="btn ${UI.activeReport === 'searchwindow' ? 'btn-primary' : 'btn-secondary'}" 
                            onclick="UI.changeReport('searchwindow')" 
                            style="white-space:nowrap; border-radius:10px; padding: 0.5rem 1.2rem; font-size: 0.75rem; border: 1px solid rgba(139,92,246,0.5);">
                        <ion-icon name="time-outline" style="color:#8b5cf6"></ion-icon> SEARCH WINDOW
                    </button>
                </div>
                </div>
            </div>

            <div id="reports-dynamic-content" class="anim-fade-in" style="padding: 0 2rem;">
                ${UI.renderReportsContent()}
            </div>
`;
    },

    updateReportFilters: () => {
        Store.reportsFilters.from = document.getElementById('rep-from').value;
        Store.reportsFilters.to = document.getElementById('rep-to').value;
        Store.reportsFilters.channel = document.getElementById('rep-channel').value;
        Store.reportsFilters.type = document.getElementById('rep-type').value;
        UI.renderReports();
    },

    toggleReportHolds: () => {
        Store.reportsFilters.includeHolds = document.getElementById('rep-holds').checked;
        UI.renderReportsContent();
    },

    resetReportFilters: () => {
        Store.reportsFilters = {
            from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
            to: new Date().toISOString().split('T')[0],
            channel: 'all',
            roomType: 'all',
            includeHolds: false
        };
        UI.renderReports();
    },

    renderReportsContent: () => {
        if (UI.activeReport === 'performance') return UI.renderPerformanceReport();
        if (UI.activeReport === 'pickup') return UI.renderPickupReport();
        if (UI.activeReport === 'breakfast') return UI.renderBreakfastReport();
        if (UI.activeReport === 'notes') return UI.renderNotesReport();
        if (UI.activeReport === 'quotes') return UI.renderQuotesListReport();
        if (UI.activeReport === 'searchwindow') return UI.renderSearchWindowReport();
        return '';
    },

    renderPerformanceReport: () => {
        const filters = Store.reportsFilters;
        const dates = Utils.getDatesInRange(filters.from, filters.to);
        const stats = dates.map(d => Store.getDailyStats(d));

        const totalRevenue = stats.reduce((sum, s) => sum + s.revenue, 0);
        const totalSold = stats.reduce((sum, s) => sum + s.sold, 0);
        const totalAvail = stats.reduce((sum, s) => sum + s.available, 0);
        const avgOcc = totalAvail > 0 ? (totalSold / totalAvail) * 100 : 0;
        const avgADR = totalSold > 0 ? totalRevenue / totalSold : 0;

        return `
            <div class="report-summary-grid">
                <div class="summary-card glass">
                    <div class="label">Ocupación %</div>
                    <div class="value">${Math.round(avgOcc)}%</div>
                </div>
                <div class="summary-card glass">
                    <div class="label">ADR</div>
                    <div class="value">${Utils.formatCurrency(avgADR)}</div>
                </div>
                <div class="summary-card glass">
                    <div class="label">Revenue Total</div>
                    <div class="value">${Utils.formatCurrency(totalRevenue)}</div>
                </div>
                <div class="summary-card glass">
                    <div class="label">Roomnights</div>
                    <div class="value">${totalSold} RN</div>
                </div>
            </div>

            <div class="report-section glass" style="margin-top:2rem">
                <h3>Detalle de Operaciones y Venta</h3>
                <div class="table-container">
                    <table class="nexus-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Disp</th>
                                <th>Ocup</th>
                                <th>%</th>
                                <th style="color:var(--accent-red)">OUTs</th>
                                <th style="color:var(--accent-gold)">QUEDAs</th>
                                <th>Venta</th>
                                <th>ADR</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${stats.map(s => `
                                <tr>
                                    <td>${Utils.formatDate(s.date)}</td>
                                    <td>${s.available}</td>
                                    <td>${s.sold}</td>
                                    <td><strong>${Math.round(s.occupancy)}%</strong></td>
                                    <td style="font-weight:700; color:var(--accent-red)">${s.departures}</td>
                                    <td style="font-weight:700; color:var(--accent-gold)">${s.stays}</td>
                                    <td>${Utils.formatCurrency(s.revenue)}</td>
                                    <td>${Utils.formatCurrency(s.adr)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    renderPickupReport: () => {
        return `
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:2rem">
                <div class="glass" style="padding:1.5rem">
                    <h3>Pickup (Nuevas Reservas)</h3>
                    ${UI.renderPickupStats()}
                </div>
                <div class="glass" style="padding:1.5rem">
                    <h3>Producción por Canal</h3>
                    ${UI.renderChannelStats()}
                </div>
            </div>
        `;
    },

    renderNotesReport: () => {
        const filters = Store.reportsFilters;
        const res = Store.reservations.filter(r => {
            const inRange = Utils.isDateInRange(r.checkin, filters.from, filters.to) ||
                Utils.isDateInRange(r.checkout, filters.from, filters.to);
            const matchesChannel = filters.channel === 'all' || r.source === filters.channel;
            const matchesType = filters.roomType === 'all' || r.roomTypeId === filters.roomType;
            return inRange && matchesChannel && matchesType && r.status !== 'cancelada';
        });

        return `
            <div class="report-section glass">
                <h3>Reporte de Notas de Reservas</h3>
                <div class="table-container" style="margin-top:1rem;">
                    <table class="nexus-table">
                        <thead>
                            <tr><th>Hab</th><th>Huésped</th><th>Estadía</th><th>Nota</th></tr>
                        </thead>
                        <tbody>
                            ${res.map(r => `
                                <tr>
                                    <td><strong>${r.roomId || 'S/A'}</strong></td>
                                    <td>${r.lastName}, ${r.firstName}</td>
                                    <td><small>${Utils.formatDate(r.checkin)} - ${Utils.formatDate(r.checkout)}</small></td>
                                    <td style="max-width:300px; white-space:normal; font-size:0.85rem; line-height:1.4;">
                                        ${r.notes || '<span style="opacity:0.3; font-style:italic;">Sin nota</span>'}
                                    </td>
                                </tr>
                            `).join('')}
                            ${res.length === 0 ? '<tr><td colspan="4" style="text-align:center; padding:3rem; opacity:0.5;">No hay notas para el periodo seleccionado.</td></tr>' : ''}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    // --- QUICK QUOTE MODULE (NEW) ---
    renderQuickQuoteView: () => {
        const container = document.getElementById('view-content');
        container.innerHTML = `
            <div class="view-header" style="padding: 0 2rem; margin-bottom: 2rem;">
                <div style="display:flex; align-items:center; gap:1rem;">
                    <ion-icon name="flash" style="font-size: 1.5rem; color: var(--accent-cyan);"></ion-icon>
                    <h2 style="margin:0;">Cotizador Express</h2>
                </div>
                <p style="font-size: 0.9rem; opacity: 0.6; margin-top: 0.5rem;">Genera presupuestos rápidos y prereserva en segundos.</p>
            </div>
            <div id="quote-view-container" style="padding: 0 2rem;">
                ${UI.renderQuickQuote()}
            </div>
        `;
        // Scripts inside innerHTML are not executed by browsers — call directly:
        UI.updateQuotePreview();
    },

    renderQuickQuote: () => {
        return `
            <div style="display:grid; grid-template-columns: 1fr 1.2fr; gap:2rem; align-items:start;">
                <!-- Step 1: Input Form -->
                <div class="glass" style="padding:2rem;">
                    <div style="display:flex; align-items:center; gap:0.8rem; margin-bottom:1.5rem;">
                        <div style="width:32px; height:32px; border-radius:50%; background:var(--accent-cyan); color:#000; display:flex; align-items:center; justify-content:center; font-weight:800;">1</div>
                        <h3 style="margin:0;">Datos de la Consulta</h3>
                    </div>
                    
                    <div class="form-grid">
                        <div class="form-group" style="grid-column: span 2;">
                            <label>Huésped (Nombre y Apellido)</label>
                            <input type="text" id="qq-name" placeholder="ej: Juan Perez" oninput="UI.updateQuotePreview()">
                        </div>
                        <div class="form-group">
                            <label>Desde</label>
                            <input type="date" id="qq-from" value="${Store.hotelInfo.systemDate}" onclick="this.showPicker()" onchange="UI.updateQuotePreview()">
                        </div>
                        <div class="form-group">
                            <label>Hasta</label>
                            <input type="date" id="qq-to" value="${(() => { const d = Store.getSystemDate(); d.setDate(d.getDate() + 2); return d.toISOString().split('T')[0]; })()}" onclick="this.showPicker()" onchange="UI.updateQuotePreview()">
                        </div>
                        <div class="form-group">
                            <label>Cantidad de Pax</label>
                            <input type="number" id="qq-pax" value="2" min="1" oninput="UI.updateQuotePreview()">
                        </div>
                        <div class="form-group">
                            <label>Contacto (Mail o WhatsApp)</label>
                            <input type="text" id="qq-contact" placeholder="+54 9..." oninput="UI.updateQuotePreview()">
                        </div>
                        <div class="form-group">
                            <label>Descuento (%)</label>
                            <input type="number" id="qq-disc-perc" value="0" min="0" max="100" oninput="UI.updateQuotePreview()">
                        </div>
                        <div class="form-group">
                            <label>Descuento Fijo (${Store.hotelInfo.currency || '$'})</label>
                            <input type="number" id="qq-disc-abs" value="0" min="0" oninput="UI.updateQuotePreview()">
                        </div>
                        <div class="form-group" style="grid-column: span 2;">
                            <label><ion-icon name="bed-outline"></ion-icon> Tipo de Habitación</label>
                            <select id="qq-roomtype" onchange="UI.updateQuotePreview()" style="width:100%;">
                                <option value="auto">✨ Automático — Mejor tarifa disponible</option>
                                ${Store.roomTypes.map(t => `<option value="${t.id}">${t.name} (cap. ${t.capacity} pax)</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group" style="grid-column: span 2;">
                            <label><ion-icon name="document-text-outline"></ion-icon> Notas / Incluye / Condiciones</label>
                            <textarea id="qq-notes" rows="3" oninput="UI.updateQuotePreview()"
                                placeholder="Ej: Incluye desayuno buffet, acceso al spa, late check-out..."
                                style="width:100%; resize:vertical; background:rgba(0,0,0,0.2); border:1px solid var(--border-color); border-radius:8px; padding:0.7rem; color:var(--text-primary); font-size:0.85rem; font-family:inherit; box-sizing:border-box;">Incluye: Desayuno Buffet, Acceso al Spa y Wi-Fi.</textarea>
                        </div>
                        <div class="form-group" style="grid-column: span 2;">
                            <label><ion-icon name="notifications-outline"></ion-icon> Próximo Seguimiento (Interno)</label>
                            <input type="date" id="qq-followup" value="${(() => { const d = Store.getSystemDate(); d.setDate(d.getDate() + 2); return d.toISOString().split('T')[0]; })()}" onclick="this.showPicker()" onchange="UI.updateQuotePreview()">
                        </div>
                    </div>

                    <div id="qq-best-option-container" style="margin-top:2rem;">
                        <!-- Auto calculated best option will appear here -->
                    </div>
                </div>

                <!-- Step 2: Preview & Export -->
                <div class="glass" style="padding:2rem; min-height:400px; display:flex; flex-direction:column; border:1px solid rgba(0,242,255,0.15); box-shadow: 0 0 30px rgba(0,242,255,0.05);">
                    <div style="display:flex; align-items:center; gap:0.8rem; margin-bottom:1.5rem;">
                        <div style="width:32px; height:32px; border-radius:50%; background:var(--accent-cyan); color:#000; display:flex; align-items:center; justify-content:center; font-weight:800;">2</div>
                        <h3 style="margin:0;">Cotización Generada</h3>
                    </div>

                    <div id="qq-preview-box" class="glass" style="flex:1; background:rgba(0,0,0,0.2); padding:1.5rem; border-radius:12px; font-family:monospace; font-size:0.85rem; line-height:1.5; white-space:pre-wrap; margin-bottom:1.5rem;">
                        Completa los datos para generar la cotización...
                    </div>

                    <div id="qq-actions" style="display:none; flex-direction:column; gap:0.75rem;">

                        <!-- CTA Principal -->
                        <button onclick="UI.createReservationFromQuote()"
                            style="width:100%; padding:0.9rem 1rem; font-size:0.95rem; font-weight:800; letter-spacing:0.8px;
                                   background:linear-gradient(135deg,#22c55e,#16a34a); border:none; border-radius:10px;
                                   color:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center;
                                   gap:0.6rem; box-shadow:0 4px 20px rgba(34,197,94,0.4); transition:filter 0.2s;"
                            onmouseover="this.style.filter='brightness(1.1)'" onmouseout="this.style.filter=''">
                            <ion-icon name="calendar-number-outline" style="font-size:1.1rem;"></ion-icon>
                            RESERVAR AHORA
                        </button>

                        <!-- Divider -->
                        <div style="display:flex; align-items:center; gap:0.75rem; margin:0.1rem 0;">
                            <div style="flex:1; height:1px; background:var(--border-color);"></div>
                            <span style="font-size:0.6rem; text-transform:uppercase; letter-spacing:1px; opacity:0.35;">Compartir cotización</span>
                            <div style="flex:1; height:1px; background:var(--border-color);"></div>
                        </div>

                        <!-- Share row: 3 equal compact buttons -->
                        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:0.6rem;">
                            <button onclick="UI.shareQuote('whatsapp')"
                                style="padding:0.6rem 0.4rem; border-radius:8px; border:1px solid rgba(37,211,102,0.4);
                                       background:rgba(37,211,102,0.1); color:#25d366; font-size:0.72rem; font-weight:700;
                                       cursor:pointer; display:flex; align-items:center; justify-content:center; gap:0.35rem;
                                       transition:background 0.15s;"
                                onmouseover="this.style.background='rgba(37,211,102,0.2)'" onmouseout="this.style.background='rgba(37,211,102,0.1)'">
                                <ion-icon name="logo-whatsapp" style="font-size:1rem;"></ion-icon> WhatsApp
                            </button>
                            <button onclick="UI.shareQuote('mail')"
                                style="padding:0.6rem 0.4rem; border-radius:8px; border:1px solid rgba(0,150,200,0.4);
                                       background:rgba(0,150,200,0.1); color:var(--accent-cyan); font-size:0.72rem; font-weight:700;
                                       cursor:pointer; display:flex; align-items:center; justify-content:center; gap:0.35rem;
                                       transition:background 0.15s;"
                                onmouseover="this.style.background='rgba(0,150,200,0.2)'" onmouseout="this.style.background='rgba(0,150,200,0.1)'">
                                <ion-icon name="mail-outline" style="font-size:1rem;"></ion-icon> Email
                            </button>
                            <button onclick="Utils.exportQuotePDF(UI._lastQuoteData)"
                                style="padding:0.6rem 0.4rem; border-radius:8px; border:1px solid rgba(212,175,55,0.4);
                                       background:rgba(212,175,55,0.1); color:var(--accent-gold); font-size:0.72rem; font-weight:700;
                                       cursor:pointer; display:flex; align-items:center; justify-content:center; gap:0.35rem;
                                       transition:background 0.15s;"
                                onmouseover="this.style.background='rgba(212,175,55,0.2)'" onmouseout="this.style.background='rgba(212,175,55,0.1)'">
                                <ion-icon name="document-text-outline" style="font-size:1rem;"></ion-icon> PDF
                            </button>
                        </div>

                        <!-- Divider -->
                        <div style="display:flex; align-items:center; gap:0.75rem; margin:0.1rem 0;">
                            <div style="flex:1; height:1px; background:var(--border-color);"></div>
                            <span style="font-size:0.6rem; text-transform:uppercase; letter-spacing:1px; opacity:0.35;">Guardar</span>
                            <div style="flex:1; height:1px; background:var(--border-color);"></div>
                        </div>

                        <!-- Save row: 2 equal buttons -->
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.6rem;">
                            <button onclick="UI.saveQuotePreview()"
                                style="padding:0.65rem 0.5rem; border-radius:8px; border:1px dashed rgba(0,242,255,0.35);
                                       background:rgba(0,242,255,0.05); color:var(--accent-cyan); font-size:0.72rem; font-weight:700;
                                       cursor:pointer; display:flex; align-items:center; justify-content:center; gap:0.4rem;
                                       transition:background 0.15s;"
                                onmouseover="this.style.background='rgba(0,242,255,0.12)'" onmouseout="this.style.background='rgba(0,242,255,0.05)'">
                                <ion-icon name="save-outline"></ion-icon> Guardar seguimiento
                            </button>
                            <button id="btn-qq-hold" onclick="UI.createQuickHold()"
                                style="padding:0.65rem 0.5rem; border-radius:8px; border:none;
                                       background:linear-gradient(135deg,var(--accent-violet),#7c3aed); color:#fff;
                                       font-size:0.72rem; font-weight:800; letter-spacing:0.5px;
                                       cursor:pointer; display:flex; align-items:center; justify-content:center; gap:0.4rem;
                                       box-shadow:0 4px 16px rgba(139,92,246,0.35); transition:filter 0.2s;"
                                onmouseover="this.style.filter='brightness(1.1)'" onmouseout="this.style.filter=''">
                                <ion-icon name="anchor-outline"></ion-icon> Prereservar 24hs
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        `;
    },

    updateQuotePreview: () => {
        const name = document.getElementById('qq-name').value || '---';
        const from = document.getElementById('qq-from').value;
        const to = document.getElementById('qq-to').value;
        const pax = parseInt(document.getElementById('qq-pax').value) || 2;
        const contact = document.getElementById('qq-contact').value || '---';
        const discPerc = parseFloat(document.getElementById('qq-disc-perc').value) || 0;
        const discAbs = parseFloat(document.getElementById('qq-disc-abs').value) || 0;
        const selectedType = document.getElementById('qq-roomtype')?.value || 'auto';
        const notes = document.getElementById('qq-notes')?.value?.trim() || '';

        const nights = Utils.calculateStay(from, to) || 1;

        // Build candidate room types
        const validTypes = Store.roomTypes.filter(t => t.capacity >= pax);
        let bestOption = null;

        if (validTypes.length > 0) {
            const options = validTypes.map(type => {
                const avail = Store.checkAvailabilityInRange(type.id, from, to);
                const price = Utils.calculatePrice(type.id, 'A', from, to);
                return { type, avail, originalTotal: price.total };
            }).filter(o => o.avail > 0);

            if (selectedType === 'auto') {
                // Auto: pick cheapest available
                options.sort((a, b) => a.originalTotal - b.originalTotal);
                if (options.length > 0) bestOption = options[0];
            } else {
                // Specific type forced by user
                bestOption = options.find(o => o.type.id === selectedType) || null;
            }
        }

        const previewBox = document.getElementById('qq-preview-box');
        const actionsBox = document.getElementById('qq-actions');
        const bestContainer = document.getElementById('qq-best-option-container');

        if (!bestOption) {
            previewBox.innerHTML = `<div style="text-align:center; padding-top:4rem; color:var(--accent-red); font-weight:700;">🚫 NO HAY DISPONIBILIDAD PARA ${pax} PERSONAS EN ESAS FECHAS</div>`;
            actionsBox.style.display = 'none';
            bestContainer.innerHTML = '';
            return;
        }

        actionsBox.style.display = 'flex';

        const hotel = Store.hotelInfo;
        const currency = hotel.currency || 'USD';

        // Calculation
        const totalWithPerc = bestOption.originalTotal * (1 - (discPerc / 100));
        const finalTotal = totalWithPerc - discAbs;
        const hasDiscount = (discPerc > 0 || discAbs > 0);

        const discountLine = hasDiscount
            ? `📉 *DESCUENTO APLICADO:* ~${Utils.formatCurrency(bestOption.originalTotal)}~ *${Utils.formatCurrency(finalTotal)} ${currency}*`
            : `💰 *TOTAL ESTADÍA:* ${Utils.formatCurrency(bestOption.originalTotal)} ${currency}`;

        const notesLine = notes ? `\n📋 *Incluye / Condiciones:*\n${notes}` : `\n✅ *Incluye:* Desayuno Buffet, Acceso al Spa y Wi-Fi.`;

        const quoteText = `🏔️ *COTIZACIÓN EXPRESS - ${hotel.name.toUpperCase()}* 🏔️

Hola *${name}*, un placer saludarte. Adjuntamos la información para tu estadía:

📅 *Fechas:* ${Utils.formatDate(from)} al ${Utils.formatDate(to)} (${nights} noches)
👥 *Pax:* ${pax} personas
🛏️ *Habitación:* ${bestOption.type.name}

${discountLine}
${notesLine}
🔒 *Garantía:* Podes solicitar una *Prereserva por 24hs* para anclar esta tarifa y garantizar tu lugar.

¿Te reservamos una habitación? ¡Quedamos a tu disposición! ✨`.trim();

        previewBox.textContent = quoteText;

        bestContainer.innerHTML = `
            <div class="glass anim-fade-in" style="padding:1rem; border-left:4px solid var(--accent-cyan); background:rgba(0,242,255,0.05);">
                <div style="font-size:0.7rem; text-transform:uppercase; color:var(--accent-cyan); font-weight:800; margin-bottom:0.5rem;">Mejor Tarifa Encontrada</div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong style="font-size:1.1rem;">${bestOption.type.name}</strong>
                        <div style="font-size:0.8rem; opacity:0.6;">Disponibles: ${bestOption.avail} habitaciones</div>
                    </div>
                    <div style="text-align:right;">
                        ${hasDiscount ? `<div style="font-size:0.8rem; opacity:0.5; text-decoration:line-through;">${Utils.formatCurrency(bestOption.originalTotal)}</div>` : ''}
                        <div style="font-size:1.4rem; font-weight:800; color:var(--accent-cyan); font-family:var(--font-accent);">${Utils.formatCurrency(finalTotal)}</div>
                        <div style="font-size:0.7rem; opacity:0.6;">Total x ${nights} Noches</div>
                    </div>
                </div>
            </div>
        `;

        // Save metadata for the hold button and reports
        UI._lastQuoteData = {
            name, from, to, pax, contact,
            typeId: bestOption.type.id,
            typeName: bestOption.type.name,
            total: finalTotal,
            originalTotal: bestOption.originalTotal,
            notes,
            followUpDate: document.getElementById('qq-followup').value
        };
    },

    createQuickHold: () => {
        const data = UI._lastQuoteData;
        if (!data) return;

        const holdUntil = new Date();
        holdUntil.setHours(holdUntil.getHours() + 24);

        const newRes = {
            id: 'HOLD-' + Utils.generateId().slice(0, 6).toUpperCase(),
            firstName: data.name.split(' ')[0] || '---',
            lastName: data.name.split(' ').slice(1).join(' ') || 'CONSULTA',
            checkin: data.from,
            checkout: data.to,
            paxCount: data.pax,
            adults: data.pax,
            children: 0,
            roomTypeId: data.typeId,
            roomId: 'unassigned',
            status: 'tentativa',
            total: data.total,
            source: 'Whatsapp',
            createdAt: new Date(),
            holdUntil: holdUntil,
            notes: `[QUICK QUOTE HOLD] Valido x 24h hasta ${holdUntil.toLocaleString()}.${data.notes ? '\n' + data.notes : ''}`
        };

        Store.addReservation(newRes);
        // Also add to quotes log
        Store.addQuote({ ...data, status: 'HOLD PRERESERVA' });

        alert(`✅ ¡Prereserva generada! 
        
La tarifa y disponibilidad están bloqueadas por 24hs. Podes encontrarla en el Rack como "Sin Asignar".`);
    },

    createReservationFromQuote: () => {
        const data = UI._lastQuoteData;
        if (!data) {
            alert('⚠️ Primero completá los datos para generar una cotización.');
            return;
        }

        // Split name into firstName / lastName
        const nameParts = (data.name || '').trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Open new reservation modal
        UI.openReservationModal(null);

        // Wait for modal DOM to render, then pre-fill fields
        setTimeout(() => {
            const fnEl = document.getElementById('firstName');
            const lnEl = document.getElementById('lastName');
            const emailEl = document.getElementById('paxEmail');
            const phoneEl = document.getElementById('paxPhone');
            const ciEl = document.getElementById('checkin');
            const coEl = document.getElementById('checkout');
            const rtEl = document.getElementById('roomTypeId');
            const paxEl = document.getElementById('paxCount');
            const notesEl = document.getElementById('resNotes');

            if (fnEl) fnEl.value = firstName;
            if (lnEl) lnEl.value = lastName;

            if (emailEl && data.contact && data.contact.includes('@')) emailEl.value = data.contact;
            if (phoneEl && data.contact && !data.contact.includes('@')) phoneEl.value = data.contact;

            if (ciEl) { ciEl.value = data.from; ciEl.dispatchEvent(new Event('change')); }
            if (coEl) { coEl.value = data.to; coEl.dispatchEvent(new Event('change')); }

            if (rtEl && data.typeId) {
                rtEl.value = data.typeId;
                rtEl.dispatchEvent(new Event('change'));
            }

            if (paxEl && data.pax) paxEl.value = data.pax;

            if (notesEl && data.notes) notesEl.value = `[Cotizador] ${data.notes}`;

            // Refresh nights counter
            const nights = Math.round((new Date(data.to) - new Date(data.from)) / 86400000);
            const nd = document.getElementById('nights-display');
            if (nd) nd.textContent = nights || 1;

            // Trigger rate recalculation
            if (document.getElementById('ratePlanId')) {
                document.getElementById('ratePlanId').dispatchEvent(new Event('change'));
            }

            // Visual green flash on firstName
            if (fnEl) {
                fnEl.style.borderColor = '#22c55e';
                fnEl.style.boxShadow = '0 0 10px rgba(34,197,94,0.4)';
                setTimeout(() => { fnEl.style.borderColor = ''; fnEl.style.boxShadow = ''; }, 2000);
            }
        }, 150);
    },

    saveQuotePreview: () => {

        const data = UI._lastQuoteData;
        if (!data) {
            alert('⚠️ Primero completá los datos para generar una cotización.');
            return;
        }
        Store.addQuote({ ...data, status: 'GUARDADA' });
        // Store.addQuote already calls Store.notify() → re-renders the view
        alert(`✅ Cotización guardada exitosamente.\nPodes consultarla en Reportes > Cotizaciones Enviadas.`);
    },

    shareQuote: (method) => {
        const data = UI._lastQuoteData;
        if (!data) return;

        // Save Quote to history
        Store.addQuote({ ...data, status: 'SENT' });

        if (method === 'whatsapp') {
            const cleanPhone = data.contact.replace(/\D/g, '');
            const msg = encodeURIComponent(`🏔️ *PROPUESTA DE ESTADÍA - ${Store.hotelInfo.name.toUpperCase()}* 🏔️\n\nHola *${data.name}*, ¡un placer saludarte!\n\nTe adjunto la propuesta detallada para tu estadía del *${Utils.formatDate(data.from)}* al *${Utils.formatDate(data.to)}*.\n\nPodés ver el presupuesto completo y los detalles del servicio ingresando al link del PDF que te enviamos (o solicitando el archivo).\n\n¿Qué te parece la propuesta? ¡Quedamos a tu disposición! ✨`);

            // First open PDF, then WA
            Utils.exportQuotePDF(data);
            setTimeout(() => {
                window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
            }, 500);
        } else {
            const subject = encodeURIComponent(`Presupuesto de Estadía - ${Store.hotelInfo.name}`);
            const body = encodeURIComponent(`Hola ${data.name},\n\nEs un placer enviarte el presupuesto para tu estadía...\n\n(El PDF se generará a continuación)`);
            Utils.exportQuotePDF(data);
            window.location.href = `mailto:${data.contact}?subject=${subject}&body=${body}`;
        }
    },

    renderQuotesListReport: () => {
        const filters = Store.reportsFilters;
        // Show ALL quotes (no date filter) sorted newest first
        // Date filter was preventing newly saved quotes from appearing
        const allQuotes = Store.quotes.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const quotes = allQuotes;

        return `
            <div class="report-section glass">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                    <h3 style="margin:0;">Seguimiento de Cotizaciones Enviadas</h3>
                    <div style="font-size:0.8rem; background:rgba(212,175,55,0.1); color:var(--accent-gold); padding:0.4rem 1rem; border-radius:50px; border:1px solid rgba(212,175,55,0.2);">
                        Total Leads Periodo: ${quotes.length}
                    </div>
                </div>
                
                <div class="table-container">
                    <table class="nexus-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Huésped</th>
                                <th>Estadía</th>
                                <th>Total</th>
                                <th>Próx. Seguimiento</th>
                                <th>Estado</th>
                                <th style="text-align:center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${quotes.map(q => {
            const isLate = new Date(q.followUpDate) < new Date() && q.status !== 'HOLD PRERESERVA';
            return `
                                    <tr>
                                        <td>${Utils.formatDate(q.createdAt)}</td>
                                        <td><strong>${q.name}</strong><br><small style="opacity:0.6">${q.contact}</small></td>
                                        <td>${Utils.formatDate(q.from)} - ${Utils.formatDate(q.to)}</td>
                                        <td><strong>${Utils.formatCurrency(q.total)}</strong></td>
                                        <td>
                                            <span style="${isLate ? 'color:var(--accent-red); font-weight:700;' : ''}">
                                                ${Utils.formatDate(q.followUpDate)}
                                                ${isLate ? ' ⚠️' : ''}
                                            </span>
                                        </td>
                                        <td>
                                            <span class="status-pill ${q.status === 'HOLD PRERESERVA' ? 'status-confirmada' : q.status === 'CONVERTIDA' ? 'status-confirmada' : q.status === 'DESESTIMADA' ? 'status-cancelada' : 'status-tentativa'}">
                                                ${q.status}
                                            </span>
                                            ${q.rejectionReason ? `<br><small style="opacity:0.5">Motivo: ${q.rejectionReason}</small>` : ''}
                                        </td>
                                        <td style="text-align:center">
                                            <div style="display:flex; gap:0.3rem; justify-content:center;">
                                                <button class="btn btn-secondary btn-sm" onclick="Utils.exportQuotePDF(${JSON.stringify(q).replace(/"/g, '&quot;')})" title="Ver PDF"><ion-icon name="document-text-outline"></ion-icon></button>
                                                ${q.status !== 'CONVERTIDA' && q.status !== 'DESESTIMADA' ? `
                                                    <button class="btn btn-primary btn-sm" onclick="UI.convertQuoteToReservation('${q.id}')" title="Convertir a Reserva" style="background:var(--accent-cyan); color:#000; border:none;"><ion-icon name="checkmark-circle-outline"></ion-icon></button>
                                                    <button class="btn btn-danger btn-sm" onclick="UI.dismissQuote('${q.id}')" title="Desestimar" style="padding:0.2rem 0.5rem;"><ion-icon name="close-circle-outline"></ion-icon></button>
                                                ` : ''}
                                            </div>
                                        </td>
                                    </tr>
                                `;
        }).join('')}
                            ${quotes.length === 0 ? `<tr><td colspan="7" style="text-align:center; padding:3rem; opacity:0.7;">
                                <div style="font-size:2rem; margin-bottom:0.5rem;">📋</div>
                                <div style="font-weight:700; margin-bottom:0.3rem;">Todavía no hay cotizaciones guardadas</div>
                                <div style="font-size:0.8rem; opacity:0.6;">Generá una desde el módulo <strong>Cotizador Express</strong> y presioná "Guardar para Seguimiento", "WhatsApp" o "Email".</div>
                            </td></tr>` : ''}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    renderSearchWindowReport: () => {
        const quotes = Store.quotes.filter(q => q.from); // only those with a check-in date

        if (quotes.length === 0) {
            return `
                <div class="report-section glass" style="text-align:center; padding:4rem;">
                    <div style="font-size:3rem; margin-bottom:1rem;">🔭</div>
                    <h3>Sin datos de Search Window</h3>
                    <p style="opacity:0.6;">Generá cotizaciones desde el <strong>Cotizador Express</strong> para empezar a medir con cuánta anticipación consultan tus huéspedes.</p>
                </div>`;
        }

        // Calculate lead days for each quote
        const withLeadDays = quotes.map(q => {
            const created = new Date(q.createdAt);
            const checkin = new Date(q.from);
            created.setHours(0, 0, 0, 0);
            checkin.setHours(0, 0, 0, 0);
            const leadDays = Math.max(0, Math.round((checkin - created) / 86400000));
            return { ...q, leadDays };
        }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const allLeadDays = withLeadDays.map(q => q.leadDays);
        const avg = Math.round(allLeadDays.reduce((s, d) => s + d, 0) / allLeadDays.length);
        const sorted = [...allLeadDays].sort((a, b) => a - b);
        const median = sorted.length % 2 === 0
            ? Math.round((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2)
            : sorted[Math.floor(sorted.length / 2)];
        const minDays = sorted[0];
        const maxDays = sorted[sorted.length - 1];

        // Distribution buckets
        const buckets = [
            { label: 'Último Momento', range: '0 – 7 días', min: 0, max: 7, color: '#ef4444', icon: '🔴' },
            { label: 'Corto Plazo', range: '8 – 14 días', min: 8, max: 14, color: '#f97316', icon: '🟠' },
            { label: 'Mediano Plazo', range: '15 – 30 días', min: 15, max: 30, color: '#eab308', icon: '🟡' },
            { label: 'Anticipado', range: '31 – 60 días', min: 31, max: 60, color: '#22c55e', icon: '🟢' },
            { label: 'Alta Anticipación', range: '60+ días', min: 61, max: Infinity, color: '#8b5cf6', icon: '🟣' },
        ];

        const bucketCounts = buckets.map(b => ({
            ...b,
            count: withLeadDays.filter(q => q.leadDays >= b.min && q.leadDays <= b.max).length,
        }));

        const maxCount = Math.max(...bucketCounts.map(b => b.count), 1);

        const barChart = bucketCounts.map(b => {
            const pct = Math.round((b.count / maxCount) * 100);
            const pctOfTotal = ((b.count / quotes.length) * 100).toFixed(0);
            return `
                <div style="display:grid; grid-template-columns: 150px 1fr 60px 50px; align-items:center; gap:1rem; margin-bottom:0.8rem;">
                    <div style="font-size:0.8rem;">
                        <span style="color:${b.color}; font-weight:700;">${b.icon} ${b.label}</span>
                        <div style="font-size:0.68rem; opacity:0.5;">${b.range}</div>
                    </div>
                    <div style="background:rgba(255,255,255,0.05); border-radius:50px; overflow:hidden; height:22px; position:relative;">
                        <div style="width:${pct}%; height:100%; background:${b.color}; border-radius:50px; transition:width 0.6s ease; opacity:0.85;"></div>
                        ${b.count > 0 ? `<span style="position:absolute; left:${Math.min(pct, 85)}%; top:50%; transform:translate(4px,-50%); font-size:0.7rem; font-weight:700; color:${b.color};">${b.count}</span>` : ''}
                    </div>
                    <div style="text-align:right; font-weight:800; font-size:0.9rem; color:${b.color};">${b.count}</div>
                    <div style="text-align:right; font-size:0.75rem; opacity:0.5;">${pctOfTotal}%</div>
                </div>`;
        }).join('');

        const tableRows = withLeadDays.map(q => {
            const bucket = buckets.find(b => q.leadDays >= b.min && q.leadDays <= b.max) || buckets[buckets.length - 1];
            const segment = bucket.label;
            const segColor = bucket.color;
            return `
                <tr>
                    <td>${Utils.formatDate(q.createdAt)}</td>
                    <td><strong>${q.name || '---'}</strong><br><small style="opacity:0.5">${q.contact || ''}</small></td>
                    <td>${Utils.formatDate(q.from)}</td>
                    <td style="text-align:center;">
                        <span style="font-size:1.1rem; font-weight:800; color:${segColor};">${q.leadDays}</span>
                        <span style="font-size:0.7rem; opacity:0.5;"> días</span>
                    </td>
                    <td><span style="color:${segColor}; font-size:0.75rem; font-weight:700;">${segment}</span></td>
                    <td>${Utils.formatCurrency(q.total || 0)}</td>
                    <td>
                        <span class="status-pill ${q.status === 'HOLD PRERESERVA' ? 'status-confirmada' : q.status === 'CONVERTIDA' ? 'status-confirmada' : q.status === 'DESESTIMADA' ? 'status-cancelada' : 'status-tentativa'}">
                            ${q.status}
                        </span>
                    </td>
                </tr>`;
        }).join('');

        return `
            <div class="report-section glass" style="margin-bottom:1.5rem;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
                    <div>
                        <h3 style="margin:0; display:flex; align-items:center; gap:0.5rem;">
                            <ion-icon name="time-outline" style="color:#8b5cf6;"></ion-icon>
                            Search Window — Anticipación de Consultas
                        </h3>
                        <div style="font-size:0.8rem; opacity:0.5; margin-top:0.3rem;">Días entre la consulta y la fecha de check-in deseada · ${quotes.length} cotizaciones analizadas</div>
                    </div>
                </div>

                <!-- KPI Cards -->
                <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:1rem; margin-bottom:2rem;">
                    <div class="glass" style="padding:1.2rem; text-align:center; border-top:3px solid #8b5cf6;">
                        <div style="font-size:0.65rem; text-transform:uppercase; opacity:0.5; margin-bottom:0.3rem; letter-spacing:1px;">Promedio</div>
                        <div style="font-size:2.2rem; font-weight:800; color:#8b5cf6; font-family:var(--font-accent);">${avg}</div>
                        <div style="font-size:0.7rem; opacity:0.5;">días de anticipación</div>
                    </div>
                    <div class="glass" style="padding:1.2rem; text-align:center; border-top:3px solid var(--accent-cyan);">
                        <div style="font-size:0.65rem; text-transform:uppercase; opacity:0.5; margin-bottom:0.3rem; letter-spacing:1px;">Mediana</div>
                        <div style="font-size:2.2rem; font-weight:800; color:var(--accent-cyan); font-family:var(--font-accent);">${median}</div>
                        <div style="font-size:0.7rem; opacity:0.5;">días de anticipación</div>
                    </div>
                    <div class="glass" style="padding:1.2rem; text-align:center; border-top:3px solid #22c55e;">
                        <div style="font-size:0.65rem; text-transform:uppercase; opacity:0.5; margin-bottom:0.3rem; letter-spacing:1px;">Máximo</div>
                        <div style="font-size:2.2rem; font-weight:800; color:#22c55e; font-family:var(--font-accent);">${maxDays}</div>
                        <div style="font-size:0.7rem; opacity:0.5;">días de anticipación</div>
                    </div>
                    <div class="glass" style="padding:1.2rem; text-align:center; border-top:3px solid #ef4444;">
                        <div style="font-size:0.65rem; text-transform:uppercase; opacity:0.5; margin-bottom:0.3rem; letter-spacing:1px;">Mínimo</div>
                        <div style="font-size:2.2rem; font-weight:800; color:#ef4444; font-family:var(--font-accent);">${minDays}</div>
                        <div style="font-size:0.7rem; opacity:0.5;">días de anticipación</div>
                    </div>
                </div>

                <!-- Distribution Chart -->
                <div class="glass" style="padding:1.5rem; margin-bottom:1.5rem;">
                    <div style="font-size:0.7rem; text-transform:uppercase; letter-spacing:1px; opacity:0.5; margin-bottom:1.2rem;">Distribución por Segmento</div>
                    ${barChart}
                </div>

                <!-- Detail Table -->
                <div style="font-size:0.7rem; text-transform:uppercase; letter-spacing:1px; opacity:0.5; margin-bottom:0.8rem;">Detalle por Cotización</div>
                <div class="table-container">
                    <table class="nexus-table">
                        <thead>
                            <tr>
                                <th>Fecha Consulta</th>
                                <th>Huésped</th>
                                <th>Check-in Pedido</th>
                                <th style="text-align:center">Anticipación</th>
                                <th>Segmento</th>
                                <th>Total Cot.</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },


    convertQuoteToReservation: (quoteId) => {
        const q = Store.quotes.find(x => x.id === quoteId);
        if (!q) return;

        if (!confirm(`¿Confirmas la conversión de la cotización de ${q.name} en una reserva definitiva?`)) return;

        const resId = Store.addReservation({
            firstName: q.name.split(' ')[0] || '---',
            lastName: q.name.split(' ').slice(1).join(' ') || 'CONSULTA',
            checkin: q.from,
            checkout: q.to,
            paxCount: q.pax,
            adults: q.pax,
            children: 0,
            roomTypeId: q.typeId,
            roomId: 'unassigned',
            status: 'confirmada',
            total: q.total,
            source: 'Whatsapp',
            notes: `[CONVERTIDA DESDE COTIZACIÓN ${q.id}]`
        });

        Store.updateQuote(quoteId, { status: 'CONVERTIDA', resId });
        alert('✅ ¡Felicidades! Reserva creada y vinculada.');
        UI.renderReports();
    },

    dismissQuote: (quoteId) => {
        const q = Store.quotes.find(x => x.id === quoteId);
        if (!q) return;

        const reason = prompt(`Motivo por el cual desestimamos el presupuesto de ${q.name}:`, 'Precio elevado / Eligió competencia');
        if (reason !== null) {
            Store.updateQuote(quoteId, { status: 'DESESTIMADA', rejectionReason: reason || 'Sin motivo' });
            UI.renderReports();
        }
    },

    exportActiveReport: () => {
        if (UI.activeReport === 'performance') UI.exportDailyReport();
        else if (UI.activeReport === 'breakfast') UI.exportBreakfastReport();
        else alert('La exportación para este reporte estará disponible pronto.');
    },

    renderBreakfastReport: () => {
        const filters = Store.reportsFilters;
        const dates = Utils.getDatesInRange(filters.from, filters.to);

        const data = dates.map(date => {
            // Breakfast for Today (date) is for people who were in-house LAST NIGHT.
            // This means checkin < date AND checkout >= date.
            const stats = Store.getDailyStats(date);
            return { date, count: stats.sold, pax: stats.guests };
        });

        return `
    <div class="table-container" style = "max-height:300px; overflow-y:auto; margin-top:1rem;" >
        <table class="nexus-table">
            <thead><tr><th>Fecha</th><th>Habitaciones</th><th>Personas (Total)</th></tr></thead>
            <tbody>
                ${data.map(d => `
                            <tr>
                                <td>${Utils.formatDate(d.date)}</td>
                                <td>${d.count}</td>
                                <td><strong>${d.pax}</strong></td>
                            </tr>
                        `).join('')}
            </tbody>
        </table>
            </div>
    `;
    },

    renderPickupStats: () => {
        const windowDays = 7;
        const limitDate = new Date();
        limitDate.setDate(limitDate.getDate() - windowDays);

        const pickupReservations = Store.reservations.filter(r => new Date(r.createdAt) >= limitDate);
        const rn = pickupReservations.length;
        const revenue = pickupReservations.reduce((sum, r) => sum + r.total, 0);

        return `
    <div class="report-summary-grid" style = "grid-template-columns: 1fr 1fr; gap:1rem; margin-top:1rem;" >
                <div class="summary-card" style="padding:1rem; background:rgba(255,255,255,0.03)">
                    <div class="label">Reservas</div>
                    <div class="value" style="font-size:1.5rem;">${rn}</div>
                </div>
                <div class="summary-card" style="padding:1rem; background:rgba(255,255,255,0.03)">
                    <div class="label">Revenue</div>
                    <div class="value" style="font-size:1.5rem;">${Utils.formatCurrency(revenue)}</div>
                </div>
            </div>
    `;
    },

    renderChannelStats: () => {
        const channels = ['Mail', 'Tel', 'Whatsapp', 'Walk-in', 'OTA', 'Otro'];
        const data = channels.map(c => {
            const res = Store.reservations.filter(r => (r.source === c || r.channel === c) && r.status !== 'cancelada');
            const rev = res.reduce((sum, r) => sum + r.total, 0);
            return { name: c, count: res.length, revenue: rev };
        }).sort((a, b) => b.revenue - a.revenue);

        return `
    <table class="nexus-table" >
                <thead><tr><th>Canal</th><th>Res.</th><th>Total</th><th>Mix %</th></tr></thead>
                <tbody>
                    ${data.filter(d => d.count > 0).map(d => `
                        <tr>
                            <td><strong>${d.name}</strong></td>
                            <td>${d.count}</td>
                            <td>${Utils.formatCurrency(d.revenue)}</td>
                            <td>${Math.round((d.revenue / (Store.reservations.reduce((s, r) => s + r.total, 0) || 1)) * 100)}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
    `;
    },

    showIWantToMenu: (resId, event) => {
        event.stopPropagation();
        const existing = document.getElementById('context-menu');
        if (existing) existing.remove();

        const trigger = event.currentTarget;
        const rect = trigger.getBoundingClientRect();

        const menu = document.createElement('div');
        menu.id = 'context-menu';
        menu.className = 'glass context-menu anim-fade-in';
        menu.style.position = 'fixed';
        menu.style.bottom = `${window.innerHeight - rect.top + 10}px`;
        menu.style.left = `${rect.left + (rect.width / 2)}px`;
        menu.style.transform = 'translateX(-50%)';
        menu.style.zIndex = '2000';
        menu.style.padding = '0.5rem';
        menu.style.minWidth = '220px';
        menu.style.borderRadius = '12px';
        menu.style.border = '1px solid var(--border-color)';
        menu.style.background = 'rgba(15, 23, 42, 0.98)';
        menu.style.boxShadow = '0 20px 40px rgba(0,0,0,0.6)';

        const actions = [
            { icon: 'calendar-number-outline', label: 'Cambiar Fechas', action: () => UI.switchToEditMode(resId) },
            {
                icon: 'duplicate-outline',
                label: 'Duplicar Reserva',
                action: () => {
                    const r = Store.reservations.find(x => x.id === resId);
                    if (r) {
                        const newRes = { ...r };
                        delete newRes.id;
                        Store.addReservation(newRes);
                        alert('Reserva duplicada correctamente.');
                    }
                }
            },
            { icon: 'receipt-outline', label: 'Generar Proforma', action: () => Utils.exportProforma(resId) },
            {
                icon: 'trash-outline',
                label: 'Eliminar Reserva',
                class: 'text-danger',
                action: () => {
                    if (confirm('¿Borrar esta reserva permanentemente?')) {
                        Store.reservations = Store.reservations.filter(r => r.id !== resId);
                        Store.notify();
                        closeModal();
                    }
                }
            }
        ];

        actions.forEach(a => {
            const item = document.createElement('div');
            item.className = `menu-item ${a.class || ''}`;
            item.style.cssText = 'padding:0.75rem 1rem; cursor:pointer; display:flex; align-items:center; gap:0.8rem; font-size:0.9rem; transition: background 0.2s; border-radius:8px; color:#fff;';
            item.innerHTML = `<ion-icon name="${a.icon}" style="font-size:1.1rem; opacity:0.8;"></ion-icon><span style="font-weight:500;">${a.label}</span>`;

            item.onclick = () => {
                a.action();
                UI.closeContextMenu();
            };

            item.onmouseenter = () => item.style.background = 'rgba(255,255,255,0.08)';
            item.onmouseleave = () => item.style.background = 'transparent';

            menu.appendChild(item);
        });

        document.body.appendChild(menu);

        setTimeout(() => {
            window.addEventListener('click', UI.closeContextMenu, { once: true });
        }, 10);
    },

    closeContextMenu: () => {
        const existing = document.getElementById('context-menu');
        if (existing) existing.remove();
    },

    openRatePlanModal: (planId) => {
        const plan = planId ? Store.ratePlans.find(p => p.id === planId) : {
            name: '', multiplier: 1, minNights: 1, refundable: true,
            breakfast: true, cancelPolicy: 'Normal', conditions: []
        };

        const html = `
    <div class="modal-content glass anim-pop" >
                <div class="modal-header">
                    <h2>${planId ? 'Editar Plan Tarifario' : 'Nuevo Plan Tarifario'}</h2>
                    <button class="close-modal" onclick="closeSecondaryModal()">×</button>
                </div>
                <form id="rate-entry-form" onsubmit="UI.saveRatePlan(event, '${planId || ''}')">
                    <div class="form-grid">
                        <div class="form-group" style="grid-column: span 2;">
                            <label>Nombre del Plan</label>
                            <input type="text" id="planName" value="${plan.name}" required>
                        </div>
                        <div class="form-group">
                            <label>Multiplicador (%)</label>
                            <input type="number" id="planMult" value="${plan.multiplier * 100}" step="1" required>
                        </div>
                        <div class="form-group">
                            <label>Mínimo Noches</label>
                            <input type="number" id="planMin" value="${plan.minNights}" min="1">
                        </div>
                        <div class="form-group">
                            <label>Refundable</label>
                            <select id="planRef">
                                <option value="true" ${plan.refundable ? 'selected' : ''}>Sí</option>
                                <option value="false" ${!plan.refundable ? 'selected' : ''}>No</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Desayuno</label>
                            <select id="planBrk">
                                <option value="true" ${plan.breakfast ? 'selected' : ''}>Incluido</option>
                                <option value="false" ${!plan.breakfast ? 'selected' : ''}>No incluido</option>
                            </select>
                        </div>
                        <div class="form-group" style="grid-column: span 2;">
                            <label>Condiciones Adicionales (Una por línea)</label>
                            <textarea id="planCond" placeholder="ej: Late Check-out sujeto a disp.&#10;Incluye Estacionamiento" style="min-height:80px;">${(plan.conditions || []).join('\n')}</textarea>
                        </div>
                    </div>
                    <div class="modal-footer" style="margin-top:2rem">
                        <button type="button" class="btn btn-secondary" onclick="closeSecondaryModal()">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Guardar Cambios</button>
                    </div>
                </form>
            </div>
    `;
        const modal = document.createElement('div');
        modal.id = 'secondary-modal';
        modal.className = 'modal-backdrop';
        modal.innerHTML = html;
        document.body.appendChild(modal);
    },

    saveRatePlan: (e, planId) => {
        e.preventDefault();
        const data = {
            name: document.getElementById('planName').value,
            multiplier: parseFloat(document.getElementById('planMult').value) / 100,
            minNights: parseInt(document.getElementById('planMin').value),
            refundable: document.getElementById('planRef').value === 'true',
            breakfast: document.getElementById('planBrk').value === 'true',
            conditions: document.getElementById('planCond').value.split('\n').filter(line => line.trim() !== '')
        };

        if (planId) {
            Store.updateRatePlan(planId, data);
        } else {
            Store.ratePlans.push({ ...data, id: Utils.generateId() });
            Store.notify();
        }
        closeSecondaryModal();
    },

    renderPreferences: () => {
        const container = document.getElementById('view-content');
        const theme = Store.settings.theme;
        const hotel = Store.hotelInfo;

        container.innerHTML = `
    <div class="view-header" >
                <h2>Ajustes & Configuración</h2>
                <button class="btn btn-primary" onclick="UI.saveAllSettings()">Guardar Todos los Cambios</button>
            </div>

    <div style="display:grid; grid-template-columns: 1.2fr 1fr; gap:2rem;">
        <div class="glass" style="padding:2rem;">
            <h3 style="margin-bottom:1.5rem"><ion-icon name="business-outline"></ion-icon> Datos del Establecimiento</h3>
            <div class="form-grid">
                <div class="form-group" style="grid-column: span 2;">
                    <label>Nombre del Hotel</label>
                    <input type="text" id="pref-hotelName" value="${hotel.name}">
                </div>
                <div class="form-group">
                    <label>Email de Contacto</label>
                    <input type="email" id="pref-hotelEmail" value="${hotel.email}">
                </div>
                <div class="form-group">
                    <label>WhatsApp / Teléfono</label>
                    <input type="text" id="pref-hotelPhone" value="${hotel.phone}">
                </div>
                <div class="form-group" style="grid-column: span 2;">
                    <label>Dirección Física</label>
                    <input type="text" id="pref-hotelAddress" value="${hotel.address}">
                </div>
            </div>

            <h3 style="margin-top:3rem; margin-bottom:1.5rem"><ion-icon name="chatbubble-ellipses-outline"></ion-icon> Plantilla de Confirmación</h3>
            <p style="font-size:0.8rem; opacity:0.6; margin-bottom:1rem;">
                Usa etiquetas como {firstName}, {lastName}, {resId}, {total}, {checkin}, {checkout}, {roomName} para personalizar el mensaje.
            </p>
            <textarea id="pref-confirmationTemplate" style="width:100%; min-height:300px; font-family:monospace; font-size:0.85rem; padding:1rem; background:rgba(0,0,0,0.2); border-radius:12px; line-height:1.5;">${hotel.confirmationTemplate}</textarea>
        </div>

            <h3 style="margin-top:2rem; margin-bottom:1.5rem"><ion-icon name="document-text-outline"></ion-icon> Disclaimer de Proforma (PDF)</h3>
            <textarea id="pref-proformaDisclaimer" style="width:100%; min-height:100px; font-size:0.85rem; padding:1rem; background:rgba(0,0,0,0.2); border-radius:12px; line-height:1.5;">${hotel.proformaDisclaimer}</textarea>
        </div>

        <div class="settings-sidebar" style="display:flex; flex-direction:column; gap:2rem;">
            <div class="glass" style="padding:2rem;">
                <h3 style="margin-bottom:1.5rem"><ion-icon name="bed-outline"></ion-icon> Inventario de Habitaciones</h3>
                <p style="font-size:0.8rem; opacity:0.6; margin-bottom:1.5rem;">Configura tus categorías y la cantidad de habitaciones de cada una.</p>
                
                <div id="pref-room-categories" style="display:flex; flex-direction:column; gap:1rem;">
                    ${Store.roomTypes.map(type => {
            const rooms = Store.rooms.filter(r => r.typeId === type.id);
            return `
                            <div class="glass" style="padding:1rem; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05);">
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.8rem;">
                                    <strong style="color:var(--accent-cyan)">${type.name}</strong>
                                    <div style="display:flex; gap:0.4rem;">
                                        <button class="btn btn-secondary btn-sm" onclick="UI.openRoomTypeModal('${type.id}')" style="padding:0.2rem 0.5rem;"><ion-icon name="create-outline"></ion-icon></button>
                                        <button class="btn btn-danger btn-sm" onclick="UI.deleteRoomType('${type.id}')" style="padding:0.2rem 0.5rem;"><ion-icon name="trash-outline"></ion-icon></button>
                                    </div>
                                </div>
                                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.8rem; font-size:0.8rem;">
                                    <div>
                                        <label style="font-size:0.65rem">Capacidad</label>
                                        <div>${type.capacity} Pax</div>
                                    </div>
                                    <div>
                                        <label style="font-size:0.65rem">Base USD</label>
                                        <div>${Utils.formatCurrency(type.baseRate)}</div>
                                    </div>
                                    <div style="grid-column: span 2; margin-top:0.8rem;">
                                        <label style="font-size:0.65rem">Habitaciones (${rooms.length})</label>
                                        <div style="display:flex; flex-wrap:wrap; gap:0.4rem; margin-top:0.4rem;">
                                            ${rooms.map(r => `
                                                <div class="room-edit-pill" onclick="UI.editRoomName('${r.id}')" style="
                                                    display:flex; align-items:center; gap:0.3rem; 
                                                    background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); 
                                                    padding:0.2rem 0.5rem; border-radius:6px; cursor:pointer; font-size:0.75rem;
                                                    transition:all 0.2s;
                                                " onmouseover="this.style.borderColor='var(--accent-cyan)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.1)'">
                                                    <span>${r.name}</span>
                                                    <ion-icon name="pencil" style="font-size:0.6rem; opacity:0.5;"></ion-icon>
                                                </div>
                                            `).join('')}
                                            <button class="btn btn-secondary" style="padding:0.1rem 0.5rem; min-height:auto; height:24px; font-size:0.7rem;" onclick="UI.updateRoomCount('${type.id}', ${rooms.length + 1})">
                                                <ion-icon name="add"></ion-icon>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
        }).join('')}
                </div>
                
                <button class="btn btn-secondary" style="width:100%; margin-top:1.5rem;" onclick="UI.openRoomTypeModal()">
                    <ion-icon name="add-outline"></ion-icon> Agregar Categoría
                </button>
            </div>

            <div class="glass" style="padding:2rem;">
                <h3 style="margin-bottom:1.5rem">Tema Visual</h3>
                <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:1rem;">
                    <div class="theme-card ${theme === 'light' ? 'active' : ''}" onclick="Store.setTheme('light')" style="cursor:pointer; text-align:center; padding:1rem; border-radius:10px; border:2px solid ${theme === 'light' ? 'var(--accent-cyan)' : 'transparent'}; background:#fff; color:#000;">
                        <ion-icon name="sunny-outline" style="font-size:1.5rem"></ion-icon>
                        <div style="font-size:0.75rem; font-weight:700; margin-top:0.5rem">Claro</div>
                    </div>
                    <div class="theme-card ${theme === 'medium' ? 'active' : ''}" onclick="Store.setTheme('medium')" style="cursor:pointer; text-align:center; padding:1rem; border-radius:10px; border:2px solid ${theme === 'medium' ? 'var(--accent-cyan)' : 'transparent'}; background:#2c2c2e; color:#fff;">
                        <ion-icon name="contrast-outline" style="font-size:1.5rem"></ion-icon>
                        <div style="font-size:0.75rem; font-weight:700; margin-top:0.5rem">Medio</div>
                    </div>
                    <div class="theme-card ${theme === 'dark' ? 'active' : ''}" onclick="Store.setTheme('dark')" style="cursor:pointer; text-align:center; padding:1rem; border-radius:10px; border:2px solid ${theme === 'dark' ? 'var(--accent-cyan)' : 'transparent'}; background:#05070a; color:#fff;">
                        <ion-icon name="moon-outline" style="font-size:1.5rem"></ion-icon>
                        <div style="font-size:0.75rem; font-weight:700; margin-top:0.5rem">Oscuro</div>
                    </div>
                </div>
            </div>

            <div class="glass" style="padding:1.5rem; border-left: 4px solid var(--accent-gold)">
                <strong style="color:var(--accent-gold)">Tip de Operación</strong>
                <p style="margin-top:0.5rem; font-size:0.85rem; line-height:1.4">
                    Etiquetas para plantillas: <strong>{firstName}, {lastName}, {resId}, {total}, {checkin}, {checkout}, {roomName}</strong>.
                </p>
            </div>
        </div>
    </div>
`;
    },

    saveAllSettings: () => {
        const data = {
            name: document.getElementById('pref-hotelName').value,
            email: document.getElementById('pref-hotelEmail').value,
            phone: document.getElementById('pref-hotelPhone').value,
            address: document.getElementById('pref-hotelAddress').value,
            confirmationTemplate: document.getElementById('pref-confirmationTemplate').value,
            proformaDisclaimer: document.getElementById('pref-proformaDisclaimer').value
        };

        Store.updateHotelInfo(data);
        alert('✨ Configuración guardada correctamente.');
    },

    // --- RECENTLY ADDED: Room Management Logic ---
    openRoomTypeModal: (typeId = null) => {
        const type = typeId ? Store.getRoomType(typeId) : { name: '', capacity: 2, baseRate: 100, color: '#3b82f6' };
        const isNew = !typeId;

        const html = `
            <div class="modal-content glass anim-scale-in" style="max-width:400px;">
                <div class="modal-header">
                    <h3>${isNew ? 'Nueva Categoría' : 'Editar Categoría'}</h3>
                    <button class="close-btn" onclick="closeSecondaryModal()">&times;</button>
                </div>
                <form onsubmit="UI.saveRoomType(event, ${typeId ? `'${typeId}'` : 'null'})" style="margin-top:1.5rem;">
                    <div class="form-group">
                        <label>Nombre de Categoría</label>
                        <input type="text" id="rt-name" value="${type.name}" required placeholder="ej: Junior Suite">
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                        <div class="form-group">
                            <label>Capacidad (Pax)</label>
                            <input type="number" id="rt-capacity" value="${type.capacity}" min="1" required>
                        </div>
                        <div class="form-group">
                            <label>Tarifa Base (USD)</label>
                            <input type="number" id="rt-rate" value="${type.baseRate}" min="0" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Color en Rack</label>
                        <input type="color" id="rt-color" value="${type.color}" style="height:45px; padding:4px;">
                    </div>
                    <div class="modal-footer" style="padding-bottom:0;">
                        <button type="button" class="btn btn-secondary" onclick="closeSecondaryModal()">Cancelar</button>
                        <button type="submit" class="btn btn-primary">${isNew ? 'Crear' : 'Actualizar'}</button>
                    </div>
                </form>
            </div>
        `;
        const modal = document.createElement('div');
        modal.id = 'secondary-modal';
        modal.className = 'modal-backdrop';
        modal.innerHTML = html;
        document.body.appendChild(modal);
    },

    saveRoomType: (e, id) => {
        e.preventDefault();
        const data = {
            name: document.getElementById('rt-name').value,
            capacity: parseInt(document.getElementById('rt-capacity').value),
            baseRate: parseFloat(document.getElementById('rt-rate').value),
            color: document.getElementById('rt-color').value
        };

        if (id) {
            const index = Store.roomTypes.findIndex(t => t.id === id);
            if (index !== -1) Store.roomTypes[index] = { ...Store.roomTypes[index], ...data };
        } else {
            const newId = Utils.generateId().slice(0, 3).toLowerCase();
            Store.roomTypes.push({ ...data, id: newId });
        }

        Store.notify();
        closeSecondaryModal();
        UI.renderPreferences();
    },

    deleteRoomType: (id) => {
        const rooms = Store.rooms.filter(r => r.typeId === id);
        if (rooms.length > 0) {
            alert('No se puede eliminar una categoría que tiene habitaciones asignadas. Primero reduce la cantidad de habitaciones a 0.');
            return;
        }
        if (confirm('¿Estás seguro de eliminar esta categoría?')) {
            Store.roomTypes = Store.roomTypes.filter(t => t.id !== id);
            Store.notify();
            UI.renderPreferences();
        }
    },

    updateRoomCount: (typeId, newCount) => {
        if (newCount < 0) return;

        const currentRooms = Store.rooms.filter(r => r.typeId === typeId);
        const diff = newCount - currentRooms.length;

        if (diff > 0) {
            // Add rooms
            for (let i = 0; i < diff; i++) {
                // Find highest name to continue sequence if possible
                const lastRoom = Store.rooms.sort((a, b) => b.name.localeCompare(a.name, undefined, { numeric: true }))[0];
                const nextName = (parseInt(lastRoom ? lastRoom.name : '100') + 1).toString();
                // Ensure ID is unique
                const id = 'room-' + Utils.generateId().slice(0, 4);
                Store.rooms.push({ id, name: nextName, typeId, status: 'clean' });
            }
        } else if (diff < 0) {
            // Remove the last one of that type
            const toRemove = Store.rooms.filter(r => r.typeId === typeId).pop();
            if (toRemove) {
                Store.rooms = Store.rooms.filter(r => r.id !== toRemove.id);
            }
        }

        Store.notify();
        UI.renderPreferences();
    },

    editRoomName: (roomId) => {
        const room = Store.getRoom(roomId);
        if (!room) return;

        const newName = prompt('Ingrese el nuevo nombre/número para la habitación:', room.name);
        if (newName && newName.trim() !== '' && newName !== room.name) {
            const exists = Store.rooms.some(r => r.name.toLowerCase() === newName.trim().toLowerCase());
            if (exists) {
                if (!confirm('Ya existe una habitación con ese nombre. ¿Quieres continuar?')) return;
            }
            room.name = newName.trim();
            Store.notify();
            UI.renderPreferences();
        }
    },

    // ─────────────────────────────────────────────────────────────────────────
    // GUEST PROFILE — FICHA DE HUÉSPED
    // ─────────────────────────────────────────────────────────────────────────

    openGuestProfileModal: (guestId = null, resId = null) => {
        // Resolve guest: by guestId OR by matching reservation data
        let guest = null;
        let res = resId ? Store.reservations.find(r => r.id === resId) : null;

        if (guestId) {
            guest = Store.guests.find(g => g.id === guestId);
        } else if (res && res.guestId) {
            guest = Store.guests.find(g => g.id === res.guestId);
        } else if (res) {
            // Try to find by name match
            const matches = Store.findGuestsByName(`${res.firstName} ${res.lastName}`);
            if (matches.length === 1) guest = matches[0];
        }

        // Pre-fill from reservation if new guest
        const prefill = guest || {
            firstName: res?.firstName || '',
            lastName: res?.lastName || '',
            email: res?.email || '',
            phone: res?.phone || '',
            docType: 'DNI', docNumber: '',
            nationality: 'AR', birthDate: '',
            address: '', city: '', country: 'AR',
            preferences: '', flags: [], companions: [], notes: ''
        };

        const gId = guest?.id || null;
        const resHistory = gId ? Store.getGuestReservations(gId) : (res ? [res] : []);
        const isNew = !guest;
        const COUNTRIES = ['AR', 'UY', 'BR', 'CL', 'PY', 'BO', 'PE', 'CO', 'VE', 'MX', 'US', 'ES', 'IT', 'FR', 'DE', 'GB', 'PT', 'CN', 'JP', 'AU'];

        // Build companions HTML
        const companionsHtml = (prefill.companions || []).map((c, i) => `
            <div class="companion-row glass anim-fade-in" data-idx="${i}" style="padding:0.8rem 1rem; border-left:3px solid var(--border-color); display:grid; grid-template-columns:1fr 1fr 120px 30px; gap:0.6rem; align-items:center;">
                <input type="text" class="comp-name" placeholder="Nombre completo" value="${c.name || ''}" style="font-size:0.85rem; padding:0.4rem 0.6rem;">
                <input type="text" class="comp-doc" placeholder="DNI / Pasaporte" value="${c.doc || ''}" style="font-size:0.85rem; padding:0.4rem 0.6rem;">
                <input type="text" class="comp-rel" placeholder="Relación" value="${c.relation || ''}" style="font-size:0.85rem; padding:0.4rem 0.6rem;">
                <button type="button" onclick="this.closest('.companion-row').remove()" style="background:transparent;border:none;color:var(--accent-red);cursor:pointer;font-size:1.2rem;">×</button>
            </div>`).join('');

        // Build stay history HTML
        const historyHtml = resHistory.length === 0 ? `<p style="opacity:0.5; font-size:0.85rem;">Sin estadías previas registradas.</p>` :
            resHistory.map(r => {
                const nights = Utils.calculateStay(r.checkin, r.checkout);
                const type = Store.getRoomType(r.roomTypeId);
                return `<div style="display:flex; justify-content:space-between; align-items:center; padding:0.6rem 0; border-bottom:1px solid var(--border-color); font-size:0.85rem;">
                    <div>
                        <strong>#${r.id}</strong> — ${Utils.formatDate(r.checkin)} → ${Utils.formatDate(r.checkout)}
                        <span style="opacity:0.5; margin-left:0.5rem;">${nights} noches · ${type?.name || r.roomTypeId}</span>
                    </div>
                    <div style="display:flex;gap:0.8rem;align-items:center;">
                        <strong style="color:var(--accent-cyan);">${Utils.formatCurrency(r.total || 0)}</strong>
                        <span class="status-pill status-${r.status}" style="font-size:0.65rem;">${r.status}</span>
                    </div>
                </div>`;
            }).join('');

        const totalSpend = resHistory.filter(r => r.status !== 'cancelada').reduce((s, r) => s + (r.total || 0), 0);

        const m = document.getElementById('secondary-modal');
        if (m) m.remove();
        const modal = document.createElement('div');
        modal.id = 'secondary-modal';
        modal.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:2000;display:flex;align-items:center;justify-content:center;padding:1rem;`;
        modal.innerHTML = `
            <div class="glass" style="width:min(860px,95vw);max-height:90vh;overflow-y:auto;border-radius:20px;border:1px solid rgba(212,175,55,0.3);box-shadow:0 0 60px rgba(212,175,55,0.1);">
                <!-- Header -->
                <div style="padding:1.5rem 2rem; background:rgba(0,0,0,0.3); border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center; position:sticky;top:0;z-index:10;backdrop-filter:blur(20px);">
                    <div style="display:flex;align-items:center;gap:1rem;">
                        <div style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,var(--accent-gold),#b8860b);display:flex;align-items:center;justify-content:center;font-size:1.2rem;">👤</div>
                        <div>
                            <div style="font-size:0.65rem;text-transform:uppercase;letter-spacing:1px;opacity:0.5;">${isNew ? 'NUEVA FICHA DE HUÉSPED' : 'PERFIL DE HUÉSPED · ' + (gId || '')}</div>
                            <h3 style="margin:0;font-size:1.2rem;">${isNew ? 'Registrar Nuevo Huésped' : prefill.firstName + ' ' + prefill.lastName}</h3>
                        </div>
                    </div>
                    <div style="display:flex;gap:0.5rem;">
                        <button type="button" class="btn btn-secondary btn-sm" onclick="UI.printGuestRegistrationCard('${gId}','${resId || ''}')" title="Imprimir Hoja de Registro">
                            <ion-icon name="print-outline"></ion-icon> IMPRIMIR
                        </button>
                        <button type="button" onclick="closeSecondaryModal()" style="background:transparent;border:none;color:var(--text-primary);font-size:1.5rem;cursor:pointer;line-height:1;">×</button>
                    </div>
                </div>

                <form id="guest-profile-form" onsubmit="UI.saveGuestProfile(event, '${gId}', '${resId || ''}')" style="padding:2rem;">
                    <!-- Identity -->
                    <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:1px;color:var(--accent-gold);font-weight:800;margin-bottom:1rem;">📋 Datos Personales</div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem;">
                        <div class="form-group"><label>Nombre *</label><input type="text" id="gp-firstName" value="${prefill.firstName}" required></div>
                        <div class="form-group"><label>Apellido *</label><input type="text" id="gp-lastName" value="${prefill.lastName}" required></div>
                        <div class="form-group">
                            <label>Tipo de Doc.</label>
                            <select id="gp-docType">
                                <option value="DNI" ${prefill.docType === 'DNI' ? 'selected' : ''}>DNI</option>
                                <option value="Pasaporte" ${prefill.docType === 'Pasaporte' ? 'selected' : ''}>Pasaporte</option>
                                <option value="LE" ${prefill.docType === 'LE' ? 'selected' : ''}>L.E.</option>
                                <option value="CE" ${prefill.docType === 'CE' ? 'selected' : ''}>Cédula</option>
                            </select>
                        </div>
                        <div class="form-group"><label>Número de Documento *</label><input type="text" id="gp-docNumber" value="${prefill.docNumber || ''}" required placeholder="ej: 35.123.456"></div>
                        <div class="form-group">
                            <label>Nacionalidad</label>
                            <select id="gp-nationality">
                                ${COUNTRIES.map(c => `<option value="${c}" ${prefill.nationality === c ? 'selected' : ''}>${c}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group"><label>Fecha de Nacimiento</label><input type="date" id="gp-birthDate" value="${prefill.birthDate || ''}"></div>
                        <div class="form-group"><label>Email</label><input type="email" id="gp-email" value="${prefill.email || ''}" placeholder="correo@mail.com"></div>
                        <div class="form-group"><label>Teléfono / WhatsApp</label><input type="text" id="gp-phone" value="${prefill.phone || ''}" placeholder="+54 9 11..."></div>
                        <div class="form-group" style="grid-column:span 2;"><label>Domicilio</label><input type="text" id="gp-address" value="${prefill.address || ''}" placeholder="Calle, número, piso..."></div>
                        <div class="form-group"><label>Ciudad</label><input type="text" id="gp-city" value="${prefill.city || ''}"></div>
                        <div class="form-group">
                            <label>País</label>
                            <select id="gp-country">
                                ${COUNTRIES.map(c => `<option value="${c}" ${prefill.country === c ? 'selected' : ''}>${c}</option>`).join('')}
                            </select>
                        </div>
                    </div>

                    <!-- Preferences -->
                    <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:1px;color:var(--accent-gold);font-weight:800;margin-bottom:1rem;">⭐ Preferencias & Notas Internas</div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem;">
                        <div class="form-group"><label>Preferencias</label><textarea id="gp-preferences" rows="2" style="resize:vertical;">${prefill.preferences || ''}</textarea></div>
                        <div class="form-group"><label>Notas Internas</label><textarea id="gp-notes" rows="2" style="resize:vertical;">${prefill.notes || ''}</textarea></div>
                        <div class="form-group" style="grid-column:span 2;">
                            <label>Etiquetas</label>
                            <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
                                ${['VIP', 'Frecuente', 'Corporativo', 'Grupo', 'Pet Friendly', 'Necesidades Especiales'].map(f => `
                                    <label style="display:flex;gap:0.3rem;align-items:center;cursor:pointer;background:rgba(255,255,255,0.05);padding:0.3rem 0.7rem;border-radius:50px;border:1px solid var(--border-color);font-size:0.75rem;">
                                        <input type="checkbox" class="gp-flag" value="${f}" ${(prefill.flags || []).includes(f) ? 'checked' : ''} style="width:12px;height:12px;"> ${f}
                                    </label>`).join('')}
                            </div>
                        </div>
                    </div>

                    <!-- Companions -->
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
                        <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:1px;color:var(--accent-gold);font-weight:800;">👥 Acompañantes</div>
                        <button type="button" class="btn btn-secondary btn-sm" onclick="UI.addCompanionRow()" style="font-size:0.7rem;">
                            <ion-icon name="add-outline"></ion-icon> AGREGAR ACOMPAÑANTE
                        </button>
                    </div>
                    <div id="companions-container" style="display:flex;flex-direction:column;gap:0.5rem;margin-bottom:0.5rem;">
                        ${companionsHtml || '<div style="opacity:0.4;font-size:0.85rem;padding:0.5rem 0;">Sin acompañantes registrados.</div>'}
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr 120px;gap:0.4rem;padding:0.3rem 1rem;font-size:0.65rem;opacity:0.4;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:1.5rem;">
                        <span>Nombre</span><span>Doc.</span><span>Relación</span>
                    </div>

                    <!-- Stay History -->
                    ${resHistory.length > 0 ? `
                    <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:1px;color:var(--accent-gold);font-weight:800;margin-bottom:1rem;">🏨 Historial de Estadías (${resHistory.length})</div>
                    <div class="glass" style="padding:1rem;margin-bottom:1.5rem;">
                        <div style="display:flex;gap:2rem;margin-bottom:1rem;padding-bottom:0.8rem;border-bottom:1px solid var(--border-color);">
                            <div style="text-align:center;">
                                <div style="font-size:1.8rem;font-weight:800;color:var(--accent-cyan);">${resHistory.filter(r => r.status !== 'cancelada').length}</div>
                                <div style="font-size:0.65rem;opacity:0.5;">Estadías</div>
                            </div>
                            <div style="text-align:center;">
                                <div style="font-size:1.8rem;font-weight:800;color:var(--accent-gold);">${Utils.formatCurrency(totalSpend)}</div>
                                <div style="font-size:0.65rem;opacity:0.5;">Gasto Total</div>
                            </div>
                        </div>
                        ${historyHtml}
                    </div>` : ''}

                    <!-- Footer buttons -->
                    <div style="display:flex;justify-content:flex-end;gap:1rem;padding-top:1rem;border-top:1px solid var(--border-color);">
                        <button type="button" class="btn btn-secondary" onclick="closeSecondaryModal()">CANCELAR</button>
                        <button type="submit" class="btn btn-primary" style="min-width:160px;">
                            <ion-icon name="save-outline"></ion-icon> ${isNew ? 'CREAR PERFIL' : 'GUARDAR CAMBIOS'}
                        </button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', e => { if (e.target === modal) closeSecondaryModal(); });
    },

    saveGuestProfile: (e, guestId, resId) => {
        e.preventDefault();
        const get = id => document.getElementById(id)?.value?.trim() || '';
        const flags = [...document.querySelectorAll('.gp-flag:checked')].map(el => el.value);
        const companions = [...document.querySelectorAll('.companion-row')].map(row => ({
            name: row.querySelector('.comp-name')?.value?.trim() || '',
            doc: row.querySelector('.comp-doc')?.value?.trim() || '',
            relation: row.querySelector('.comp-rel')?.value?.trim() || ''
        })).filter(c => c.name);

        const data = {
            firstName: get('gp-firstName'),
            lastName: get('gp-lastName'),
            docType: get('gp-docType'),
            docNumber: get('gp-docNumber'),
            nationality: get('gp-nationality'),
            birthDate: get('gp-birthDate'),
            email: get('gp-email'),
            phone: get('gp-phone'),
            address: get('gp-address'),
            city: get('gp-city'),
            country: get('gp-country'),
            preferences: document.getElementById('gp-preferences')?.value?.trim() || '',
            notes: document.getElementById('gp-notes')?.value?.trim() || '',
            flags, companions
        };

        let savedGuestId = guestId;
        if (guestId && guestId !== 'null') {
            Store.updateGuest(guestId, data);
        } else {
            savedGuestId = Store.addGuest(data);
        }

        // Link guest to reservation
        if (resId && resId !== '') {
            Store.updateReservation(resId, { guestId: savedGuestId });
        }

        closeSecondaryModal();
        alert(`✅ Perfil de "${data.firstName} ${data.lastName}" guardado correctamente.`);
    },

    addCompanionRow: () => {
        const container = document.getElementById('companions-container');
        if (!container) return;
        // Clear placeholder text if present
        const placeholder = container.querySelector('div:not(.companion-row)');
        if (placeholder) placeholder.remove();

        const row = document.createElement('div');
        row.className = 'companion-row glass anim-fade-in';
        row.style.cssText = 'padding:0.8rem 1rem;border-left:3px solid var(--border-color);display:grid;grid-template-columns:1fr 1fr 120px 30px;gap:0.6rem;align-items:center;';
        row.innerHTML = `
            <input type="text" class="comp-name" placeholder="Nombre completo" style="font-size:0.85rem;padding:0.4rem 0.6rem;">
            <input type="text" class="comp-doc" placeholder="DNI / Pasaporte" style="font-size:0.85rem;padding:0.4rem 0.6rem;">
            <input type="text" class="comp-rel" placeholder="Relación" style="font-size:0.85rem;padding:0.4rem 0.6rem;">
            <button type="button" onclick="this.closest('.companion-row').remove()" style="background:transparent;border:none;color:var(--accent-red);cursor:pointer;font-size:1.2rem;">×</button>
        `;
        container.appendChild(row);
    },

    printGuestRegistrationCard: (guestId, resId) => {
        const guest = guestId && guestId !== 'null' ? Store.guests.find(g => g.id === guestId) : null;
        const res = resId && resId !== '' ? Store.reservations.find(r => r.id === resId) : null;
        const hotel = Store.hotelInfo;

        // Collect current form values if modal is open
        const get = id => document.getElementById(id)?.value?.trim() || '';
        const formOpen = !!document.getElementById('gp-firstName');
        const d = formOpen ? {
            firstName: get('gp-firstName'),
            lastName: get('gp-lastName'),
            docType: get('gp-docType'),
            docNumber: get('gp-docNumber'),
            nationality: get('gp-nationality'),
            birthDate: get('gp-birthDate'),
            email: get('gp-email'),
            phone: get('gp-phone'),
            address: get('gp-address'),
            city: get('gp-city'),
            country: get('gp-country'),
            preferences: document.getElementById('gp-preferences')?.value || '',
            flags: [...document.querySelectorAll('.gp-flag:checked')].map(el => el.value),
            companions: [...document.querySelectorAll('.companion-row')].map(row => ({
                name: row.querySelector('.comp-name')?.value || '',
                doc: row.querySelector('.comp-doc')?.value || '',
                relation: row.querySelector('.comp-rel')?.value || ''
            })).filter(c => c.name)
        } : (guest || {});

        const nights = res ? Utils.calculateStay(res.checkin, res.checkout) : '—';
        const today = Utils.formatDate(new Date());

        const w = window.open('', '_blank');
        w.document.write(`<!DOCTYPE html><html lang="es"><head>
            <meta charset="UTF-8">
            <title>Hoja de Registro — ${d.firstName} ${d.lastName}</title>
            <style>
                * { margin:0; padding:0; box-sizing:border-box; }
                body { font-family: 'Arial', sans-serif; font-size: 11pt; color: #111; background: #fff; padding: 2cm; }
                h1 { font-size: 18pt; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 0.2cm; }
                h2 { font-size: 11pt; font-weight: normal; color: #555; margin-bottom: 0.8cm; border-bottom: 1px solid #ccc; padding-bottom: 0.3cm; }
                .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.4cm 1cm; margin-bottom: 0.8cm; }
                .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.4cm 1cm; margin-bottom: 0.8cm; }
                .field { margin-bottom: 0.3cm; }
                .field label { font-size: 8pt; text-transform: uppercase; letter-spacing: 0.5px; color: #888; display: block; margin-bottom: 0.05cm; }
                .field .value { font-size: 11pt; font-weight: 600; border-bottom: 1px solid #ddd; padding: 0.1cm 0; min-height: 0.7cm; }
                .section-title { font-size: 8pt; text-transform: uppercase; letter-spacing: 1px; font-weight: 800; color: #333; margin: 0.6cm 0 0.3cm; border-left: 3px solid #111; padding-left: 0.3cm; }
                .companions-table { width: 100%; border-collapse: collapse; font-size: 10pt; margin-bottom: 0.8cm; }
                .companions-table th { background: #f0f0f0; padding: 0.2cm 0.3cm; text-align: left; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.5px; }
                .companions-table td { padding: 0.2cm 0.3cm; border-bottom: 1px solid #eee; }
                .signature-box { border: 1px solid #ccc; border-radius: 4px; height: 3cm; margin-top: 0.3cm; display: flex; align-items: flex-end; padding: 0.2cm; font-size: 8pt; color: #888; }
                .footer { margin-top: 1cm; font-size: 8pt; color: #888; text-align: center; border-top: 1px solid #eee; padding-top: 0.5cm; }
                .flags { display: flex; gap: 0.3cm; flex-wrap: wrap; margin-top: 0.1cm; }
                .flag { background: #111; color: #fff; font-size: 7pt; padding: 0.05cm 0.2cm; border-radius: 3px; }
                @media print { body { padding: 1.5cm; } }
            </style>
        </head><body>
            <h1>${hotel.name}</h1>
            <h2>HOJA DE REGISTRO DE HUÉSPED</h2>

            <div style="display:flex;justify-content:space-between;margin-bottom:0.5cm;">
                <div style="font-size:9pt;color:#555;">Fecha de Emisión: <strong>${today}</strong></div>
                ${res ? `<div style="font-size:9pt;color:#555;">Reserva N°: <strong>${res.id}</strong></div>` : ''}
            </div>

            ${res ? `
            <div class="section-title">Datos de la Estadía</div>
            <div class="grid-3">
                <div class="field"><label>Check-in</label><div class="value">${Utils.formatDate(res.checkin)}</div></div>
                <div class="field"><label>Check-out</label><div class="value">${Utils.formatDate(res.checkout)}</div></div>
                <div class="field"><label>Noches</label><div class="value">${nights}</div></div>
                <div class="field"><label>Habitación</label><div class="value">${res.roomId !== 'unassigned' ? 'Hab. ' + res.roomId : 'Sin Asignar'}</div></div>
                <div class="field"><label>Categoría</label><div class="value">${Store.getRoomType(res.roomTypeId)?.name || res.roomTypeId}</div></div>
                <div class="field"><label>Pax</label><div class="value">${res.paxCount || '—'}</div></div>
            </div>` : ''}

            <div class="section-title">Datos del Titular</div>
            <div class="grid-2">
                <div class="field"><label>Apellido</label><div class="value">${d.lastName || ''}</div></div>
                <div class="field"><label>Nombre</label><div class="value">${d.firstName || ''}</div></div>
                <div class="field"><label>${d.docType || 'DNI'} N°</label><div class="value">${d.docNumber || ''}</div></div>
                <div class="field"><label>Fecha de Nacimiento</label><div class="value">${d.birthDate || ''}</div></div>
                <div class="field"><label>Nacionalidad</label><div class="value">${d.nationality || ''}</div></div>
                <div class="field"><label>País de Residencia</label><div class="value">${d.country || ''}</div></div>
                <div class="field"><label>Domicilio</label><div class="value">${d.address || ''}</div></div>
                <div class="field"><label>Ciudad</label><div class="value">${d.city || ''}</div></div>
                <div class="field"><label>Email</label><div class="value">${d.email || ''}</div></div>
                <div class="field"><label>Teléfono / WhatsApp</label><div class="value">${d.phone || ''}</div></div>
            </div>

            ${(d.companions || []).filter(c => c.name).length > 0 ? `
            <div class="section-title">Acompañantes</div>
            <table class="companions-table">
                <thead><tr><th>#</th><th>Nombre Completo</th><th>Doc. / Pasaporte</th><th>Relación</th></tr></thead>
                <tbody>
                    ${(d.companions || []).filter(c => c.name).map((c, i) => `
                        <tr><td>${i + 1}</td><td>${c.name}</td><td>${c.doc || '—'}</td><td>${c.relation || '—'}</td></tr>`).join('')}
                </tbody>
            </table>` : ''}

            ${d.preferences ? `
            <div class="section-title">Preferencias</div>
            <div style="font-size:10pt;padding:0.2cm 0;margin-bottom:0.8cm;">${d.preferences}</div>` : ''}

            <div class="section-title">Firma del Huésped</div>
            <div class="signature-box">Firma y aclaración</div>

            <div class="footer">
                ${hotel.address} · ${hotel.phone} · ${hotel.email}<br>
                Al firmar este formulario, el huésped acepta las políticas del establecimiento.
            </div>
        </body></html>`);
        w.document.close();
        setTimeout(() => w.print(), 400);
    },

    renderGuestsView: () => {
        const container = document.getElementById('view-content');
        if (!container) return;

        const allGuests = Store.guests || [];

        const renderList = (query = '') => {
            const q = query.toLowerCase().trim();
            const filtered = q.length < 1
                ? allGuests
                : allGuests.filter(g =>
                    (`${g.firstName} ${g.lastName}`).toLowerCase().includes(q) ||
                    (g.docNumber || '').toLowerCase().includes(q) ||
                    (g.email || '').toLowerCase().includes(q) ||
                    (g.nationality || '').toLowerCase().includes(q)
                );

            const grid = document.getElementById('guests-grid');
            if (!grid) return;

            if (filtered.length === 0) {
                grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:4rem; opacity:0.4;">
                    <ion-icon name="people-outline" style="font-size:3rem; display:block; margin-bottom:1rem;"></ion-icon>
                    <p>${q ? 'No se encontraron huéspedes con ese criterio.' : 'Todavía no hay perfiles registrados.'}</p>
                    <button class="btn btn-secondary" onclick="UI.openGuestProfileModal(null,'')" style="margin-top:1rem; border-color:var(--accent-gold); color:var(--accent-gold);">
                        + Crear primer perfil
                    </button>
                </div>`;
                return;
            }

            grid.innerHTML = filtered.map(g => {
                const initials = `${(g.firstName || '?')[0]}${(g.lastName || '?')[0]}`.toUpperCase();
                const today = Store.getSystemDate ? Store.getSystemDate() : new Date();
                today.setHours(0, 0, 0, 0);

                const allRes = Store.getGuestReservations(g.id).filter(r => r.status !== 'cancelada');
                // Upcoming = checkin >= today (future OR currently in-house)
                const upcoming = allRes.filter(r => new Date(r.checkin) >= today || r.status === 'in-house');
                // Past = checked out already
                const past = allRes.filter(r => new Date(r.checkin) < today && r.status !== 'in-house');

                const flagsHtml = (g.flags || []).map(f =>
                    `<span style="font-size:0.58rem;background:rgba(212,175,55,0.15);color:var(--accent-gold);border:1px solid rgba(212,175,55,0.3);border-radius:50px;padding:0.1rem 0.45rem;font-weight:700;">${f}</span>`
                ).join('');

                // Upcoming reservations as clickable chips
                const upcomingHtml = upcoming.length > 0
                    ? upcoming.slice(0, 3).map(r => {
                        const statusColors = {
                            'confirmada': 'rgba(0,150,170,0.15)',
                            'in-house': 'rgba(212,175,55,0.15)',
                            'pendiente': 'rgba(255,165,0,0.15)',
                        };
                        const statusBorderColors = {
                            'confirmada': 'rgba(0,150,170,0.4)',
                            'in-house': 'rgba(212,175,55,0.4)',
                            'pendiente': 'rgba(255,165,0,0.4)',
                        };
                        const statusTextColors = {
                            'confirmada': 'var(--accent-cyan)',
                            'in-house': 'var(--accent-gold)',
                            'pendiente': '#ffa500',
                        };
                        const bg = statusColors[r.status] || 'rgba(255,255,255,0.05)';
                        const bdr = statusBorderColors[r.status] || 'rgba(255,255,255,0.15)';
                        const color = statusTextColors[r.status] || 'var(--text-primary)';
                        const nights = Math.round((new Date(r.checkout) - new Date(r.checkin)) / 86400000);
                        return `<div onclick="UI.openReservationModal('${r.id}')"
                                    style="cursor:pointer;padding:0.5rem 0.7rem;background:${bg};border:1px solid ${bdr};border-radius:8px;transition:filter 0.15s;"
                                    onmouseover="this.style.filter='brightness(1.3)'" onmouseout="this.style.filter=''">
                                    <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;">
                                        <span style="font-size:0.72rem;font-weight:700;color:${color};">${r.status.toUpperCase()}</span>
                                        <span style="font-size:0.65rem;opacity:0.5;">${nights}n</span>
                                    </div>
                                    <div style="font-size:0.7rem;margin-top:0.2rem;opacity:0.75;">
                                        ${Utils.formatDate(r.checkin)} → ${Utils.formatDate(r.checkout)}
                                    </div>
                                </div>`;
                    }).join('')
                    : '';

                return `
                <div class="glass" style="border-radius:16px; padding:1.5rem; display:flex; flex-direction:column; gap:1rem; border:1px solid var(--border-color); cursor:default; transition:transform 0.2s, box-shadow 0.2s;"
                     onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 24px rgba(0,0,0,0.3)'"
                     onmouseout="this.style.transform='';this.style.boxShadow=''">
                    <!-- Avatar + Name -->
                    <div style="display:flex; align-items:center; gap:1rem;">
                        <div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,rgba(212,175,55,0.3),rgba(212,175,55,0.1));display:flex;align-items:center;justify-content:center;font-weight:800;font-size:1.1rem;color:var(--accent-gold);flex-shrink:0;border:2px solid rgba(212,175,55,0.3);">
                            ${initials}
                        </div>
                        <div style="flex:1;min-width:0;">
                            <div style="font-weight:700;font-size:1rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${g.firstName} ${g.lastName}</div>
                            <div style="font-size:0.72rem;opacity:0.55;">${g.docType || 'DNI'} ${g.docNumber || '—'} · ${g.nationality || '—'}</div>
                        </div>
                    </div>
                    <!-- Flags -->
                    ${flagsHtml ? `<div style="display:flex;gap:0.3rem;flex-wrap:wrap;">${flagsHtml}</div>` : ''}
                    <!-- Contact -->
                    <div style="font-size:0.78rem;opacity:0.65;display:flex;flex-direction:column;gap:0.3rem;">
                        ${g.email ? `<span><ion-icon name="mail-outline" style="vertical-align:-2px;"></ion-icon> ${g.email}</span>` : ''}
                        ${g.phone ? `<span><ion-icon name="logo-whatsapp" style="vertical-align:-2px;"></ion-icon> ${g.phone}</span>` : ''}
                    </div>
                    <!-- Upcoming reservations -->
                    ${upcomingHtml ? `
                    <div>
                        <div style="font-size:0.6rem;text-transform:uppercase;letter-spacing:1px;opacity:0.4;margin-bottom:0.4rem;">Próximas / en curso</div>
                        <div style="display:flex;flex-direction:column;gap:0.4rem;">${upcomingHtml}</div>
                    </div>` : ''}
                    <!-- Stats bar -->
                    <div style="display:flex;gap:0.8rem;padding-top:0.5rem;border-top:1px solid var(--border-color);">
                        <div style="text-align:center;flex:1;">
                            <div style="font-size:1.2rem;font-weight:800;color:${upcoming.length > 0 ? 'var(--accent-cyan)' : 'inherit'}">${upcoming.length}</div>
                            <div style="font-size:0.62rem;opacity:0.45;text-transform:uppercase;">Próximas</div>
                        </div>
                        <div style="text-align:center;flex:1;">
                            <div style="font-size:1.2rem;font-weight:800;color:${past.length > 0 ? 'var(--accent-gold)' : 'inherit'}">${past.length}</div>
                            <div style="font-size:0.62rem;opacity:0.45;text-transform:uppercase;">Historial</div>
                        </div>
                    </div>
                    <!-- Actions -->
                    <div style="display:flex;gap:0.5rem;">
                        <button type="button" onclick="UI.openGuestProfileModal('${g.id}', null)"
                            style="flex:1;padding:0.45rem;font-size:0.72rem;background:transparent;border:1px solid var(--border-color);border-radius:8px;color:var(--text-primary);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:0.3rem;transition:border-color 0.2s;"
                            onmouseover="this.style.borderColor='var(--accent-gold)';this.style.color='var(--accent-gold)'"
                            onmouseout="this.style.borderColor='';this.style.color=''">
                            <ion-icon name="person-outline"></ion-icon> Perfil
                        </button>
                        <button type="button" onclick="UI.newReservationFromGuest('${g.id}')"
                            style="flex:1;padding:0.45rem;font-size:0.72rem;background:rgba(0,150,170,0.1);border:1px solid rgba(0,150,170,0.3);border-radius:8px;color:var(--accent-cyan);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:0.3rem;transition:all 0.2s;"
                            onmouseover="this.style.background='rgba(0,150,170,0.2)'"
                            onmouseout="this.style.background='rgba(0,150,170,0.1)'">
                            <ion-icon name="calendar-outline"></ion-icon> + Reserva
                        </button>
                    </div>
                </div>`;
            }).join('');
        };

        container.innerHTML = `
            <div style="padding:2rem 2.5rem; max-width:1400px; margin:0 auto;">
                <!-- Header -->
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:2rem; flex-wrap:wrap; gap:1rem;">
                    <div>
                        <h1 style="font-size:1.8rem; font-weight:800; margin:0; display:flex; align-items:center; gap:0.7rem;">
                            <ion-icon name="people-outline" style="color:var(--accent-gold);"></ion-icon>
                            Huéspedes
                        </h1>
                        <p style="margin:0.3rem 0 0; opacity:0.5; font-size:0.85rem;">${allGuests.length} perfiles registrados</p>
                    </div>
                    <button class="btn btn-primary" onclick="UI.openGuestProfileModal(null, '')"
                        style="background:linear-gradient(135deg,rgba(212,175,55,0.8),rgba(212,175,55,0.5));border:none;color:#000;font-weight:800;display:flex;align-items:center;gap:0.5rem;">
                        <ion-icon name="person-add-outline"></ion-icon> Nuevo Huésped
                    </button>
                </div>

                <!-- Search Bar -->
                <div style="position:relative; margin-bottom:2rem;">
                    <ion-icon name="search-outline" style="position:absolute;left:1rem;top:50%;transform:translateY(-50%);opacity:0.4;font-size:1.1rem;pointer-events:none;"></ion-icon>
                    <input id="guests-search" type="text" placeholder="Buscar por nombre, apellido, DNI, email, nacionalidad..."
                        autocomplete="off"
                        oninput="(function(q){ const g=document.getElementById('guests-grid'); if(g) UI.renderGuestsView._filter(q); })(this.value)"
                        style="width:100%;padding:0.85rem 1rem 0.85rem 2.8rem;background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:12px;color:var(--text-primary);font-size:0.95rem;box-sizing:border-box;transition:border-color 0.2s;"
                        onfocus="this.style.borderColor='var(--accent-gold)'" onblur="this.style.borderColor=''">
                </div>

                <!-- Grid -->
                <div id="guests-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:1.2rem;">
                </div>
            </div>
        `;

        // Attach live filter
        UI.renderGuestsView._filter = renderList;
        renderList('');
    },

    newReservationFromGuest: (guestId) => {
        const g = Store.guests.find(x => x.id === guestId);
        if (!g) return;
        // Open new reservation modal then pre-fill via selectGuestSuggestion
        UI.openReservationModal(null);
        // Wait for modal DOM to settle then inject guest data
        setTimeout(() => UI.selectGuestSuggestion(guestId), 80);
    },

    guestAutocomplete: (inputEl, field) => {
        const firstName = document.getElementById('firstName')?.value?.trim() || '';
        const lastName = document.getElementById('lastName')?.value?.trim() || '';
        const query = `${firstName} ${lastName}`.trim();

        const box = document.getElementById('guest-suggestions');
        if (!box) return;

        if (query.length < 2) { box.style.display = 'none'; return; }

        const results = Store.findGuestsByName(query);
        if (results.length === 0) { box.style.display = 'none'; return; }

        box.style.display = 'block';
        box.innerHTML = results.slice(0, 6).map(g => {
            const prevStays = Store.getGuestReservations(g.id).filter(r => r.status !== 'cancelada').length;
            const flags = (g.flags || []).map(f => `<span style="font-size:0.6rem;background:rgba(212,175,55,0.2);color:var(--accent-gold);border-radius:50px;padding:0.05rem 0.4rem;">${f}</span>`).join('');
            return `
                <div onclick="UI.selectGuestSuggestion('${g.id}')"
                     style="padding:0.7rem 1rem; cursor:pointer; border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center; transition:background 0.15s;"
                     onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background=''">
                    <div>
                        <div style="font-weight:700; font-size:0.9rem;">${g.firstName} ${g.lastName}</div>
                        <div style="font-size:0.75rem; opacity:0.6; display:flex; gap:0.5rem; margin-top:0.1rem;">
                            ${g.docType || 'DNI'} ${g.docNumber || '—'} · ${g.email || g.phone || '—'}
                        </div>
                        ${flags ? `<div style="display:flex;gap:0.3rem;margin-top:0.2rem;">${flags}</div>` : ''}
                    </div>
                    <div style="text-align:right; font-size:0.7rem; opacity:0.5;">
                        ${prevStays > 0 ? `<div style="color:var(--accent-gold);">★ ${prevStays} estadía${prevStays > 1 ? 's' : ''}</div>` : '<div>Nuevo</div>'}
                        <div>${g.nationality || ''}</div>
                    </div>
                </div>`;
        }).join('') + (results.length > 6 ? `<div style="padding:0.5rem 1rem;font-size:0.7rem;opacity:0.4;text-align:center;">+${results.length - 6} más...</div>` : '');

        // Close on outside click
        setTimeout(() => {
            document.addEventListener('click', function handler(e) {
                if (!box.contains(e.target)) {
                    box.style.display = 'none';
                    document.removeEventListener('click', handler);
                }
            });
        }, 100);
    },

    selectGuestSuggestion: (guestId) => {
        const g = Store.guests.find(x => x.id === guestId);
        if (!g) return;

        // Fill name fields
        if (document.getElementById('firstName')) document.getElementById('firstName').value = g.firstName;
        if (document.getElementById('lastName')) document.getElementById('lastName').value = g.lastName;

        // Fill contact fields
        if (document.getElementById('paxEmail')) document.getElementById('paxEmail').value = g.email || '';
        if (document.getElementById('paxPhone')) document.getElementById('paxPhone').value = g.phone || '';

        // Store linked guestId in hidden field (create if needed)
        let hiddenGid = document.getElementById('linked-guest-id');
        if (!hiddenGid) {
            hiddenGid = document.createElement('input');
            hiddenGid.type = 'hidden';
            hiddenGid.id = 'linked-guest-id';
            document.getElementById('reservation-form')?.appendChild(hiddenGid);
        }
        hiddenGid.value = guestId;

        // Hide suggestions
        const box = document.getElementById('guest-suggestions');
        if (box) box.style.display = 'none';

        // Visual feedback
        const fn = document.getElementById('firstName');
        if (fn) {
            fn.style.borderColor = 'var(--accent-gold)';
            fn.style.boxShadow = '0 0 8px rgba(212,175,55,0.3)';
            setTimeout(() => { fn.style.borderColor = ''; fn.style.boxShadow = ''; }, 2000);
        }
    },
};

// Track if modal form has been modified
let _modalHasChanges = false;
let _modalSavedResId = null;  // last saved/opened resId

function closeModal() {
    // If the form has unsaved changes, ask for confirmation
    const form = document.getElementById('reservation-form');
    const isNewForm = form && !form.classList.contains('edit-mode') && !_modalSavedResId;
    const hasChanges = _modalHasChanges;

    if (hasChanges) {
        const answer = confirm('\u00bfDescardás los cambios?\nElegí \'Cancelar\' para volver al formulario y guardar.');
        if (!answer) return; // stay in modal
    }

    _forceCloseModal();
}

function _forceCloseModal() {
    _modalHasChanges = false;
    _modalSavedResId = null;
    document.getElementById('reservation-modal').classList.add('hidden');
}

function closeSecondaryModal() {
    const m = document.getElementById('secondary-modal');
    if (m) m.remove();
}
