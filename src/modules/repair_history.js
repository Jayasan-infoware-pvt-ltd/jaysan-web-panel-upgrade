import { supabase } from '../supabase.js';
import { Search, Download, MoreVertical, Eye, Trash2, X } from 'lucide';

export async function initRepairHistory(container, storeId = null) {
    container.innerHTML = `
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h2 class="text-3xl font-bold text-slate-800">Repair History</h2>
                <button id="export-repairs-btn" class="btn-secondary flex items-center gap-2 text-sm">
                    <i data-lucide="download" class="w-4 h-4"></i> Export CSV
                </button>
            </div>

            <div class="card p-4 flex gap-4">
                 <div class="relative flex-1">
                    <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none"></i>
                    <input type="text" id="search-repair" placeholder="Search customer, device or status..." class="input-field pl-12" />
                </div>
            </div>

            <div class="card overflow-hidden relative">
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm text-slate-600">
                        <thead class="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                            <tr>
                                <th class="p-4">Date</th>
                                <th class="p-4">Customer</th>
                                <th class="p-4">Device</th>
                                <th class="p-4">Model No.</th>
                                <th class="p-4">Description</th>
                                <th class="p-4">Status</th>
                                <th class="p-4 text-right">Cost</th>
                                <th class="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="repair-list-body" class="divide-y divide-slate-100">
                            <tr><td colspan="8" class="p-8 text-center">Loading...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        

        <!-- Modal for Full Details -->
        <div id="detail-modal" class="fixed inset-0 z-50 hidden bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div class="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 class="text-lg font-bold text-slate-800">Repair Details</h3>
                    <button id="close-modal-btn" class="text-slate-400 hover:text-red-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                </div>
                <div id="modal-content" class="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    <!-- Content injected via JS -->
                </div>
                <div class="px-6 py-4 bg-slate-50 flex justify-end gap-3">
                    <button id="close-modal-action" class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-medium transition-colors">Close</button>
                    <button id="edit-repair-from-view-btn" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium transition-colors flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                        Edit
                    </button>
                </div>
            </div>
        </div>

        <!-- Edit Modal for Repair -->
        <div id="edit-repair-modal" class="fixed inset-0 z-[60] hidden bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div class="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 class="text-lg font-bold text-slate-800">Edit Repair</h3>
                    <button id="close-edit-repair-btn" class="text-slate-400 hover:text-red-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                </div>
                <form id="edit-repair-form" class="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    <input type="hidden" id="edit-repair-id">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="col-span-2">
                            <label class="block text-sm font-medium text-slate-700 mb-1">Customer Name</label>
                            <input type="text" id="edit-cust-name" class="input-field" required>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Contact Number</label>
                            <input type="text" id="edit-cust-contact" class="input-field">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Technician</label>
                            <input type="text" id="edit-technician" class="input-field">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Device</label>
                            <input type="text" id="edit-device" class="input-field" required>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Model Number</label>
                            <input type="text" id="edit-model" class="input-field">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Status</label>
                            <select id="edit-status" class="input-field">
                                <option value="Received">Received</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Repaired">Repaired</option>
                                <option value="Part Not Available">Part Not Available</option>
                                <option value="Delivered">Delivered</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Estimated Cost (₹)</label>
                            <input type="number" id="edit-cost" class="input-field" min="0" value="0">
                        </div>
                        <div class="col-span-2">
                            <label class="block text-sm font-medium text-slate-700 mb-1">Part Replaced</label>
                            <input type="text" id="edit-part" class="input-field" placeholder="None">
                        </div>
                        <div class="col-span-2">
                            <label class="block text-sm font-medium text-slate-700 mb-1">Issue Description</label>
                            <textarea id="edit-issue" class="input-field" rows="3"></textarea>
                        </div>
                    </div>
                </form>
                <div class="px-6 py-4 bg-slate-50 flex justify-end gap-3">
                    <button id="cancel-edit-repair-btn" type="button" class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-medium transition-colors">Cancel</button>
                    <button id="save-edit-repair-btn" type="button" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium transition-colors flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v13a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();
    const tbody = container.querySelector('#repair-list-body');
    const searchInput = container.querySelector('#search-repair');

    // --- Body-Level Popup Menu Setup ---
    let popupMenu = document.getElementById('repair-action-menu');
    if (popupMenu) popupMenu.remove();

    popupMenu = document.createElement('div');
    popupMenu.id = 'repair-action-menu';
    popupMenu.className = 'hidden fixed z-[500] bg-white rounded-lg shadow-lg border border-slate-100 w-40 py-1';
    popupMenu.style.transition = 'opacity 150ms ease, transform 150ms ease';
    popupMenu.innerHTML = `
        <button id="repair-popup-view" class="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            View Detail
        </button>
        <div class="border-t border-slate-100 my-1"></div>
        <button id="repair-popup-edit" class="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
            Edit
        </button>
        <div class="border-t border-slate-100 my-1"></div>
        <button id="repair-popup-delete" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            Delete
        </button>
    `;
    document.body.appendChild(popupMenu);

    let currentActiveId = null;

    function showPopup(btn, id) {
        const rect = btn.getBoundingClientRect();
        currentActiveId = id;

        popupMenu.style.opacity = '0';
        popupMenu.style.transform = 'scale(0.95)';
        popupMenu.classList.remove('hidden');

        const menuHeight = popupMenu.offsetHeight;
        const menuWidth = popupMenu.offsetWidth;

        let top = rect.bottom + 5;
        if (top + menuHeight > window.innerHeight) {
            top = rect.top - menuHeight - 5;
        }

        let left = rect.right - menuWidth;
        if (left < 10) left = 10;

        popupMenu.style.top = `${top}px`;
        popupMenu.style.left = `${left}px`;

        requestAnimationFrame(() => {
            popupMenu.style.opacity = '1';
            popupMenu.style.transform = 'scale(1)';
        });

        // Bind buttons
        const viewBtn = popupMenu.querySelector('#repair-popup-view');
        const editBtn = popupMenu.querySelector('#repair-popup-edit');
        const deleteBtn = popupMenu.querySelector('#repair-popup-delete');

        viewBtn.onclick = () => {
            const repair = repairs.find(r => r.id == currentActiveId);
            if (repair) openModal(repair);
            hidePopup();
        };

        editBtn.onclick = () => {
            const repair = repairs.find(r => r.id == currentActiveId);
            if (repair) openEditModal(repair);
            hidePopup();
        };

        deleteBtn.onclick = async () => {
            const idToDelete = currentActiveId;
            hidePopup();
            const adminPass = prompt("Enter Developer Password to DELETE:");
            if (adminPass !== "Jayasan@9045") {
                alert("Incorrect Password!");
                return;
            }
            if (confirm('Delete this repair entry permanently?')) {
                const { error } = await supabase.from('repairs').delete().eq('id', idToDelete);
                if (error) alert(error.message);
                else fetchRepairs();
            }
        };
    }

    function hidePopup() {
        if (popupMenu) {
            popupMenu.classList.add('hidden');
            popupMenu.style.opacity = '';
            popupMenu.style.transform = '';
        }
        currentActiveId = null;
    }

    const handleGlobalClick = (e) => {
        if (!popupMenu.contains(e.target) && !e.target.closest('.menu-trigger')) {
            hidePopup();
        }
    };
    document.addEventListener('click', handleGlobalClick);

    // --- Modal Logic ---
    const modal = container.querySelector('#detail-modal');
    const modalContent = container.querySelector('#modal-content');
    const closeModalBtns = [container.querySelector('#close-modal-btn'), container.querySelector('#close-modal-action')];

    // "Edit" button inside view modal footer
    const editFromViewBtn = container.querySelector('#edit-repair-from-view-btn');
    let currentViewRepair = null;

    function openModal(repair) {
        // store for edit-from-view
        currentViewRepair = repair;
        hidePopup();
        modalContent.innerHTML = `
            <div class="grid grid-cols-2 gap-4">
                <div class="col-span-2">
                    <label class="text-xs font-bold text-slate-400 uppercase">Customer Info</label>
                    <div class="text-slate-800 font-medium">${repair.customer_name}</div>
                    <div class="text-slate-500 text-sm">${repair.contact_number || 'No contact'}</div>
                </div>
                
                <div>
                    <label class="text-xs font-bold text-slate-400 uppercase">Device</label>
                    <div class="text-slate-800 font-medium">${repair.device_details}</div>
                    <div class="text-xs text-slate-500">Model: ${repair.model_number || '-'}</div>
                </div>

                <div>
                    <label class="text-xs font-bold text-slate-400 uppercase">Serial No.</label>
                    <div class="text-slate-800 font-mono">${repair.serial_number || '-'}</div>
                </div>

                <div>
                    <label class="text-xs font-bold text-slate-400 uppercase">Technician</label>
                    <div class="text-slate-800">${repair.technician_name || '-'}</div>
                </div>

                <div>
                    <label class="text-xs font-bold text-slate-400 uppercase">Status</label>
                    <div class="mt-1 inline-block">
                        <span class="px-2 py-1 rounded-full text-xs font-bold
                            ${repair.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                repair.status === 'Repaired' ? 'bg-blue-100 text-blue-700' :
                    repair.status === 'Part Not Available' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}">
                            ${repair.status}
                        </span>
                    </div>
                </div>

                <div>
                    <label class="text-xs font-bold text-slate-400 uppercase">Estimated Cost</label>
                    <div class="text-slate-800 font-bold">₹${repair.estimated_cost || 0}</div>
                </div>
                
                <div>
                    <label class="text-xs font-bold text-slate-400 uppercase">Part Replaced</label>
                    <div class="text-slate-800">${repair.part_replaced_name || 'None'}</div>
                </div>

                <div class="col-span-2">
                    <label class="text-xs font-bold text-slate-400 uppercase">Issue Description</label>
                    <div class="p-3 bg-slate-50 rounded border border-slate-100 text-sm text-slate-700 mt-1">
                        ${repair.issue_description || 'No description provided.'}
                    </div>
                </div>

                ${repair.status === 'Delivered' && repair.delivered_at ? `
                <div class="col-span-2 bg-green-50 p-3 rounded border border-green-100 mt-2">
                    <div class="flex items-center gap-2 text-green-700 font-bold text-xs uppercase">
                        <i data-lucide="check-circle" class="w-4 h-4"></i> Delivered
                    </div>
                    <div class="text-green-800 text-sm mt-1">
                        ${new Date(repair.delivered_at).toLocaleString()}
                    </div>
                </div>
                ` : ''}

                <div class="col-span-2 text-xs text-slate-400 border-t pt-2 mt-2">
                    Created on: ${new Date(repair.created_at).toLocaleString()} <br>
                    ID: ${repair.id}
                </div>
            </div>
        `;
        modal.classList.remove('hidden');
        if (window.lucide) window.lucide.createIcons();
    }

    if (editFromViewBtn) {
        editFromViewBtn.addEventListener('click', () => {
            if (currentViewRepair) {
                modal.classList.add('hidden');
                openEditModal(currentViewRepair);
            }
        });
    }

    closeModalBtns.forEach(btn => {
        btn?.addEventListener('click', () => modal.classList.add('hidden'));
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
    });

    // --- Edit Modal Logic ---
    const editModal = container.querySelector('#edit-repair-modal');
    const closeEditBtn = container.querySelector('#close-edit-repair-btn');
    const cancelEditBtn = container.querySelector('#cancel-edit-repair-btn');
    const saveEditBtn = container.querySelector('#save-edit-repair-btn');

    function openEditModal(repair) {
        container.querySelector('#edit-repair-id').value = repair.id;
        container.querySelector('#edit-cust-name').value = repair.customer_name || '';
        container.querySelector('#edit-cust-contact').value = repair.contact_number || '';
        container.querySelector('#edit-technician').value = repair.technician_name || '';
        container.querySelector('#edit-device').value = repair.device_details || '';
        container.querySelector('#edit-model').value = repair.model_number || '';
        container.querySelector('#edit-status').value = repair.status || 'Received';
        container.querySelector('#edit-cost').value = repair.estimated_cost || 0;
        container.querySelector('#edit-part').value = repair.part_replaced_name || '';
        container.querySelector('#edit-issue').value = repair.issue_description || '';
        editModal.classList.remove('hidden');
        editModal.classList.add('flex');
    }

    function closeEditModal() {
        editModal.classList.add('hidden');
        editModal.classList.remove('flex');
    }

    closeEditBtn?.addEventListener('click', closeEditModal);
    cancelEditBtn?.addEventListener('click', closeEditModal);
    editModal?.addEventListener('click', (e) => { if (e.target === editModal) closeEditModal(); });

    saveEditBtn?.addEventListener('click', async () => {
        const id = container.querySelector('#edit-repair-id').value;
        const updates = {
            customer_name: container.querySelector('#edit-cust-name').value.trim(),
            contact_number: container.querySelector('#edit-cust-contact').value.trim(),
            technician_name: container.querySelector('#edit-technician').value.trim(),
            device_details: container.querySelector('#edit-device').value.trim(),
            model_number: container.querySelector('#edit-model').value.trim(),
            status: container.querySelector('#edit-status').value,
            estimated_cost: parseFloat(container.querySelector('#edit-cost').value) || 0,
            part_replaced_name: container.querySelector('#edit-part').value.trim() || null,
            issue_description: container.querySelector('#edit-issue').value.trim(),
        };

        if (!updates.customer_name || !updates.device_details) {
            alert('Customer Name and Device are required.');
            return;
        }

        saveEditBtn.disabled = true;
        saveEditBtn.textContent = 'Saving...';

        const { error } = await supabase.from('repairs').update(updates).eq('id', id);
        saveEditBtn.disabled = false;
        saveEditBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v13a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg> Save Changes';

        if (error) {
            alert('Error saving: ' + error.message);
        } else {
            closeEditModal();
            fetchRepairs();
        }
    });

    async function fetchRepairs() {
        let query = supabase
            .from('repairs')
            .select('*')
            .order('created_at', { ascending: false });
        if (storeId) query = query.eq('store_id', storeId);
        const { data, error } = await query;

        if (error) {
            tbody.innerHTML = `<tr><td colspan="8" class="p-4 text-center text-red-500">Error loading data</td></tr>`;
            return;
        }

        repairs = data;
        renderTable(repairs);
    }

    // --- Rendering ---
    function renderTable(items) {
        if (items.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="p-8 text-center text-slate-400">No repair records found</td></tr>`;
            return;
        }

        tbody.innerHTML = items.map(r => `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="p-4 whitespace-nowrap">
                    <div class="font-medium text-slate-700">${new Date(r.created_at).toLocaleDateString()}</div>
                    <div class="text-xs text-slate-400">${new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    ${r.status === 'Delivered' && r.delivered_at ? `
                        <div class="mt-1 pt-1 border-t border-slate-100">
                             <span class="text-[10px] font-bold text-green-600 uppercase">Delivered</span>
                             <div class="text-xs text-green-700 font-medium">${new Date(r.delivered_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</div>
                        </div>
                    ` : ''}
                </td>
                <td class="p-4 font-medium text-slate-800">
                    ${r.customer_name}
                    <div class="text-xs text-slate-400">${r.contact_number || ''}</div>
                </td>
                <td class="p-4">${r.device_details}</td>
                <td class="p-4 font-mono text-xs text-slate-500">${r.model_number || '-'}</td>
                <td class="p-4 max-w-xs truncate" title="${r.issue_description || ''}">${r.issue_description || '-'}</td>
                <td class="p-4">
                    <span class="px-2 py-1 rounded-full text-xs font-bold 
                        ${r.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                r.status === 'Repaired' ? 'bg-blue-100 text-blue-700' :
                    r.status === 'Part Not Available' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}">
                        ${r.status}
                    </span>
                </td>
                <td class="p-4 text-right font-medium">₹${r.estimated_cost || 0}</td>
                <td class="p-4 text-right">
                    <button class="menu-trigger p-2 rounded-full hover:bg-slate-200 text-slate-400 transition-colors" data-id="${r.id}">
                        <i data-lucide="more-vertical" class="w-4 h-4"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        if (window.lucide) window.lucide.createIcons();
        attachRowListeners();
    }

    function attachRowListeners() {
        // Trigger for Popup
        tbody.querySelectorAll('.menu-trigger').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                showPopup(btn, id);
            });
        });
    }

    // --- Search ---
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = repairs.filter(r =>
            r.customer_name.toLowerCase().includes(term) ||
            r.device_details.toLowerCase().includes(term) ||
            (r.serial_number && r.serial_number.toLowerCase().includes(term)) ||
            r.status.toLowerCase().includes(term)
        );
        renderTable(filtered);
    });

    // --- Export CSV ---
    container.querySelector('#export-repairs-btn').addEventListener('click', () => {
        if (repairs.length === 0) return;

        let csv = "Date,Customer,Contact,Device,Model,Serial No,Problem,Status,Cost,Technician,PartReplaced\n";

        csv += repairs.map(r => {
            const safeCust = (r.customer_name || '').replace(/,/g, ' ');
            const safeDevice = (r.device_details || '').replace(/,/g, ' ');
            const safeProblem = (r.issue_description || '').replace(/,/g, ' ');
            const safeSerial = (r.serial_number || '').replace(/,/g, ' ');

            return `${new Date(r.created_at).toLocaleDateString()},${safeCust},${r.contact_number || ''},${safeDevice},${r.model_number || ''},${safeSerial},${safeProblem},${r.status},${r.estimated_cost || 0},${r.technician_name || ''},${r.part_replaced_name || ''}`;
        }).join("\n");

        const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csv);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `repair_history_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    fetchRepairs();
}
