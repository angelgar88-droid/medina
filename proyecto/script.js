document.addEventListener('DOMContentLoaded', () => {
    // State Management
    let patients = JSON.parse(localStorage.getItem('patients')) || [
        { id: 1, name: 'Carlos Mendoza', age: 45, diagnosis: 'IRC Estadio 4', member: 'Gold', files: [] },
        { id: 2, name: 'Lucia Ramirez', age: 32, diagnosis: 'Diabetes Tipo 2', member: 'Silver', files: [] },
        { id: 3, name: 'Fernando Solis', age: 58, diagnosis: 'Hipertensión', member: 'Platinum', files: [] }
    ];

    let currentPatientId = null;

    function saveState() {
        localStorage.setItem('patients', JSON.stringify(patients));
    }

    function showToast(msg) {
        const toast = document.createElement('div');
        toast.style.cssText = 'position:fixed; bottom:20px; right:20px; background:rgba(0,0,0,0.8); color:white; padding:12px 24px; border-radius:12px; z-index:9999; font-size:14px; animation:fadeIn 0.3s;';
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Modal Helpers
    window.openModal = function(id) {
        document.getElementById(id).style.display = 'flex';
    };

    window.closeModal = function(id) {
        document.getElementById(id).style.display = 'none';
    };


    // AI Assistant Toggle
    const aiAssistantBtn = document.getElementById('ai-assistant');
    const aiModal = document.getElementById('ai-modal');
    aiAssistantBtn.addEventListener('click', () => aiModal.style.display = aiModal.style.display === 'flex' ? 'none' : 'flex');
    document.getElementById('close-ai').addEventListener('click', () => aiModal.style.display = 'none');

    // Revenue Chart
    const ctx = document.getElementById('revenueChart').getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(0, 102, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 102, 255, 0)');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'],
            datasets: [{
                label: 'Pacientes Atendidos',
                data: [35, 42, 38, 45, 52, 48, 42],
                borderColor: '#0066FF',
                backgroundColor: gradient,
                fill: true,
                tension: 0.4,
                borderWidth: 3,
                pointBackgroundColor: '#0066FF',
                pointBorderColor: '#fff'
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { display: false } }, x: { grid: { display: false } } } }
    });

    // Patients Logic
    window.renderPatients = function() {
        const grid = document.getElementById('patients-list');
        grid.innerHTML = patients.map(p => `
            <div class="glass-card" style="padding: 20px; display: flex; flex-direction: column; gap: 15px; cursor: pointer; position: relative;">
                <div style="position: absolute; top: 15px; right: 15px; display: flex; gap: 10px;">
                    <i class="fas fa-trash" onclick="deletePatient(${p.id}); event.stopPropagation();" style="color: var(--danger); font-size: 14px; opacity: 0.6; cursor: pointer;"></i>
                </div>
                <div onclick="openPatientExpediente(${p.id})" style="display: flex; gap: 15px;">
                    <div style="width: 50px; height: 50px; background: var(--primary); border-radius: 14px; display: flex; align-items: center; justify-content: center; color: white;">
                        <i class="fas fa-user-injured" style="font-size: 20px;"></i>
                    </div>
                    <div>
                        <h4 style="font-weight: 700;">${p.name}</h4>
                        <p style="font-size: 12px; color: var(--text-secondary);">${p.age} años • ${p.diagnosis}</p>
                    </div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 15px;">
                    <span style="font-size: 11px; font-weight: 700; color: var(--primary); text-transform: uppercase;">Membresía: ${p.member}</span>
                    <span style="font-size: 11px; color: var(--text-secondary);"><i class="fas fa-file-pdf"></i> ${p.files.length} Docs</span>
                </div>
            </div>
        `).join('');
    };

    window.saveNewPatient = function() {
        const name = document.getElementById('new-patient-name').value;
        const age = document.getElementById('new-patient-age').value;
        const diagnosis = document.getElementById('new-patient-diagnosis').value;
        const member = document.getElementById('new-patient-member').value;

        if (!name || !age) return alert('Por favor llene los campos básicos');

        const newPatient = {
            id: Date.now(),
            name,
            age,
            diagnosis,
            member,
            files: []
        };

        patients.push(newPatient);
        saveState();
        renderPatients();
        closeModal('add-patient-modal');
        
        // Reset fields
        document.getElementById('new-patient-name').value = '';
        document.getElementById('new-patient-age').value = '';
        document.getElementById('new-patient-diagnosis').value = '';
    };

    window.deletePatient = function(id) {
        if (!confirm('¿Está seguro de eliminar este paciente?')) return;
        patients = patients.filter(p => p.id !== id);
        saveState();
        renderPatients();
    };

    window.openPatientExpediente = function(id) {
        currentPatientId = Number(id);
        const patient = patients.find(p => p.id == currentPatientId);
        if (!patient) return console.error('Paciente no encontrado:', id);
        document.getElementById('modal-patient-name').textContent = `Expediente: ${patient.name}`;
        renderFilesList();
        openModal('patient-files-modal');
    };

    function renderFilesList() {
        const patient = patients.find(p => p.id == currentPatientId);
        const container = document.getElementById('files-list');
        if (!patient || !container) return;
        
        if (!patient.files || patient.files.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">No hay documentos cargados.</p>';
            return;
        }

        container.innerHTML = patient.files.map((file, index) => `
            <div class="glass" style="padding: 12px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <i class="fas fa-file-pdf" style="color: var(--danger); font-size: 20px;"></i>
                    <div>
                        <p style="font-size: 13px; font-weight: 600;">${file.name}</p>
                        <p style="font-size: 11px; color: var(--text-secondary);">${file.date}</p>
                    </div>
                </div>
                <div style="display: flex; gap: 10px;">
                    <a href="${file.url}" target="_blank" style="color: var(--primary);"><i class="fas fa-eye"></i></a>
                    <i class="fas fa-times" onclick="deleteFile(${index})" style="color: var(--danger); cursor: pointer;"></i>
                </div>
            </div>
        `).join('');
    }

    document.getElementById('file-input').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        if (file.type !== 'application/pdf') return alert('Solo se permiten archivos PDF');

        const reader = new FileReader();
        reader.onload = function(event) {
            const base64Data = event.target.result;
            const patient = patients.find(p => p.id === currentPatientId);
            if (!patient) return;

            patient.files.push({
                name: file.name,
                date: new Date().toLocaleDateString(),
                url: base64Data
            });

            saveState();
            renderFilesList();
            renderPatients(); // Update the doc count
            showToast('✅ Documento guardado correctamente');
        };
        reader.onerror = function() {
            alert('Error al leer el archivo. Intente con uno más pequeño.');
        };
        reader.readAsDataURL(file);
    });

    window.deleteFile = function(index) {
        if (!confirm('¿Eliminar este documento?')) return;
        const patient = patients.find(p => p.id === currentPatientId);
        patient.files.splice(index, 1);
        saveState();
        renderFilesList();
        renderPatients();
    };

    // Other renders
    function renderHemodialysis() {
        const grid = document.getElementById('hemo-machines-grid');
        if (!grid) return;
        grid.innerHTML = '';
        for (let i = 1; i <= 12; i++) {
            const status = i % 4 === 0 ? 'Mantenimiento' : (i % 3 === 0 ? 'Disponible' : 'Activo');
            const statusClass = status === 'Activo' ? 'success' : (status === 'Disponible' ? 'primary' : 'danger');
            const bp = 110 + Math.floor(Math.random() * 20);
            const sys = 70 + Math.floor(Math.random() * 15);
            const card = document.createElement('div');
            card.className = 'glass-card fade-in';
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                    <div><p style="font-size: 12px; color: var(--text-secondary); font-weight: 600;">MÁQUINA #${i.toString().padStart(2, '0')}</p><h4 style="font-weight: 700;">Fresenius T500</h4></div>
                    <span style="background: rgba(${statusClass === 'success' ? '16, 185, 129' : (statusClass === 'primary' ? '0, 102, 255' : '239, 68, 68')}, 0.1); color: var(--${statusClass}); padding: 4px 10px; border-radius: 8px; font-size: 10px; font-weight: 700; text-transform: uppercase;">${status}</span>
                </div>
                ${status === 'Activo' ? `<div style="display: flex; gap: 15px; margin-bottom: 15px;"><div style="flex: 1;"><p style="font-size: 10px; color: var(--text-secondary);">Presión Arterial</p><p style="font-size: 16px; font-weight: 700; color: var(--primary);">${bp}/${sys}</p></div><div style="flex: 1;"><p style="font-size: 10px; color: var(--text-secondary);">Oxígeno SpO2</p><p style="font-size: 16px; font-weight: 700; color: var(--success);">98%</p></div></div><div style="height: 4px; background: #eee; border-radius: 2px; position: relative;"><div style="position: absolute; left: 0; top: 0; height: 100%; width: 65%; background: var(--primary); border-radius: 2px; box-shadow: 0 0 10px var(--primary-glow);"></div></div><p style="font-size: 10px; text-align: right; margin-top: 5px; color: var(--text-secondary);">Tiempo restante: 1h 45m</p>` : `<div style="height: 80px; display: flex; align-items: center; justify-content: center; color: var(--text-secondary);"><i class="fas ${status === 'Disponible' ? 'fa-check-circle' : 'fa-tools'}" style="font-size: 24px; opacity: 0.3;"></i></div>`}
            `;
            grid.appendChild(card);
        }
    }

    function renderMemberships() {
        const tbody = document.getElementById('membership-list');
        if (!tbody) return;
        const members = [
            { name: 'Ricardo Alarcon', id: 'SP-2024-001', type: 'Individual', expiry: '12 Oct 2024', status: 'Activa' },
            { name: 'Maria Elena Gomez', id: 'SP-2024-082', type: 'Familiar', expiry: '05 Nov 2024', status: 'Activa' },
            { name: 'Juan Carlos Perez', id: 'SP-2023-941', type: 'Dúo', expiry: '01 May 2024', status: 'Expirada' },
            { name: 'Sofia Mendez', id: 'SP-2024-115', type: 'Individual', expiry: '20 Dic 2024', status: 'Pendiente' }
        ];
        tbody.innerHTML = members.map(m => `
            <tr style="border-bottom: 1px solid rgba(0,0,0,0.05);">
                <td style="padding: 16px 0; display: flex; align-items: center; gap: 10px;"><img src="https://ui-avatars.com/api/?name=${m.name}&background=random" style="width: 32px; height: 32px; border-radius: 8px;"><span style="font-weight: 600;">${m.name}</span></td>
                <td>${m.id}</td><td>${m.type}</td><td>${m.expiry}</td>
                <td><span style="background: ${m.status === 'Activa' ? 'rgba(16, 185, 129, 0.1)' : (m.status === 'Expirada' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)')}; color: ${m.status === 'Activa' ? 'var(--success)' : (m.status === 'Expirada' ? 'var(--danger)' : 'var(--warning)')}; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">${m.status}</span></td>
                <td><i class="fas fa-ellipsis-h" style="color: var(--text-secondary); cursor: pointer;"></i></td>
            </tr>
        `).join('');
    }

    function renderSpecialists() {
        const grid = document.getElementById('specialists-grid');
        if (!grid) return;
        const specialties = [
            { name: 'Dr. Roberto Silva', specialty: 'Nefrología', avail: 'Disponible' },
            { name: 'Dra. Ana Paola', specialty: 'Cardiología', avail: 'Ocupada' },
            { name: 'Dr. Luis Torres', specialty: 'Neurología', avail: 'Disponible' },
            { name: 'Dra. Elena Ruiz', specialty: 'Pediatría', avail: 'En consulta' },
            { name: 'Dr. Miguel Angel', specialty: 'Medicina Interna', avail: 'Disponible' },
            { name: 'Dra. Sofia Diaz', specialty: 'Nutrición', avail: 'Ocupada' }
        ];
        grid.innerHTML = specialties.map(s => `
            <div class="glass-card"><div style="display: flex; gap: 15px; align-items: center; margin-bottom: 15px;"><img src="https://ui-avatars.com/api/?name=${s.name}&background=0066FF&color=fff" style="width: 50px; height: 50px; border-radius: 12px;"><div><h4 style="font-weight: 700;">${s.name}</h4><p style="font-size: 12px; color: var(--text-secondary);">${s.specialty}</p></div></div><div style="display: flex; justify-content: space-between; align-items: center;"><span style="font-size: 11px; font-weight: 700; color: ${s.avail === 'Disponible' ? 'var(--success)' : 'var(--warning)'}; text-transform: uppercase;">${s.avail}</span><button style="background: var(--primary); color: white; border: none; padding: 6px 12px; border-radius: 8px; font-size: 11px; cursor: pointer;">Ver Agenda</button></div></div>
        `).join('');
    }


    // Medina Financial Logic
    let medinaGastos = JSON.parse(localStorage.getItem('medinaGastos')) || [];
    let medinaIngresos = JSON.parse(localStorage.getItem('medinaIngresos')) || [];

    window.saveMedinaGasto = function() {
        const concepto = document.getElementById('m-g-concepto').value;
        const motivo = document.getElementById('m-g-motivo').value;
        const cantidad = parseFloat(document.getElementById('m-g-cantidad').value);
        const fecha = document.getElementById('m-g-fecha').value;

        if (!concepto || isNaN(cantidad) || !fecha) {
            return showToast('⚠️ Complete todos los campos obligatorios');
        }

        const newGasto = { id: Date.now(), concepto, motivo, cantidad, fecha };
        medinaGastos.unshift(newGasto);
        localStorage.setItem('medinaGastos', JSON.stringify(medinaGastos));
        
        document.getElementById('m-g-concepto').value = '';
        document.getElementById('m-g-motivo').value = '';
        document.getElementById('m-g-cantidad').value = '';
        
        renderMedinaFinances();
        showToast('✅ Gasto registrado');
    };

    window.saveMedinaIngreso = function() {
        const concepto = document.getElementById('m-i-concepto').value;
        const cantidad = parseFloat(document.getElementById('m-i-cantidad').value);
        const fecha = document.getElementById('m-i-fecha').value;

        if (!concepto || isNaN(cantidad) || !fecha) {
            return showToast('⚠️ Complete todos los campos');
        }

        const newIngreso = { id: Date.now(), concepto, cantidad, fecha };
        medinaIngresos.unshift(newIngreso);
        localStorage.setItem('medinaIngresos', JSON.stringify(medinaIngresos));
        
        document.getElementById('m-i-concepto').value = '';
        document.getElementById('m-i-cantidad').value = '';
        
        renderMedinaFinances();
        showToast('✅ Ingreso registrado');
    };

    window.renderMedinaFinances = function() {
        const gTbody = document.getElementById('medina-gastos-tbody');
        const iTbody = document.getElementById('medina-ingresos-tbody');
        if (!gTbody || !iTbody) return;

        let totalG = 0;
        let totalI = 0;

        // Render Gastos
        gTbody.innerHTML = medinaGastos.map(g => {
            totalG += g.cantidad;
            return `
                <tr style="border-bottom: 1px solid rgba(0,0,0,0.05);">
                    <td style="padding:10px 0;">${g.fecha}</td>
                    <td><strong>${g.concepto}</strong></td>
                    <td style="color:var(--danger); font-weight:700;">-$${g.cantidad.toLocaleString()}</td>
                    <td><i class="fas fa-trash" onclick="deleteMedinaGasto(${g.id})" style="cursor:pointer; opacity:0.5;"></i></td>
                </tr>
            `;
        }).join('');

        // Render Ingresos
        iTbody.innerHTML = medinaIngresos.map(i => {
            totalI += i.cantidad;
            return `
                <tr style="border-bottom: 1px solid rgba(0,0,0,0.05);">
                    <td style="padding:10px 0;">${i.fecha}</td>
                    <td><strong>${i.concepto}</strong></td>
                    <td style="color:var(--success); font-weight:700;">+$${i.cantidad.toLocaleString()}</td>
                    <td><i class="fas fa-trash" onclick="deleteMedinaIngreso(${i.id})" style="cursor:pointer; opacity:0.5;"></i></td>
                </tr>
            `;
        }).join('');

        // Update Stats
        const balance = totalI - totalG;
        if(document.getElementById('medina-total-ingresos')) document.getElementById('medina-total-ingresos').textContent = `$${totalI.toLocaleString()}`;
        if(document.getElementById('medina-total-gastos')) document.getElementById('medina-total-gastos').textContent = `$${totalG.toLocaleString()}`;
        
        const balanceEl = document.getElementById('medina-balance-neto');
        if(balanceEl) {
            balanceEl.textContent = `$${balance.toLocaleString()}`;
            balanceEl.style.color = balance >= 0 ? 'var(--success)' : 'var(--danger)';
        }
    };

    window.deleteMedinaGasto = function(id) {
        const pass = prompt('🔐 Ingrese la contraseña de administrador para eliminar este registro:');
        if (pass !== 'medina2026') return showToast('❌ Contraseña incorrecta');

        if (!confirm('¿Eliminar este registro de gasto?')) return;
        medinaGastos = medinaGastos.filter(g => g.id !== id);
        localStorage.setItem('medinaGastos', JSON.stringify(medinaGastos));
        renderMedinaFinances();
        showToast('🗑 Gasto eliminado');
    };

    window.deleteMedinaIngreso = function(id) {
        const pass = prompt('🔐 Ingrese la contraseña de administrador para eliminar este registro:');
        if (pass !== 'medina2026') return showToast('❌ Contraseña incorrecta');

        if (!confirm('¿Eliminar este registro de ingreso?')) return;
        medinaIngresos = medinaIngresos.filter(i => i.id !== id);
        localStorage.setItem('medinaIngresos', JSON.stringify(medinaIngresos));
        renderMedinaFinances();
        showToast('🗑 Ingreso eliminado');
    };

    window.resetMedinaFinances = function() {
        const pass = prompt('🔐 Ingrese la contraseña de administrador para REINICIAR TODO EL MES:');
        if (pass !== 'medina2026') return showToast('❌ Contraseña incorrecta');

        if (!confirm('¿Está seguro de reiniciar los registros financieros del mes? Esta acción no se puede deshacer.')) return;
        medinaGastos = [];
        medinaIngresos = [];
        localStorage.removeItem('medinaGastos');
        localStorage.removeItem('medinaIngresos');
        renderMedinaFinances();
        showToast('🔄 Finanzas reiniciadas');
    };

    // Medina Agenda Logic
    let medinaAgendaData = JSON.parse(localStorage.getItem('medinaAgendaData')) || {};
    const medinaAgendaDays = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const medinaAgendaTimes = ["07:00 am", "11:00 am", "15:00 pm"];
    const medinaAgendaMachines = [1, 2, 3, 4];

    window.renderMedinaAgenda = function() {
        const container = document.getElementById('medinaAgendaContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="medina-agenda-grid">
                <div class="medina-agenda-header">
                    <div class="m-day-col">Turno</div>
                    ${medinaAgendaDays.map(d => `<div class="m-day-col">${d}</div>`).join('')}
                </div>
                <div style="flex: 1; overflow-y: auto;">
                    ${medinaAgendaTimes.map(time => `
                        <div class="medina-agenda-row">
                            <div class="m-time-cell">${time}</div>
                            ${medinaAgendaDays.map(day => `
                                <div class="m-agenda-cell">
                                    <div class="m-machine-grid">
                                        ${medinaAgendaMachines.map(m => {
                                            const key = `${day}-${time}-${m}`;
                                            const data = medinaAgendaData[key];
                                            const isEmpty = !data || !data.name;
                                            return `
                                                <div class="m-machine-slot ${isEmpty ? 'empty' : ''}" 
                                                     onclick="openMedinaAgendaModal('${day}', '${time}', ${m})"
                                                     ondragover="event.preventDefault(); this.classList.add('drag-over')"
                                                     ondragleave="this.classList.remove('drag-over')"
                                                     ondrop="handleMedinaAgendaDrop(event, '${key}')">
                                                    <span class="m-slot-label">M${m}</span>
                                                    ${!isEmpty ? `
                                                        <div class="m-patient-card" draggable="true" ondragstart="event.dataTransfer.setData('text/plain', '${key}')">
                                                            <span class="m-patient-name">${data.name}</span>
                                                            <span class="m-patient-status status-${data.status}">${data.status}</span>
                                                        </div>
                                                    ` : '<i class="fas fa-plus" style="opacity:0.3"></i>'}
                                                </div>
                                            `;
                                        }).join('')}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        updateMedinaAgendaStats();
    };

    function updateMedinaAgendaStats() {
        let count = 0;
        const total = medinaAgendaDays.length * medinaAgendaTimes.length * medinaAgendaMachines.length;
        Object.values(medinaAgendaData).forEach(d => { if(d.name) count++; });
        
        if(document.getElementById('medina-count-patients')) document.getElementById('medina-count-patients').textContent = count;
        if(document.getElementById('medina-count-available')) document.getElementById('medina-count-available').textContent = total - count;
    }

    window.openMedinaAgendaModal = function(day, time, machine) {
        const key = `${day}-${time}-${machine}`;
        const data = medinaAgendaData[key] || { name: '', type: 'fijo', status: 'confirmado', obs: '' };

        document.getElementById('m-apm-day').value = day;
        document.getElementById('m-apm-time').value = time;
        document.getElementById('m-apm-machine').value = machine;
        document.getElementById('medina-apm-title').textContent = `${day} - ${time} (M${machine})`;

        document.getElementById('m-apm-name').value = data.name;
        document.getElementById('m-apm-type').value = data.type || 'fijo';
        document.getElementById('m-apm-status').value = data.status || 'confirmado';
        document.getElementById('m-apm-obs').value = data.obs || '';

        document.getElementById('m-apm-delete').style.display = data.name ? 'block' : 'none';
        document.getElementById('medinaAgendaModal').style.display = 'flex';
    };

    window.closeMedinaAgendaModal = function() {
        document.getElementById('medinaAgendaModal').style.display = 'none';
    };

    window.saveMedinaAgendaItem = function() {
        const day = document.getElementById('m-apm-day').value;
        const time = document.getElementById('m-apm-time').value;
        const machine = document.getElementById('m-apm-machine').value;
        const name = document.getElementById('m-apm-name').value;

        if(!name) return showToast('⚠️ Nombre requerido');

        const key = `${day}-${time}-${machine}`;
        medinaAgendaData[key] = {
            name,
            type: document.getElementById('m-apm-type').value,
            status: document.getElementById('m-apm-status').value,
            obs: document.getElementById('m-apm-obs').value
        };

        localStorage.setItem('medinaAgendaData', JSON.stringify(medinaAgendaData));
        renderMedinaAgenda();
        closeMedinaAgendaModal();
        showToast('✅ Turno guardado');
    };

    window.deleteMedinaAgendaItem = function() {
        const key = `${document.getElementById('m-apm-day').value}-${document.getElementById('m-apm-time').value}-${document.getElementById('m-apm-machine').value}`;
        delete medinaAgendaData[key];
        localStorage.setItem('medinaAgendaData', JSON.stringify(medinaAgendaData));
        renderMedinaAgenda();
        closeMedinaAgendaModal();
        showToast('🗑 Turno liberado');
    };

    window.handleMedinaAgendaDrop = function(e, targetKey) {
        e.preventDefault();
        const draggedKey = e.dataTransfer.getData('text/plain');
        if (draggedKey && draggedKey !== targetKey) {
            medinaAgendaData[targetKey] = { ...medinaAgendaData[draggedKey] };
            delete medinaAgendaData[draggedKey];
            localStorage.setItem('medinaAgendaData', JSON.stringify(medinaAgendaData));
            renderMedinaAgenda();
            showToast('🚀 Turno movido');
        }
    };

    // Medina Inventory Logic
    let medinaInventory = JSON.parse(localStorage.getItem('medinaInventory')) || [
        { id: 1, name: 'Eritropoyetina 4000 UI', category: 'Medicamento', lote: 'EP-2024-01', expiry: '2025-12-30', gramaje: '1ml', stock: 45 },
        { id: 2, name: 'Filtro Dializador F6', category: 'Hemodiálisis', lote: 'FL-88-X', expiry: '2026-06-15', gramaje: 'N/A', stock: 120 },
        { id: 3, name: 'Solución Salina 0.9%', category: 'General', lote: 'SS-500-B', expiry: '2025-08-20', gramaje: '500ml', stock: 200 }
    ];
    let medinaInvMovements = JSON.parse(localStorage.getItem('medinaInvMovements')) || [];

    window.renderMedinaInventory = function() {
        const tbody = document.getElementById('medina-inventory-tbody');
        const movTbody = document.getElementById('medina-inv-movements-tbody');
        const selectProd = document.getElementById('m-mov-product');
        if (!tbody) return;

        // Render Current Stock
        tbody.innerHTML = medinaInventory.map(p => `
            <tr style="border-bottom: 1px solid rgba(0,0,0,0.05);">
                <td style="padding:12px 0;"><strong>${p.name}</strong></td>
                <td><span class="m-patient-status status-en-sesion" style="background:rgba(0,102,255,0.05)">${p.category}</span></td>
                <td>${p.lote}</td>
                <td style="color: ${isExpired(p.expiry) ? 'var(--danger)' : 'inherit'}">${p.expiry}</td>
                <td>${p.gramaje}</td>
                <td style="font-weight:700; color: ${p.stock < 10 ? 'var(--danger)' : 'inherit'}">${p.stock}</td>
                <td>
                    <i class="fas fa-trash" onclick="deleteMedinaProduct(${p.id})" style="color:var(--danger); cursor:pointer; opacity:0.6;"></i>
                </td>
            </tr>
        `).join('');

        // Render Movements
        if (movTbody) {
            movTbody.innerHTML = medinaInvMovements.map(m => `
                <tr style="border-bottom: 1px solid rgba(0,0,0,0.05);">
                    <td style="padding:12px 0;">${m.date}</td>
                    <td>${m.product}</td>
                    <td><span class="m-patient-status ${m.type === 'entrada' ? 'status-confirmado' : 'status-confirmado'}" style="background:${m.type === 'entrada' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'}; color:${m.type === 'entrada' ? 'var(--success)' : 'var(--danger)'}">${m.type.toUpperCase()}</span></td>
                    <td style="font-weight:700;">${m.type === 'entrada' ? '+' : '-'}${m.qty}</td>
                    <td>${m.user || 'Admin'}</td>
                </tr>
            `).join('');
        }

        // Update Product Select for Movements
        if (selectProd) {
            selectProd.innerHTML = medinaInventory.map(p => `<option value="${p.id}">${p.name} (Stock: ${p.stock})</option>`).join('');
        }

        updateMedinaInvStats();
    };

    function isExpired(dateStr) {
        const expiry = new Date(dateStr);
        return expiry < new Date();
    }

    function updateMedinaInvStats() {
        const totalProds = medinaInventory.length;
        const critical = medinaInventory.filter(p => p.stock < 10).length;
        const movementsToday = medinaInvMovements.filter(m => m.date === new Date().toISOString().split('T')[0]).length;

        if(document.getElementById('inv-total-products')) document.getElementById('inv-total-products').textContent = totalProds;
        if(document.getElementById('inv-critical-stock')) document.getElementById('inv-critical-stock').textContent = critical;
        if(document.getElementById('inv-movements-today')) document.getElementById('inv-movements-today').textContent = movementsToday;
    }

    window.saveMedinaProduct = function() {
        const name = document.getElementById('m-p-name').value;
        const category = document.getElementById('m-p-category').value;
        const lote = document.getElementById('m-p-lote').value;
        const gramaje = document.getElementById('m-p-gramaje').value;
        const expiry = document.getElementById('m-p-expiry').value;
        const stock = parseInt(document.getElementById('m-p-stock').value) || 0;

        if (!name || !lote || !expiry) return showToast('⚠️ Complete todos los campos');

        const newProd = { id: Date.now(), name, category, lote, gramaje, expiry, stock };
        medinaInventory.push(newProd);
        localStorage.setItem('medinaInventory', JSON.stringify(medinaInventory));
        
        renderMedinaInventory();
        closeModal('medina-product-modal');
        showToast('✅ Producto registrado');
    };

    window.saveMedinaInvMovement = function() {
        const prodId = parseInt(document.getElementById('m-mov-product').value);
        const type = document.getElementById('m-mov-type').value;
        const qty = parseInt(document.getElementById('m-mov-qty').value) || 0;
        const reason = document.getElementById('m-mov-reason').value;

        if (!qty || qty <= 0) return showToast('⚠️ Ingrese una cantidad válida');

        const product = medinaInventory.find(p => p.id === prodId);
        if (!product) return;

        if (type === 'salida' && product.stock < qty) {
            return showToast('❌ Stock insuficiente');
        }

        // Update Stock
        product.stock += (type === 'entrada' ? qty : -qty);
        
        // Record Movement
        const movement = {
            id: Date.now(),
            date: new Date().toISOString().split('T')[0],
            product: product.name,
            type,
            qty,
            reason,
            user: 'Dr. Medina'
        };

        medinaInvMovements.unshift(movement);
        localStorage.setItem('medinaInventory', JSON.stringify(medinaInventory));
        localStorage.setItem('medinaInvMovements', JSON.stringify(medinaInvMovements));

        renderMedinaInventory();
        closeModal('medina-inv-movement-modal');
        showToast(`✅ ${type.toUpperCase()} registrada`);
    };

    window.deleteMedinaProduct = function(id) {
        if (!confirm('¿Eliminar este producto del inventario?')) return;
        medinaInventory = medinaInventory.filter(p => p.id !== id);
        localStorage.setItem('medinaInventory', JSON.stringify(medinaInventory));
        renderMedinaInventory();
        showToast('🗑 Producto eliminado');
    };

    // Medina Attendance Logic
    let medinaAttendance = JSON.parse(localStorage.getItem('medinaAttendance')) || [];
    let attStream = null;

    window.initMedinaCamera = async function() {
        const video = document.getElementById('att-video');
        if (!video) return;

        try {
            attStream = await navigator.mediaDevices.getUserMedia({ video: true });
            video.srcObject = attStream;
        } catch (err) {
            console.error("Camera error:", err);
            showToast('❌ No se pudo acceder a la cámara');
        }
    };

    window.stopMedinaCamera = function() {
        if (attStream) {
            attStream.getTracks().forEach(track => track.stop());
            attStream = null;
        }
    };

    window.registerMedinaAttendance = function() {
        const name = document.getElementById('att-staff-name').value;
        const type = document.getElementById('att-type').value;
        const video = document.getElementById('att-video');
        const canvas = document.getElementById('att-canvas');

        if (!name) return showToast('⚠️ Ingrese el nombre del personal');

        // Capture photo
        const context = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const photo = canvas.toDataURL('image/webp');

        const newRecord = {
            id: Date.now(),
            name,
            type,
            time: new Date().toLocaleTimeString(),
            date: new Date().toLocaleDateString(),
            photo
        };

        medinaAttendance.unshift(newRecord);
        localStorage.setItem('medinaAttendance', JSON.stringify(medinaAttendance));
        
        document.getElementById('att-staff-name').value = '';
        renderMedinaAttendance();
        showToast(`✅ ${type} registrada con éxito`);
    };

    window.renderMedinaAttendance = function() {
        const tbody = document.getElementById('medina-attendance-tbody');
        if (!tbody) return;

        tbody.innerHTML = medinaAttendance.map(a => `
            <tr style="border-bottom: 1px solid rgba(0,0,0,0.05);">
                <td style="padding:10px 0;">
                    <img src="${a.photo}" style="width:50px; height:50px; border-radius:8px; object-fit:cover; border:1px solid var(--border);">
                </td>
                <td><strong>${a.name}</strong><br><small style="color:var(--text-secondary)">${a.date}</small></td>
                <td><span class="m-patient-status" style="background:${a.type === 'Entrada' ? 'rgba(16,185,129,0.1)' : 'rgba(0,102,255,0.1)'}; color:${a.type === 'Entrada' ? 'var(--success)' : 'var(--primary)'}">${a.type}</span></td>
                <td style="font-weight:700;">${a.time}</td>
                <td>
                    <i class="fas fa-trash" onclick="deleteMedinaAttendance(${a.id})" style="cursor:pointer; opacity:0.5; color:var(--danger);"></i>
                </td>
            </tr>
        `).join('');
    };

    window.deleteMedinaAttendance = function(id) {
        const pass = prompt('🔐 Ingrese la contraseña de administrador para borrar asistencia:');
        if (pass !== 'medina2026') return showToast('❌ Contraseña incorrecta');

        medinaAttendance = medinaAttendance.filter(a => a.id !== id);
        localStorage.setItem('medinaAttendance', JSON.stringify(medinaAttendance));
        renderMedinaAttendance();
        showToast('🗑 Registro eliminado');
    };

    // Medina Payroll Logic
    let medinaPayroll = JSON.parse(localStorage.getItem('medinaPayroll')) || [];
    let currentPayrollId = null;

    window.addMedinaPayrollEmployee = function() {
        if (medinaPayroll.length >= 10) return showToast('⚠️ Máximo 10 personas permitidas');
        
        const name = prompt('Ingrese el nombre del nuevo empleado:');
        if (!name) return;

        const newEmp = {
            id: Date.now(),
            name,
            quincena: 0,
            diario: 0,
            faltas: 0,
            otros: 0,
            impuestos: 0,
            total: 0
        };

        medinaPayroll.push(newEmp);
        localStorage.setItem('medinaPayroll', JSON.stringify(medinaPayroll));
        renderMedinaPayroll();
        showToast('👤 Empleado agregado');
    };

    window.renderMedinaPayroll = function() {
        const list = document.getElementById('payroll-list');
        const count = document.getElementById('payroll-count');
        if (!list) return;

        count.textContent = medinaPayroll.length;
        list.innerHTML = medinaPayroll.map(emp => `
            <div onclick="selectMedinaPayrollEmployee(${emp.id})" class="payroll-item ${currentPayrollId === emp.id ? 'active' : ''}" style="padding: 15px 20px; border-bottom: 1px solid var(--border); cursor: pointer; transition: 0.3s; display: flex; align-items: center; gap: 12px;">
                <div style="width: 35px; height: 35px; background: ${currentPayrollId === emp.id ? 'white' : 'var(--primary)'}; color: ${currentPayrollId === emp.id ? 'var(--primary)' : 'white'}; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 800;">
                    ${emp.name.charAt(0)}
                </div>
                <div>
                    <div style="font-weight: 700; font-size: 14px;">${emp.name}</div>
                    <div style="font-size: 11px; color: ${currentPayrollId === emp.id ? 'white' : 'var(--text-secondary)'}; opacity: 0.8;">Neto: $${emp.total.toLocaleString()}</div>
                </div>
            </div>
        `).join('');
    };

    window.selectMedinaPayrollEmployee = function(id) {
        currentPayrollId = id;
        const emp = medinaPayroll.find(e => e.id === id);
        if (!emp) return;

        document.getElementById('payroll-placeholder').style.display = 'none';
        document.getElementById('payroll-detail-container').style.display = 'flex';
        
        document.getElementById('p-det-name').textContent = emp.name;
        document.getElementById('p-det-quincena').value = emp.quincena;
        document.getElementById('p-det-faltas').value = emp.faltas;
        document.getElementById('p-det-h-desc').value = emp.h_desc || 0;
        document.getElementById('p-det-extras').value = emp.extras || 0;
        document.getElementById('p-det-festivos').value = emp.festivos || 0;
        document.getElementById('p-det-otros').value = emp.otros;
        document.getElementById('p-det-otros-concepto').value = emp.otros_concepto || '';
        document.getElementById('p-det-impuestos').value = emp.impuestos;
        document.getElementById('p-det-periodo').value = emp.periodo || '';
        document.getElementById('p-det-fecha-pago').value = emp.fecha_pago || '';

        updatePayrollCalculations();
        renderMedinaPayroll();
    };

    window.updatePayrollCalculations = function() {
        const quincena = parseFloat(document.getElementById('p-det-quincena').value) || 0;
        const faltas = parseInt(document.getElementById('p-det-faltas').value) || 0;
        const h_desc_hrs = parseFloat(document.getElementById('p-det-h-desc').value) || 0;
        const extras = parseFloat(document.getElementById('p-det-extras').value) || 0;
        const festivos = parseFloat(document.getElementById('p-det-festivos').value) || 0;
        const otros = parseFloat(document.getElementById('p-det-otros').value) || 0;
        const impPct = parseFloat(document.getElementById('p-det-impuestos').value) || 0;

        const diario = quincena / 15;
        const hora = diario / 8;
        
        const faltasDesc = diario * faltas;
        const hDescMonto = hora * h_desc_hrs;
        
        const subtotal = quincena + extras + festivos - faltasDesc - hDescMonto - otros;
        const impDesc = subtotal * (impPct / 100);
        const total = subtotal - impDesc;

        document.getElementById('p-det-diario').value = diario.toFixed(2);
        document.getElementById('p-det-hora').value = hora.toFixed(2);
        document.getElementById('p-det-faltas-desc').textContent = faltasDesc.toLocaleString(undefined, {minimumFractionDigits: 2});
        document.getElementById('p-det-h-desc-monto').textContent = hDescMonto.toLocaleString(undefined, {minimumFractionDigits: 2});
        document.getElementById('p-det-impuestos-desc').textContent = impDesc.toLocaleString(undefined, {minimumFractionDigits: 2});
        document.getElementById('p-det-total').textContent = total.toLocaleString(undefined, {minimumFractionDigits: 2});
    };

    window.saveMedinaPayrollData = function() {
        if (!currentPayrollId) return;
        const index = medinaPayroll.findIndex(e => e.id === currentPayrollId);
        if (index === -1) return;

        const quincena = parseFloat(document.getElementById('p-det-quincena').value) || 0;
        const faltas = parseInt(document.getElementById('p-det-faltas').value) || 0;
        const h_desc = parseFloat(document.getElementById('p-det-h-desc').value) || 0;
        const extras = parseFloat(document.getElementById('p-det-extras').value) || 0;
        const festivos = parseFloat(document.getElementById('p-det-festivos').value) || 0;
        const otros = parseFloat(document.getElementById('p-det-otros').value) || 0;
        const otros_concepto = document.getElementById('p-det-otros-concepto').value;
        const impPct = parseFloat(document.getElementById('p-det-impuestos').value) || 0;
        const periodo = document.getElementById('p-det-periodo').value;
        const fecha_pago = document.getElementById('p-det-fecha-pago').value;

        const total = parseFloat(document.getElementById('p-det-total').textContent.replace(/,/g, ''));

        medinaPayroll[index] = {
            ...medinaPayroll[index],
            quincena,
            diario: quincena / 15,
            hora: (quincena / 15) / 8,
            faltas,
            h_desc,
            extras,
            festivos,
            otros,
            otros_concepto,
            impuestos: impPct,
            periodo,
            fecha_pago,
            total
        };

        localStorage.setItem('medinaPayroll', JSON.stringify(medinaPayroll));
        renderMedinaPayroll();
        showToast('💾 Nómina guardada');
    };

    window.downloadMedinaPayrollPDF = function() {
        const emp = medinaPayroll.find(e => e.id === currentPayrollId);
        if (!emp) return;

        const element = document.createElement('div');
        element.style.padding = '40px';
        element.style.fontFamily = 'Inter, sans-serif';
        element.style.color = '#333';
        
        const subtotal = emp.quincena + emp.extras + emp.festivos;
        const deductions = (emp.diario * emp.faltas) + (emp.hora * emp.h_desc) + emp.otros;
        const taxes = (subtotal - deductions) * (emp.impuestos / 100);

        element.innerHTML = `
            <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #0066FF; padding-bottom: 20px; margin-bottom: 30px;">
                <div>
                    <h1 style="color: #0066FF; margin: 0; font-size: 24px;">CLÍNICA MEDINA</h1>
                    <p style="margin: 5px 0; color: #666;">Salud Puebla - Recibo de Nómina</p>
                </div>
                <div style="text-align: right;">
                    <p style="margin: 0; font-weight: 700;">FECHA DE PAGO: ${emp.fecha_pago || '--/--/--'}</p>
                    <p style="margin: 5px 0; color: #666;">PERIODO: ${emp.periodo || 'N/A'}</p>
                </div>
            </div>

            <div style="margin-bottom: 30px; background: #f8faff; padding: 20px; border-radius: 12px; border: 1px solid #e1e8f5;">
                <h2 style="margin: 0; font-size: 18px; color: #0066FF;">${emp.name.toUpperCase()}</h2>
                <p style="margin: 5px 0; font-size: 14px; color: #666;">Colaborador de Clínica Medina</p>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
                <div>
                    <h3 style="border-bottom: 1px solid #eee; padding-bottom: 10px; font-size: 14px; color: #0066FF;">PERCEPCIONES</h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                        <tr><td style="padding: 8px 0;">Salario Quincenal</td><td style="text-align: right; font-weight: 600;">$${emp.quincena.toLocaleString()}</td></tr>
                        <tr><td style="padding: 8px 0;">Horas Extras</td><td style="text-align: right; font-weight: 600;">$${(emp.extras || 0).toLocaleString()}</td></tr>
                        <tr><td style="padding: 8px 0;">Días Festivos</td><td style="text-align: right; font-weight: 600;">$${(emp.festivos || 0).toLocaleString()}</td></tr>
                        <tr style="border-top: 1px solid #eee;"><td style="padding: 12px 0; font-weight: 700;">Total Percepciones</td><td style="text-align: right; font-weight: 700; color: #10B981;">$${subtotal.toLocaleString()}</td></tr>
                    </table>
                </div>
                <div>
                    <h3 style="border-bottom: 1px solid #eee; padding-bottom: 10px; font-size: 14px; color: #EF4444;">DEDUCCIONES</h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                        <tr><td style="padding: 8px 0;">Faltas (${emp.faltas} días)</td><td style="text-align: right; font-weight: 600;">-$${(emp.diario * emp.faltas).toLocaleString()}</td></tr>
                        <tr><td style="padding: 8px 0;">Descuento Horas (${emp.h_desc} hrs)</td><td style="text-align: right; font-weight: 600;">-$${(emp.hora * emp.h_desc).toLocaleString()}</td></tr>
                        <tr><td style="padding: 8px 0;">${emp.otros_concepto || 'Otros Descuentos'}</td><td style="text-align: right; font-weight: 600;">-$${emp.otros.toLocaleString()}</td></tr>
                        <tr><td style="padding: 8px 0;">Retención Impuestos (${emp.impuestos}%)</td><td style="text-align: right; font-weight: 600;">-$${taxes.toLocaleString()}</td></tr>
                        <tr style="border-top: 1px solid #eee;"><td style="padding: 12px 0; font-weight: 700;">Total Deducciones</td><td style="text-align: right; font-weight: 700; color: #EF4444;">-$${(deductions + taxes).toLocaleString()}</td></tr>
                    </table>
                </div>
            </div>

            <div style="margin-top: 50px; padding: 25px; background: #0066FF; color: white; border-radius: 12px; text-align: right;">
                <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Neto a Recibir</p>
                <h2 style="margin: 5px 0 0; font-size: 32px; font-weight: 800;">$${emp.total.toLocaleString()}</h2>
            </div>

            <div style="margin-top: 80px; display: flex; justify-content: space-between;">
                <div style="text-align: center; width: 200px;">
                    <div style="border-bottom: 1px solid #333; margin-bottom: 10px;"></div>
                    <p style="font-size: 12px; color: #666;">Firma del Empleado</p>
                </div>
                <div style="text-align: center; width: 200px;">
                    <div style="border-bottom: 1px solid #333; margin-bottom: 10px;"></div>
                    <p style="font-size: 12px; color: #666;">Sello / Firma Patrón</p>
                </div>
            </div>
        `;

        const opt = {
            margin: 1,
            filename: `Nomina_${emp.name.replace(/ /g, '_')}_${emp.periodo.replace(/ /g, '_')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save();
    };

    window.deleteMedinaPayrollEmployee = function() {
        if (!currentPayrollId) return;
        if (!confirm('¿Eliminar a este empleado de la nómina?')) return;

        medinaPayroll = medinaPayroll.filter(e => e.id !== currentPayrollId);
        localStorage.setItem('medinaPayroll', JSON.stringify(medinaPayroll));
        
        currentPayrollId = null;
        document.getElementById('payroll-detail-container').style.display = 'none';
        document.getElementById('payroll-placeholder').style.display = 'flex';
        
        renderMedinaPayroll();
        showToast('🗑 Empleado eliminado');
    };

    // Update navigation to handle payroll
    const navItems = document.querySelectorAll('.nav-item[data-page]');
    const pages = document.querySelectorAll('.page-section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const pageName = item.getAttribute('data-page');
            const pageId = `page-${pageName}`;
            
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            pages.forEach(page => {
                page.classList.remove('active');
                if (page.id === pageId) page.classList.add('active');
            });

            if (pageName === 'attendance') {
                initMedinaCamera();
                renderMedinaAttendance();
            } else {
                stopMedinaCamera();
            }

            if (pageName === 'payroll') renderMedinaPayroll();
            if (pageName === 'hemodialysis') renderHemodialysis();
            if (pageName === 'memberships') renderMemberships();
            if (pageName === 'specialists') renderSpecialists();
            if (pageName === 'patients') renderPatients();
            if (pageName === 'financial') { renderMedinaFinances(); }
            if (pageName === 'inventory') renderMedinaInventory();
            if (pageName === 'schedule') renderMedinaAgenda();
        });
    });

    // Initial load
    renderPatients();
    renderMemberships();
    renderMedinaFinances();
    renderMedinaAgenda();
    renderMedinaInventory();
    renderMedinaAttendance();
    renderMedinaPayroll();
});
