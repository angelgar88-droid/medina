import { createClient } from 'https://esm.sh/@supabase/supabase-js'

const supabaseUrl = 'https://fpjspvbmgqojbqemnxuw.supabase.co'
const supabaseKey = 'sb_publishable_pbW1NAGZsVpqV66aVmJpig_7Dfelmca'

const supabase = createClient(supabaseUrl, supabaseKey)

document.addEventListener('DOMContentLoaded', () => {
    // Login System
    const loginScreen = document.getElementById('login-screen');
    const appScreen = document.getElementById('app');
    const errorMsg = document.getElementById('login-error');

    // Check if already logged in
    if (localStorage.getItem('medinaLoggedIn') === 'true') {
        loginScreen.style.display = 'none';
        appScreen.style.display = 'flex';
    }

    window.handleLogin = function () {
        const user = document.getElementById('login-username').value;
        const pass = document.getElementById('login-password').value;

        if (user === 'clinica' && pass === 'medina') {
            localStorage.setItem('medinaLoggedIn', 'true');
            loginScreen.style.display = 'none';
            appScreen.style.display = 'flex';
            errorMsg.style.display = 'none';
        } else {
            errorMsg.style.display = 'block';
        }
    };

    // Logout functionality
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('medinaLoggedIn');
            appScreen.style.display = 'none';
            loginScreen.style.display = 'flex';
            document.getElementById('login-username').value = '';
            document.getElementById('login-password').value = '';
        });
    }

    // State Management
    let patients = [];
    let currentPatientId = null;

    // Supabase Patients CRUD
    async function fetchPatients() {
        const { data, error } = await supabase
            .from('pacientes')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching patients:', error);
        } else {
            patients = data;
            renderPatients();
        }
    }

    function subscribePatients() {
        supabase
            .channel('realtime-pacientes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'pacientes' }, payload => {
                fetchPatients();
            })
            .subscribe();
    }

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
    window.openModal = function (id) {
        document.getElementById(id).style.display = 'flex';
    };

    window.closeModal = function (id) {
        document.getElementById(id).style.display = 'none';
    };


    // AI Assistant Toggle
    const aiAssistantBtn = document.getElementById('ai-assistant');
    const aiModal = document.getElementById('ai-modal');
    aiAssistantBtn.addEventListener('click', () => aiModal.style.display = aiModal.style.display === 'flex' ? 'none' : 'flex');
    document.getElementById('close-ai').addEventListener('click', () => aiModal.style.display = 'none');


    // Patients Logic
    window.renderPatients = function () {
        const grid = document.getElementById('patients-list');
        if (!grid) return;
        grid.innerHTML = (patients || []).map(p => `
            <div class="glass-card" style="padding: 20px; display: flex; flex-direction: column; gap: 15px; cursor: pointer; position: relative;">
                <div style="position: absolute; top: 15px; right: 15px; display: flex; gap: 10px;">
                    <i class="fas fa-trash" onclick="deletePatient(${p.id}); event.stopPropagation();" style="color: var(--danger); font-size: 14px; opacity: 0.6; cursor: pointer;"></i>
                </div>
                <div onclick="openPatientExpediente(${p.id})" style="display: flex; gap: 15px;">
                    <div style="width: 50px; height: 50px; background: var(--primary); border-radius: 14px; display: flex; align-items: center; justify-content: center; color: white;">
                        <i class="fas fa-user-injured" style="font-size: 20px;"></i>
                    </div>
                    <div>
                        <h4 style="font-weight: 700;">${p.nombre}</h4>
                        <p style="font-size: 12px; color: var(--text-secondary);">Tel: ${p.telefono || 'N/A'}</p>
                        <p style="font-size: 11px; color: var(--text-secondary);">Fecha: ${p.fecha || 'N/A'}</p>
                    </div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 15px;">
                    <span style="font-size: 11px; font-weight: 700; color: var(--primary); text-transform: uppercase;">ID: ${p.id}</span>
                </div>
            </div>
        `).join('');
    };

    window.saveNewPatient = async function () {
        const nombre = document.getElementById('new-patient-name').value;
        const telefono = document.getElementById('new-patient-phone').value;
        const fecha = document.getElementById('new-patient-date').value;

        if (!nombre || !telefono) return alert('Por favor llene nombre y teléfono');

        const { error } = await supabase
            .from('pacientes')
            .insert([{ nombre, telefono, fecha }]);

        if (error) {
            alert('Error al guardar: ' + error.message);
        } else {
            showToast('✅ Paciente guardado en Supabase');
            closeModal('add-patient-modal');
            // Reset fields
            document.getElementById('new-patient-name').value = '';
            document.getElementById('new-patient-phone').value = '';
            document.getElementById('new-patient-date').value = '';
            // renderPatients is handled by realtime subscription
        }
    };

    window.deletePatient = async function (id) {
        if (!confirm('¿Seguro que desea eliminar este paciente?')) return;

        const { error } = await supabase
            .from('pacientes')
            .delete()
            .eq('id', id);

        if (error) {
            alert('Error al eliminar: ' + error.message);
        } else {
            showToast('🗑️ Paciente eliminado');
            // renderPatients is handled by realtime subscription
        }
    };

    window.openPatientExpediente = function (id) {
        currentPatientId = Number(id);
        const patient = patients.find(p => p.id == currentPatientId);
        if (!patient) return console.error('Paciente no encontrado:', id);
        document.getElementById('modal-patient-name').textContent = `Expediente: ${patient.nombre}`;
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

    document.getElementById('file-input').addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (!file) return;
        if (file.type !== 'application/pdf') return alert('Solo se permiten archivos PDF');

        const reader = new FileReader();
        reader.onload = function (event) {
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
        reader.onerror = function () {
            alert('Error al leer el archivo. Intente con uno más pequeño.');
        };
        reader.readAsDataURL(file);
    });

    window.deleteFile = function (index) {
        if (!confirm('¿Eliminar este documento?')) return;
        const patient = patients.find(p => p.id === currentPatientId);
        patient.files.splice(index, 1);
        saveState();
        renderFilesList();
        renderPatients();
    };

    // Other renders

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

    window.saveMedinaGasto = function () {
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

    window.saveMedinaIngreso = function () {
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

    window.renderMedinaFinances = function () {
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
        if (document.getElementById('medina-total-ingresos')) document.getElementById('medina-total-ingresos').textContent = `$${totalI.toLocaleString()}`;
        if (document.getElementById('medina-total-gastos')) document.getElementById('medina-total-gastos').textContent = `$${totalG.toLocaleString()}`;

        const balanceEl = document.getElementById('medina-balance-neto');
        if (balanceEl) {
            balanceEl.textContent = `$${balance.toLocaleString()}`;
            balanceEl.style.color = balance >= 0 ? 'var(--success)' : 'var(--danger)';
        }
    };

    window.deleteMedinaGasto = function (id) {
        const pass = prompt('🔐 Ingrese la contraseña de administrador para eliminar este registro:');
        if (pass !== 'medina2026') return showToast('❌ Contraseña incorrecta');

        if (!confirm('¿Eliminar este registro de gasto?')) return;
        medinaGastos = medinaGastos.filter(g => g.id !== id);
        localStorage.setItem('medinaGastos', JSON.stringify(medinaGastos));
        renderMedinaFinances();
        showToast('🗑 Gasto eliminado');
    };

    window.deleteMedinaIngreso = function (id) {
        const pass = prompt('🔐 Ingrese la contraseña de administrador para eliminar este registro:');
        if (pass !== 'medina2026') return showToast('❌ Contraseña incorrecta');

        if (!confirm('¿Eliminar este registro de ingreso?')) return;
        medinaIngresos = medinaIngresos.filter(i => i.id !== id);
        localStorage.setItem('medinaIngresos', JSON.stringify(medinaIngresos));
        renderMedinaFinances();
        showToast('🗑 Ingreso eliminado');
    };

    window.resetMedinaFinances = function () {
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


    // Medina Inventory Logic
    let medinaInventory = JSON.parse(localStorage.getItem('medinaInventory')) || [
        { id: 1, name: 'Eritropoyetina 4000 UI', category: 'Medicamento', lote: 'EP-2024-01', expiry: '2025-12-30', gramaje: '1ml', stock: 45 },
        { id: 2, name: 'Gasas Estériles', category: 'Insumos', lote: 'GE-2024-X', expiry: '2026-06-15', gramaje: 'N/A', stock: 120 },
        { id: 3, name: 'Solución Salina 0.9%', category: 'General', lote: 'SS-500-B', expiry: '2025-08-20', gramaje: '500ml', stock: 200 }
    ];
    let medinaInvMovements = JSON.parse(localStorage.getItem('medinaInvMovements')) || [];

    window.renderMedinaInventory = function () {
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

        if (document.getElementById('inv-total-products')) document.getElementById('inv-total-products').textContent = totalProds;
        if (document.getElementById('inv-critical-stock')) document.getElementById('inv-critical-stock').textContent = critical;
        if (document.getElementById('inv-movements-today')) document.getElementById('inv-movements-today').textContent = movementsToday;
    }

    window.saveMedinaProduct = function () {
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

    window.saveMedinaInvMovement = function () {
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

    window.deleteMedinaProduct = function (id) {
        if (!confirm('¿Eliminar este producto del inventario?')) return;
        medinaInventory = medinaInventory.filter(p => p.id !== id);
        localStorage.setItem('medinaInventory', JSON.stringify(medinaInventory));
        renderMedinaInventory();
        showToast('🗑 Producto eliminado');
    };

    // Medina Attendance Logic
    let medinaAttendance = JSON.parse(localStorage.getItem('medinaAttendance')) || [];
    let attStream = null;

    window.initMedinaCamera = async function () {
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

    window.stopMedinaCamera = function () {
        if (attStream) {
            attStream.getTracks().forEach(track => track.stop());
            attStream = null;
        }
    };

    window.registerMedinaAttendance = function () {
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

    window.renderMedinaAttendance = function () {
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

    window.deleteMedinaAttendance = function (id) {
        const pass = prompt('🔐 Ingrese la contraseña de administrador para borrar asistencia:');
        if (pass !== 'medina2026') return showToast('❌ Contraseña incorrecta');

        medinaAttendance = medinaAttendance.filter(a => a.id !== id);
        localStorage.setItem('medinaAttendance', JSON.stringify(medinaAttendance));
        renderMedinaAttendance();
        showToast('🗑 Registro eliminado');
    };

    // Medina Payroll Logic
    let nominaRecords = [];
    let currentNominaId = null;

    async function fetchNomina() {
        const { data, error } = await supabase
            .from('nomina')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching nomina:', error);
        } else {
            nominaRecords = data || [];
            renderMedinaPayroll();
        }
    }

    function subscribeNomina() {
        supabase
            .channel('realtime-nomina')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'nomina' }, payload => {
                fetchNomina();
            })
            .subscribe();
    }

    window.newMedinaPayrollRecord = function () {
        currentNominaId = null;
        document.getElementById('payroll-placeholder').style.display = 'none';
        document.getElementById('payroll-detail-container').style.display = 'flex';

        document.getElementById('p-det-name').value = '';
        document.getElementById('p-det-puesto').value = '';
        document.getElementById('p-det-periodo-inicio').value = '';
        document.getElementById('p-det-periodo-fin').value = '';
        document.getElementById('p-det-sueldo').value = 0;
        document.getElementById('p-det-bonos').value = 0;
        document.getElementById('p-det-descuentos').value = 0;
        document.getElementById('p-det-estado').value = 'pendiente';
        document.getElementById('p-det-notas').value = '';

        updatePayrollCalculations();
        renderMedinaPayroll();
    };

    window.renderMedinaPayroll = function () {
        const list = document.getElementById('payroll-list');
        const count = document.getElementById('payroll-count');
        if (!list) return;

        count.textContent = nominaRecords.length;
        list.innerHTML = nominaRecords.map(nom => `
            <div onclick="selectMedinaPayrollEmployee('${nom.id}')" class="payroll-item ${currentNominaId === nom.id ? 'active' : ''}" style="padding: 15px 20px; border-bottom: 1px solid var(--border); cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: space-between; gap: 12px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 35px; height: 35px; background: ${currentNominaId === nom.id ? 'white' : 'var(--primary)'}; color: ${currentNominaId === nom.id ? 'var(--primary)' : 'white'}; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 800;">
                        ${nom.empleado_nombre ? nom.empleado_nombre.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div>
                        <div style="font-weight: 700; font-size: 14px;">${nom.empleado_nombre || 'Sin nombre'}</div>
                        <div style="font-size: 11px; color: ${currentNominaId === nom.id ? 'white' : 'var(--text-secondary)'}; opacity: 0.8;">Neto: $${(nom.total_pagar || 0).toLocaleString()}</div>
                    </div>
                </div>
                <div>
                    <span style="font-size: 10px; padding: 3px 8px; border-radius: 20px; font-weight: 600; 
                        ${nom.estado === 'pagado' ? 'background: rgba(16,185,129,0.2); color: var(--success);' :
                nom.estado === 'cancelado' ? 'background: rgba(239,68,68,0.2); color: var(--danger);' :
                    'background: rgba(245,158,11,0.2); color: #F59E0B;'}">
                        ${nom.estado ? nom.estado.toUpperCase() : 'PENDIENTE'}
                    </span>
                </div>
            </div>
        `).join('');
    };

    window.selectMedinaPayrollEmployee = function (id) {
        currentNominaId = id;
        const nom = nominaRecords.find(n => n.id === id);
        if (!nom) return;

        document.getElementById('payroll-placeholder').style.display = 'none';
        document.getElementById('payroll-detail-container').style.display = 'flex';

        document.getElementById('p-det-name').value = nom.empleado_nombre || '';
        document.getElementById('p-det-puesto').value = nom.puesto || '';
        document.getElementById('p-det-periodo-inicio').value = nom.periodo_inicio || '';
        document.getElementById('p-det-periodo-fin').value = nom.periodo_fin || '';
        document.getElementById('p-det-sueldo').value = nom.sueldo_base || 0;
        document.getElementById('p-det-bonos').value = nom.bonos || 0;
        document.getElementById('p-det-descuentos').value = nom.descuentos || 0;
        document.getElementById('p-det-estado').value = nom.estado || 'pendiente';
        document.getElementById('p-det-notas').value = nom.notas || '';

        updatePayrollCalculations();
        renderMedinaPayroll();
    };

    window.updatePayrollCalculations = function () {
        const sueldo_base = parseFloat(document.getElementById('p-det-sueldo').value) || 0;
        const bonos = parseFloat(document.getElementById('p-det-bonos').value) || 0;
        const descuentos = parseFloat(document.getElementById('p-det-descuentos').value) || 0;

        const total_pagar = sueldo_base + bonos - descuentos;

        document.getElementById('p-det-total').textContent = total_pagar.toLocaleString(undefined, { minimumFractionDigits: 2 });
    };

    window.saveMedinaPayrollData = async function () {
        const empleado_nombre = document.getElementById('p-det-name').value.trim();
        const puesto = document.getElementById('p-det-puesto').value.trim();
        const periodo_inicio = document.getElementById('p-det-periodo-inicio').value;
        const periodo_fin = document.getElementById('p-det-periodo-fin').value;
        const sueldo_base = parseFloat(document.getElementById('p-det-sueldo').value) || 0;
        const bonos = parseFloat(document.getElementById('p-det-bonos').value) || 0;
        const descuentos = parseFloat(document.getElementById('p-det-descuentos').value) || 0;
        const estado = document.getElementById('p-det-estado').value;
        const notas = document.getElementById('p-det-notas').value.trim();

        const total_pagar = sueldo_base + bonos - descuentos;

        if (!empleado_nombre) {
            showToast('⚠️ Ingresa el nombre del empleado');
            return;
        }

        const payload = {
            empleado_nombre,
            puesto,
            periodo_inicio: periodo_inicio || null,
            periodo_fin: periodo_fin || null,
            sueldo_base,
            bonos,
            descuentos,
            total_pagar,
            estado,
            notas
        };

        let error;
        if (currentNominaId) {
            const res = await supabase.from('nomina').update(payload).eq('id', currentNominaId);
            error = res.error;
        } else {
            const res = await supabase.from('nomina').insert([payload]);
            error = res.error;
        }

        if (error) {
            alert('Error al guardar nómina: ' + error.message);
        } else {
            showToast('💾 Nómina guardada correctamente');
            if (!currentNominaId) {
                newMedinaPayrollRecord(); // Reset format for next creation
            }
        }
    };

    window.downloadMedinaPayrollPDF = function () {
        if (!currentNominaId) return;
        const nom = nominaRecords.find(e => e.id === currentNominaId);
        if (!nom) return;

        const element = document.createElement('div');
        element.style.padding = '40px';
        element.style.fontFamily = 'Inter, sans-serif';
        element.style.color = '#333';

        element.innerHTML = `
            <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #0066FF; padding-bottom: 20px; margin-bottom: 30px;">
                <div>
                    <h1 style="color: #0066FF; margin: 0; font-size: 24px;">CLÍNICA MEDINA</h1>
                    <p style="margin: 5px 0; color: #666;">Recibo de Nómina</p>
                </div>
                <div style="text-align: right;">
                    <p style="margin: 0; font-weight: 700;">ESTADO: ${nom.estado ? nom.estado.toUpperCase() : 'PENDIENTE'}</p>
                    <p style="margin: 5px 0; color: #666;">PERIODO: ${nom.periodo_inicio || '--'} AL ${nom.periodo_fin || '--'}</p>
                </div>
            </div>

            <div style="margin-bottom: 30px; background: #f8faff; padding: 20px; border-radius: 12px; border: 1px solid #e1e8f5;">
                <h2 style="margin: 0; font-size: 18px; color: #0066FF;">${(nom.empleado_nombre || '').toUpperCase()}</h2>
                <p style="margin: 5px 0; font-size: 14px; color: #666;">Puesto: ${nom.puesto || 'N/A'}</p>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
                <div>
                    <h3 style="border-bottom: 1px solid #eee; padding-bottom: 10px; font-size: 14px; color: #0066FF;">PERCEPCIONES</h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                        <tr><td style="padding: 8px 0;">Sueldo Base</td><td style="text-align: right; font-weight: 600;">$${(nom.sueldo_base || 0).toLocaleString()}</td></tr>
                        <tr><td style="padding: 8px 0;">Bonos / Extras</td><td style="text-align: right; font-weight: 600;">$${(nom.bonos || 0).toLocaleString()}</td></tr>
                        <tr style="border-top: 1px solid #eee;"><td style="padding: 12px 0; font-weight: 700;">Total Percepciones</td><td style="text-align: right; font-weight: 700; color: #10B981;">$${((nom.sueldo_base || 0) + (nom.bonos || 0)).toLocaleString()}</td></tr>
                    </table>
                </div>
                <div>
                    <h3 style="border-bottom: 1px solid #eee; padding-bottom: 10px; font-size: 14px; color: #EF4444;">DEDUCCIONES</h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                        <tr><td style="padding: 8px 0;">Descuentos</td><td style="text-align: right; font-weight: 600;">-$${(nom.descuentos || 0).toLocaleString()}</td></tr>
                        <tr style="border-top: 1px solid #eee;"><td style="padding: 12px 0; font-weight: 700;">Total Deducciones</td><td style="text-align: right; font-weight: 700; color: #EF4444;">-$${(nom.descuentos || 0).toLocaleString()}</td></tr>
                    </table>
                </div>
            </div>

            <div style="margin-top: 50px; padding: 25px; background: #0066FF; color: white; border-radius: 12px; text-align: right;">
                <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Neto a Pagar</p>
                <h2 style="margin: 5px 0 0; font-size: 32px; font-weight: 800;">$${(nom.total_pagar || 0).toLocaleString()}</h2>
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
            filename: `Nomina_${(nom.empleado_nombre || 'Empleado').replace(/ /g, '_')}_${(nom.periodo_inicio || 'fecha')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save();
    };

    window.deleteMedinaPayrollEmployee = async function () {
        if (!currentNominaId) return;
        if (!confirm('¿Eliminar a este registro de nómina?')) return;

        const { error } = await supabase.from('nomina').delete().eq('id', currentNominaId);

        if (error) {
            alert('Error al eliminar nómina: ' + error.message);
        } else {
            currentNominaId = null;
            document.getElementById('payroll-detail-container').style.display = 'none';
            document.getElementById('payroll-placeholder').style.display = 'flex';
            showToast('🗑 Registro eliminado');
        }
    };

    // Mobile Menu Toggle
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const aside = document.querySelector('aside');
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
            aside.classList.toggle('mobile-active');
        });
    }

    // Update navigation to handle payroll and mobile behavior
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

            // Close mobile menu after navigation
            if (window.innerWidth <= 768) {
                aside.classList.remove('mobile-active');
            }

            if (pageName === 'attendance') {
                initMedinaCamera();
                renderMedinaAttendance();
            } else {
                stopMedinaCamera();
            }

            if (pageName === 'payroll') renderMedinaPayroll();
            if (pageName === 'memberships') renderMemberships();
            if (pageName === 'specialists') renderSpecialists();
            if (pageName === 'patients') renderPatients();
            if (pageName === 'financial') renderMedinaFinances();
            if (pageName === 'inventory') renderMedinaInventory();
            if (pageName === 'agenda') renderMedinaAgenda();
        });
    });

    // --- AGENDA LOGIC ---
    let citasAgenda = [];

    async function fetchCitasAgenda() {
        const { data, error } = await supabase
            .from('citas')
            .select('*')
            .order('created_at', { ascending: true }); // Mantiene el orden de creación para rellenar los slots

        if (error) {
            console.error('Error fetching citas:', error);
        } else {
            citasAgenda = data || [];
            renderMedinaAgenda();
        }
    }

    function subscribeCitasAgenda() {
        supabase
            .channel('realtime-citas')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'citas' }, payload => {
                fetchCitasAgenda();
            })
            .subscribe();
    }

    let currentAgendaWeekStart = new Date();
    currentAgendaWeekStart.setHours(0, 0, 0, 0);
    const agDay = currentAgendaWeekStart.getDay();
    const agDiff = currentAgendaWeekStart.getDate() - agDay + (agDay === 0 ? -6 : 1);
    currentAgendaWeekStart.setDate(agDiff);

    window.changeAgendaWeek = function (offset) {
        currentAgendaWeekStart.setDate(currentAgendaWeekStart.getDate() + (offset * 7));
        renderMedinaAgenda();
    };

    function formatDateForAgenda(d) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    window.renderMedinaAgenda = function () {
        const grid = document.getElementById('agenda-grid');
        if (!grid) return;

        try {
            // Update Label
            const endOfWeek = new Date(currentAgendaWeekStart);
            endOfWeek.setDate(currentAgendaWeekStart.getDate() + 5); // Saturday
            const options = { month: 'short', day: 'numeric' };
            document.getElementById('agenda-week-label').textContent =
                `Del ${currentAgendaWeekStart.toLocaleDateString('es-ES', options)} al ${endOfWeek.toLocaleDateString('es-ES', options)}`;

            // Build map from citas array
            const agendaMap = {};
            citasAgenda.forEach(cita => {
                if (!agendaMap[cita.fecha]) agendaMap[cita.fecha] = {};
                if (!agendaMap[cita.fecha][cita.hora]) agendaMap[cita.fecha][cita.hora] = [];
                agendaMap[cita.fecha][cita.hora].push(cita);
            });

            let html = '<div class="agenda-grid-container">';

            // Header
            html += `<div class="agenda-header-cell">Hora</div>`;
            const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            const datesThisWeek = [];
            for (let i = 0; i < 6; i++) {
                let d = new Date(currentAgendaWeekStart);
                d.setDate(currentAgendaWeekStart.getDate() + i);
                datesThisWeek.push(d);
                html += `<div class="agenda-header-cell">${days[i]}<br><small style="font-weight: normal;">${d.getDate()}</small></div>`;
            }
            html += '</div>';

            const shifts = ['07:00 am', '11:00 am', '15:00 pm'];
            shifts.forEach(shift => {
                html += '<div class="agenda-grid-container">';
                html += `<div class="agenda-time-cell">${shift}</div>`;

                for (let d = 0; d < 6; d++) {
                    const dateStr = formatDateForAgenda(datesThisWeek[d]);
                    html += `<div class="agenda-day-col">`;

                    const citasDelTurno = agendaMap[dateStr]?.[shift] || [];

                    for (let slot = 0; slot < 4; slot++) {
                        const data = citasDelTurno[slot];
                        if (data) {
                            html += `<div class="agenda-slot ${data.estado}" onclick="openAgendaModal('${dateStr}', '${shift}', '${data.id}')">${data.paciente_nombre}</div>`;
                        } else {
                            html += `<div class="agenda-slot" onclick="openAgendaModal('${dateStr}', '${shift}', null)"><i class="fas fa-plus"></i></div>`;
                        }
                    }
                    html += `</div>`;
                }
                html += '</div>';
            });

            grid.innerHTML = html;
        } catch (error) {
            grid.innerHTML = `<div style="padding: 20px; color: red;">Error: ${error.message}</div>`;
            console.error(error);
        }
    };

    window.openAgendaModal = function (dateStr, time, id) {
        document.getElementById('agenda-date').value = dateStr;
        document.getElementById('agenda-time').value = time;
        document.getElementById('agenda-id').value = id || '';

        if (id) {
            const data = citasAgenda.find(c => c.id === id);
            if (data) {
                document.getElementById('agenda-patient-name').value = data.paciente_nombre || '';
                document.getElementById('agenda-patient-type').value = data.estado || 'fijo';
                document.getElementById('agenda-notas').value = data.notas || '';
            }
        } else {
            document.getElementById('agenda-patient-name').value = '';
            document.getElementById('agenda-patient-type').value = 'fijo';
            document.getElementById('agenda-notas').value = '';
        }

        document.getElementById('agenda-modal').style.display = 'flex';
    };

    window.saveAgendaSlot = async function () {
        const id = document.getElementById('agenda-id').value;
        const fecha = document.getElementById('agenda-date').value;
        const hora = document.getElementById('agenda-time').value;
        const paciente_nombre = document.getElementById('agenda-patient-name').value.trim();
        const estado = document.getElementById('agenda-patient-type').value;
        const notas = document.getElementById('agenda-notas').value.trim();

        if (!paciente_nombre) {
            showToast('⚠️ Ingresa el nombre del paciente');
            return;
        }

        const payload = { fecha, hora, paciente_nombre, estado, notas };

        let error;
        if (id) {
            const res = await supabase.from('citas').update(payload).eq('id', id);
            error = res.error;
        } else {
            const res = await supabase.from('citas').insert([payload]);
            error = res.error;
        }

        if (error) {
            alert('Error al guardar cita: ' + error.message);
        } else {
            closeModal('agenda-modal');
            showToast('✅ Turno guardado');
        }
    };

    window.deleteAgendaSlot = async function () {
        const id = document.getElementById('agenda-id').value;
        if (!id) {
            closeModal('agenda-modal');
            return;
        }

        if (!confirm('¿Seguro que desea liberar este turno?')) return;

        const { error } = await supabase.from('citas').delete().eq('id', id);

        if (error) {
            alert('Error al eliminar cita: ' + error.message);
        } else {
            closeModal('agenda-modal');
            showToast('🗑 Turno liberado');
        }
    };

    // Initial load
    fetchPatients();
    subscribePatients();
    fetchCitasAgenda();
    subscribeCitasAgenda();
    fetchNomina();
    subscribeNomina();
    renderMemberships();
    renderMedinaFinances();
    renderMedinaInventory();
    renderMedinaAttendance();
    renderMedinaPayroll();
    renderMedinaAgenda();
});
