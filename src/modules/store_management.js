/**
 * Store Management Module — Main Admin Only
 * CRUD for stores and store admin accounts
 */
import { supabase } from '../supabase.js';

export async function initStoreManagement(container) {
    container.innerHTML = `
        <div class="space-y-6">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-slate-800">Store Management</h2>
                    <p class="text-slate-500 text-sm mt-1">Manage stores and create store admin accounts</p>
                </div>
                <div class="flex gap-3">
                    <button id="add-store-btn" class="btn-primary">
                        <i data-lucide="plus" class="w-4 h-4"></i> New Store
                    </button>
                    <button id="add-user-btn" class="btn-secondary">
                        <i data-lucide="user-plus" class="w-4 h-4"></i> New Admin
                    </button>
                </div>
            </div>

            <!-- Stores Grid -->
            <div>
                <h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <i data-lucide="building-2" class="w-4 h-4"></i> Stores
                </h3>
                <div id="stores-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div class="p-8 text-center text-slate-400">Loading...</div>
                </div>
            </div>

            <!-- Store Admins Table -->
            <div class="card">
                <div class="p-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 class="font-semibold text-slate-700 flex items-center gap-2 text-sm">
                        <i data-lucide="users" class="w-4 h-4 text-slate-400"></i> Store Admin Accounts
                    </h3>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm">
                        <thead>
                            <tr>
                                <th class="p-3">Username</th>
                                <th class="p-3">Display Name</th>
                                <th class="p-3">Role</th>
                                <th class="p-3">Assigned Store</th>
                                <th class="p-3">Status</th>
                                <th class="p-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="users-tbody" class="divide-y divide-slate-100">
                            <tr><td colspan="6" class="p-4 text-center text-slate-400">Loading...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Store Modal -->
        <div id="store-modal" class="hidden fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
                <div class="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 text-white">
                    <h3 id="store-modal-title" class="text-lg font-bold">Add New Store</h3>
                </div>
                <form id="store-form" class="p-6 space-y-4">
                    <input type="hidden" id="store-edit-id">
                    <div>
                        <label class="label">Store Name</label>
                        <input type="text" id="store-name" class="input-field" placeholder="e.g. JRPL Lucknow" required>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="label">Location / City</label>
                            <input type="text" id="store-location" class="input-field" placeholder="e.g. Lucknow" required>
                        </div>
                        <div>
                            <label class="label">Phone</label>
                            <input type="text" id="store-phone" class="input-field" placeholder="+91...">
                        </div>
                    </div>
                    <div>
                        <label class="label">Address</label>
                        <textarea id="store-address" class="input-field h-20 resize-none" placeholder="Full address..."></textarea>
                    </div>
                    <div class="flex justify-end gap-3 pt-2">
                        <button type="button" id="cancel-store" class="btn-secondary">Cancel</button>
                        <button type="submit" class="btn-primary">Save Store</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- User Modal -->
        <div id="user-modal" class="hidden fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
                <div class="bg-gradient-to-r from-emerald-600 to-teal-600 p-5 text-white">
                    <h3 id="user-modal-title" class="text-lg font-bold">Create Store Admin</h3>
                </div>
                <form id="user-form" class="p-6 space-y-4">
                    <input type="hidden" id="user-edit-id">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="label">Username</label>
                            <input type="text" id="user-username" class="input-field" placeholder="e.g. store_admin_lko" required>
                        </div>
                        <div>
                            <label class="label">Password</label>
                            <input type="text" id="user-password" class="input-field" placeholder="Enter password" required>
                        </div>
                    </div>
                    <div>
                        <label class="label">Display Name</label>
                        <input type="text" id="user-display-name" class="input-field" placeholder="e.g. Lucknow Admin" required>
                    </div>
                    <div>
                        <label class="label">Assign to Store</label>
                        <select id="user-store-id" class="input-field" required>
                            <option value="">Select a store...</option>
                        </select>
                    </div>
                    <div class="flex justify-end gap-3 pt-2">
                        <button type="button" id="cancel-user" class="btn-secondary">Cancel</button>
                        <button type="submit" class="btn-primary">Save Admin</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    let stores = [];
    let users = [];

    // -- Fetch --
    async function fetchStores() {
        const { data } = await supabase.from('stores').select('*').order('name');
        stores = data || [];
        renderStores();
    }

    async function fetchUsers() {
        const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
        users = data || [];
        renderUsers();
    }

    // -- Render Stores --
    function renderStores() {
        const grid = container.querySelector('#stores-grid');
        if (stores.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full p-12 text-center">
                    <i data-lucide="building-2" class="w-12 h-12 text-slate-300 mx-auto mb-3"></i>
                    <p class="text-slate-400 font-medium">No stores yet</p>
                    <p class="text-slate-400 text-sm">Click "New Store" to create your first store</p>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();
            return;
        }

        grid.innerHTML = stores.map(s => {
            const adminCount = users.filter(u => u.store_id === s.id && u.role === 'store_admin').length;
            return `
                <div class="card p-5 hover:shadow-lg transition-all group">
                    <div class="flex items-start justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                                ${s.name.charAt(0)}
                            </div>
                            <div>
                                <h4 class="font-bold text-slate-800 text-sm">${s.name}</h4>
                                <p class="text-xs text-slate-500 flex items-center gap-1">
                                    <i data-lucide="map-pin" class="w-3 h-3"></i> ${s.location}
                                </p>
                            </div>
                        </div>
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${s.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}">
                            ${s.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                    ${s.address ? `<p class="text-xs text-slate-400 mt-3 truncate">${s.address}</p>` : ''}
                    <div class="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                        <span class="text-[11px] text-slate-400 flex items-center gap-1">
                            <i data-lucide="users" class="w-3 h-3"></i> ${adminCount} admin${adminCount !== 1 ? 's' : ''}
                        </span>
                        <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button class="edit-store-btn p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors" data-id="${s.id}">
                                <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
                            </button>
                            <button class="toggle-store-btn p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors" data-id="${s.id}" data-active="${s.is_active}">
                                <i data-lucide="${s.is_active ? 'eye-off' : 'eye'}" class="w-3.5 h-3.5"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        if (window.lucide) window.lucide.createIcons();
        attachStoreListeners();
    }

    // -- Render Users --
    function renderUsers() {
        const tbody = container.querySelector('#users-tbody');
        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="p-6 text-center text-slate-400">No users found</td></tr>';
            return;
        }

        tbody.innerHTML = users.map(u => {
            const store = stores.find(s => s.id === u.store_id);
            return `
                <tr class="hover:bg-slate-50 transition-colors">
                    <td class="p-3">
                        <span class="font-mono text-xs bg-slate-100 px-2 py-1 rounded">${u.username}</span>
                    </td>
                    <td class="p-3 font-medium text-slate-700">${u.display_name}</td>
                    <td class="p-3">
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${u.role === 'main_admin' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}">
                            ${u.role === 'main_admin' ? 'Main Admin' : 'Store Admin'}
                        </span>
                    </td>
                    <td class="p-3 text-slate-600 text-sm">${store ? store.name + ' (' + store.location + ')' : '—'}</td>
                    <td class="p-3">
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${u.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}">
                            ${u.is_active ? 'Active' : 'Disabled'}
                        </span>
                    </td>
                    <td class="p-3 text-center">
                        ${u.role !== 'main_admin' ? `
                            <div class="flex justify-center gap-1">
                                <button class="toggle-user-btn p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700" data-id="${u.id}" data-active="${u.is_active}" title="${u.is_active ? 'Disable' : 'Enable'}">
                                    <i data-lucide="${u.is_active ? 'user-x' : 'user-check'}" class="w-3.5 h-3.5"></i>
                                </button>
                                <button class="delete-user-btn p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600" data-id="${u.id}" title="Delete">
                                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                                </button>
                            </div>
                        ` : '<span class="text-slate-300 text-xs">Protected</span>'}
                    </td>
                </tr>
            `;
        }).join('');

        if (window.lucide) window.lucide.createIcons();
        attachUserListeners();
    }

    // -- Store Listeners --
    function attachStoreListeners() {
        container.querySelectorAll('.edit-store-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const store = stores.find(s => s.id === btn.dataset.id);
                if (store) openStoreModal(store);
            });
        });

        container.querySelectorAll('.toggle-store-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const isActive = btn.dataset.active === 'true';
                const action = isActive ? 'deactivate' : 'activate';
                if (confirm(`Are you sure you want to ${action} this store?`)) {
                    await supabase.from('stores').update({ is_active: !isActive }).eq('id', btn.dataset.id);
                    fetchStores();
                }
            });
        });
    }

    // -- User Listeners --
    function attachUserListeners() {
        container.querySelectorAll('.toggle-user-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const isActive = btn.dataset.active === 'true';
                await supabase.from('users').update({ is_active: !isActive }).eq('id', btn.dataset.id);
                fetchUsers();
            });
        });

        container.querySelectorAll('.delete-user-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm('Delete this user account? This cannot be undone.')) {
                    await supabase.from('users').delete().eq('id', btn.dataset.id);
                    fetchUsers();
                }
            });
        });
    }

    // -- Store Modal --
    const storeModal = container.querySelector('#store-modal');
    const storeForm = container.querySelector('#store-form');

    function openStoreModal(data = null) {
        container.querySelector('#store-modal-title').textContent = data ? 'Edit Store' : 'Add New Store';
        container.querySelector('#store-edit-id').value = data?.id || '';
        container.querySelector('#store-name').value = data?.name || '';
        container.querySelector('#store-location').value = data?.location || '';
        container.querySelector('#store-phone').value = data?.phone || '';
        container.querySelector('#store-address').value = data?.address || '';
        storeModal.classList.remove('hidden');
    }

    container.querySelector('#add-store-btn').addEventListener('click', () => openStoreModal());
    container.querySelector('#cancel-store').addEventListener('click', () => storeModal.classList.add('hidden'));
    storeModal.addEventListener('click', (e) => { if (e.target === storeModal) storeModal.classList.add('hidden'); });

    storeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = container.querySelector('#store-edit-id').value;
        const payload = {
            name: container.querySelector('#store-name').value.trim(),
            location: container.querySelector('#store-location').value.trim(),
            phone: container.querySelector('#store-phone').value.trim(),
            address: container.querySelector('#store-address').value.trim(),
        };

        if (!payload.name || !payload.location) return alert('Name and location are required.');

        let error;
        if (id) {
            const { error: e } = await supabase.from('stores').update(payload).eq('id', id);
            error = e;
        } else {
            const { error: e } = await supabase.from('stores').insert(payload);
            error = e;
        }

        if (error) return alert('Error: ' + error.message);
        storeModal.classList.add('hidden');
        fetchStores();
    });

    // -- User Modal --
    const userModal = container.querySelector('#user-modal');
    const userForm = container.querySelector('#user-form');

    function openUserModal() {
        container.querySelector('#user-edit-id').value = '';
        container.querySelector('#user-username').value = '';
        container.querySelector('#user-password').value = '';
        container.querySelector('#user-display-name').value = '';

        // Populate store dropdown
        const storeSelect = container.querySelector('#user-store-id');
        storeSelect.innerHTML = '<option value="">Select a store...</option>' +
            stores.filter(s => s.is_active).map(s => `<option value="${s.id}">${s.name} — ${s.location}</option>`).join('');

        userModal.classList.remove('hidden');
    }

    container.querySelector('#add-user-btn').addEventListener('click', openUserModal);
    container.querySelector('#cancel-user').addEventListener('click', () => userModal.classList.add('hidden'));
    userModal.addEventListener('click', (e) => { if (e.target === userModal) userModal.classList.add('hidden'); });

    userForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            username: container.querySelector('#user-username').value.trim(),
            password: container.querySelector('#user-password').value,
            display_name: container.querySelector('#user-display-name').value.trim(),
            role: 'store_admin',
            store_id: container.querySelector('#user-store-id').value || null,
        };

        if (!payload.username || !payload.password || !payload.display_name) return alert('All fields are required.');
        if (!payload.store_id) return alert('Please assign this admin to a store.');

        const { error } = await supabase.from('users').insert(payload);
        if (error) return alert('Error: ' + error.message);

        userModal.classList.add('hidden');
        fetchUsers();
    });

    // -- Init --
    fetchStores();
    fetchUsers();
}
