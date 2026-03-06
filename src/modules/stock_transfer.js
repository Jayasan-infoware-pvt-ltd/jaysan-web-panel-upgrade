/**
 * Stock Transfer Module — Main Admin Only
 * Move stock from one store to another with transfer history
 */
import { supabase } from '../supabase.js';

export async function initStockTransfer(container) {
    container.innerHTML = `
        <div class="space-y-6">
            <div>
                <h2 class="text-2xl font-bold text-slate-800">Stock Transfer</h2>
                <p class="text-slate-500 text-sm mt-1">Move inventory between stores</p>
            </div>

            <!-- Transfer Form -->
            <div class="card p-6 relative overflow-hidden">
                <div class="absolute top-0 right-0 w-40 h-40 bg-indigo-50 rounded-bl-full opacity-50 -mr-10 -mt-10 pointer-events-none"></div>

                <h3 class="font-bold text-lg text-slate-700 mb-5 flex items-center gap-2">
                    <i data-lucide="arrow-left-right" class="w-5 h-5 text-indigo-600"></i>
                    New Transfer
                </h3>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label class="label">From Store</label>
                        <select id="from-store" class="input-field" required>
                            <option value="">Select source...</option>
                        </select>
                    </div>
                    <div>
                        <label class="label">To Store</label>
                        <select id="to-store" class="input-field" required>
                            <option value="">Select destination...</option>
                        </select>
                    </div>
                    <div>
                        <label class="label">Product</label>
                        <select id="transfer-product" class="input-field" required>
                            <option value="">Select product...</option>
                        </select>
                    </div>
                    <div>
                        <label class="label">Quantity</label>
                        <div class="flex gap-2">
                            <input type="number" id="transfer-qty" class="input-field" placeholder="0" min="1" required>
                            <span id="available-qty" class="text-xs text-slate-400 self-center whitespace-nowrap"></span>
                        </div>
                    </div>
                </div>

                <div class="mt-4">
                    <label class="label">Notes (Optional)</label>
                    <input type="text" id="transfer-notes" class="input-field" placeholder="Reason for transfer...">
                </div>

                <div class="mt-5 flex justify-end">
                    <button id="execute-transfer-btn" class="btn-primary">
                        <i data-lucide="check" class="w-4 h-4"></i> Execute Transfer
                    </button>
                </div>
            </div>

            <!-- Transfer History -->
            <div class="card">
                <div class="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 class="font-semibold text-slate-700 text-sm flex items-center gap-2">
                        <i data-lucide="history" class="w-4 h-4 text-slate-400"></i> Transfer History
                    </h3>
                    <span class="text-xs text-slate-400" id="transfer-count">0 transfers</span>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm">
                        <thead>
                            <tr>
                                <th class="p-3">Date</th>
                                <th class="p-3">Product</th>
                                <th class="p-3">From</th>
                                <th class="p-3">To</th>
                                <th class="p-3 text-right">Qty</th>
                                <th class="p-3">Notes</th>
                            </tr>
                        </thead>
                        <tbody id="transfer-history-body" class="divide-y divide-slate-100">
                            <tr><td colspan="6" class="p-4 text-center text-slate-400">Loading...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    let stores = [];
    let products = [];
    let selectedProduct = null;

    const fromSelect = container.querySelector('#from-store');
    const toSelect = container.querySelector('#to-store');
    const productSelect = container.querySelector('#transfer-product');
    const qtyInput = container.querySelector('#transfer-qty');
    const availableQty = container.querySelector('#available-qty');
    const notesInput = container.querySelector('#transfer-notes');
    const executeBtn = container.querySelector('#execute-transfer-btn');

    // -- Load Data --
    async function loadStores() {
        const { data } = await supabase.from('stores').select('*').eq('is_active', true).order('name');
        stores = data || [];

        const options = stores.map(s => `<option value="${s.id}">${s.name} — ${s.location}</option>`).join('');
        fromSelect.innerHTML = '<option value="">Select source...</option>' + options;
        toSelect.innerHTML = '<option value="">Select destination...</option>' + options;
    }

    async function loadProducts(storeId) {
        productSelect.innerHTML = '<option value="">Loading...</option>';
        let query = supabase.from('products').select('*').order('name');
        if (storeId) {
            query = query.eq('store_id', storeId);
        }
        const { data } = await query;
        products = data || [];

        productSelect.innerHTML = '<option value="">Select product...</option>' +
            products.map(p => `<option value="${p.id}">${p.name} (Qty: ${p.quantity})</option>`).join('');
    }

    // -- Events --
    fromSelect.addEventListener('change', (e) => {
        if (e.target.value) {
            loadProducts(e.target.value);
        } else {
            productSelect.innerHTML = '<option value="">Select product...</option>';
            products = [];
        }
        availableQty.textContent = '';
    });

    productSelect.addEventListener('change', (e) => {
        selectedProduct = products.find(p => p.id === e.target.value);
        if (selectedProduct) {
            availableQty.textContent = `Available: ${selectedProduct.quantity}`;
        } else {
            availableQty.textContent = '';
        }
    });

    // -- Execute Transfer --
    executeBtn.addEventListener('click', async () => {
        const fromStoreId = fromSelect.value;
        const toStoreId = toSelect.value;
        const productId = productSelect.value;
        const qty = parseInt(qtyInput.value);
        const notes = notesInput.value.trim();

        if (!fromStoreId) return alert('Please select source store.');
        if (!toStoreId) return alert('Please select destination store.');
        if (fromStoreId === toStoreId) return alert('Source and destination cannot be the same.');
        if (!productId) return alert('Please select a product.');
        if (!qty || qty < 1) return alert('Please enter a valid quantity.');

        if (!selectedProduct) return alert('Product not found.');
        if (qty > selectedProduct.quantity) return alert(`Not enough stock. Available: ${selectedProduct.quantity}`);

        if (!confirm(`Transfer ${qty}x "${selectedProduct.name}" from ${stores.find(s=>s.id===fromStoreId)?.name} to ${stores.find(s=>s.id===toStoreId)?.name}?`)) return;

        executeBtn.disabled = true;
        executeBtn.innerHTML = '<span class="animate-pulse">Transferring...</span>';

        try {
            // 1. Reduce quantity in source store
            const { error: decErr } = await supabase
                .from('products')
                .update({ quantity: selectedProduct.quantity - qty })
                .eq('id', productId);

            if (decErr) throw decErr;

            // 2. Check if product exists in destination store (by name)
            const { data: destProducts } = await supabase
                .from('products')
                .select('*')
                .eq('name', selectedProduct.name)
                .eq('store_id', toStoreId);

            if (destProducts && destProducts.length > 0) {
                // Update existing product
                const dest = destProducts[0];
                const { error: incErr } = await supabase
                    .from('products')
                    .update({ quantity: dest.quantity + qty })
                    .eq('id', dest.id);
                if (incErr) throw incErr;
            } else {
                // Create new product in destination store
                const newProduct = {
                    name: selectedProduct.name,
                    price: selectedProduct.price,
                    cost_price: selectedProduct.cost_price,
                    quantity: qty,
                    store_id: toStoreId,
                    category: selectedProduct.category,
                    serial_numbers: null,
                    image_urls: selectedProduct.image_urls,
                };
                const { error: insErr } = await supabase.from('products').insert(newProduct);
                if (insErr) throw insErr;
            }

            // 3. Log the transfer
            const fromStore = stores.find(s => s.id === fromStoreId);
            const toStore = stores.find(s => s.id === toStoreId);
            const { error: logErr } = await supabase.from('stock_transfers').insert({
                product_id: productId,
                product_name: selectedProduct.name,
                from_store_id: fromStoreId,
                to_store_id: toStoreId,
                from_store_name: fromStore?.name || '',
                to_store_name: toStore?.name || '',
                quantity: qty,
                notes: notes,
                transferred_by: JSON.parse(localStorage.getItem('app_user'))?.display_name || 'Admin',
            });

            if (logErr) throw logErr;

            alert('Stock transferred successfully!');
            qtyInput.value = '';
            notesInput.value = '';
            availableQty.textContent = '';
            productSelect.value = '';
            loadProducts(fromStoreId);
            loadHistory();

        } catch (err) {
            console.error(err);
            alert('Transfer failed: ' + err.message);
        } finally {
            executeBtn.disabled = false;
            executeBtn.innerHTML = '<i data-lucide="check" class="w-4 h-4"></i> Execute Transfer';
            if (window.lucide) window.lucide.createIcons();
        }
    });

    // -- History --
    async function loadHistory() {
        const { data, error } = await supabase
            .from('stock_transfers')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        const tbody = container.querySelector('#transfer-history-body');
        container.querySelector('#transfer-count').textContent = `${(data || []).length} transfers`;

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="p-6 text-center text-slate-400">No transfers yet</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(t => `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="p-3 text-slate-500 text-xs">${new Date(t.created_at).toLocaleDateString()}</td>
                <td class="p-3 font-medium text-slate-700">${t.product_name}</td>
                <td class="p-3">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600">${t.from_store_name}</span>
                </td>
                <td class="p-3">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600">${t.to_store_name}</span>
                </td>
                <td class="p-3 text-right font-bold text-slate-800">${t.quantity}</td>
                <td class="p-3 text-slate-500 text-xs truncate max-w-[200px]">${t.notes || '—'}</td>
            </tr>
        `).join('');
    }

    // -- Init --
    await loadStores();
    await loadHistory();
}
