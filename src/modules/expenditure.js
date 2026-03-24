import { supabase } from '../supabase.js';
import { Plus, Search, Trash2, Calendar, FileText, Wallet, Receipt, X } from 'lucide';

export async function initExpenditure(container, storeId = null) {
 container.innerHTML = `
 <div class="space-y-6">
 <div class="flex justify-between items-center">
 <h2 class="text-2xl font-bold text-zinc-900">Expenditure Management</h2>
 </div>

 <!-- Add Expenditure Form -->
 <div class="card relative overflow-hidden ${!storeId ? 'hidden' : ''}">
 <div class="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full -mr-8 -mt-8 opacity-50 pointer-events-none"></div>

 <div class="card-header pb-2">
 <h3 class="card-title flex items-center gap-2">
 <i data-lucide="plus" class="w-5 h-5 text-primary"></i> New Expenditure
 </h3>
 </div>

 <div class="card-content">
 <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
 <!-- Basic Info -->
 <div class="space-y-4">
 <div>
 <label class="label">Date</label>
 <input type="date" id="exp-date" class="input-field" value="${new Date().toISOString().split('T')[0]}">
 </div>

 <div>
 <label class="label">Type</label>
 <div class="flex gap-4">
 <label class="flex items-center gap-2 cursor-pointer">
 <input type="radio" name="exp-type" value="Manual" checked class="text-blue-600 focus:ring-blue-500">
 <span class="text-sm font-medium text-zinc-700">Manual Entry</span>
 </label>
 <label class="flex items-center gap-2 cursor-pointer">
 <input type="radio" name="exp-type" value="From Stock" class="text-blue-600 focus:ring-blue-500">
 <span class="text-sm font-medium text-zinc-700">From Stock</span>
 </label>
 </div>
 </div>

 <!-- Hidden ID for Edit Mode -->
 <input type="hidden" id="exp-id">

 <div id="manual-input-group">
 <label class="label">Item / Description</label>
 <input type="text" id="exp-desc" class="input-field" placeholder="e.g. Office Rent, Tea, Salary...">
 </div>

 <div id="stock-input-group" class="hidden space-y-2">
 <label class="label">Search Product</label>
 <div class="relative">
 <input type="text" id="stock-search" class="input-field pl-10" placeholder="Type to search stock...">
 <i data-lucide="search" class="absolute left-3 top-2.5 w-5 h-5 text-zinc-400"></i>
 <div id="stock-results" class="hidden absolute z-10 w-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-md max-h-48 overflow-y-auto"></div>
 </div>
 <div id="selected-product-info" class="hidden text-sm text-emerald-600 bg-emerald-50 p-2 rounded border border-emerald-100 flex justify-between items-center">
 <span id="sel-prod-name" class="font-medium"></span>
 <button id="clear-prod" class="text-red-500 hover:text-red-700"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
 </div>
 </div>
 </div>

 <!-- Details -->
 <div class="space-y-4">
 <div class="grid grid-cols-2 gap-4">
 <div>
 <label class="label">Amount (₹)</label>
 <input type="number" id="exp-amount" class="input-field font-bold text-zinc-700" placeholder="0.00">
 </div>
 <div>
 <label class="label">Category</label>
 <select id="exp-category" class="input-field">
 <option value="Store">Store</option>
 <option value="Personal">Personal</option>
 <option value="AMC">AMC</option>
 </select>
 </div>
 </div>

 <div>
 <label class="label">Where Used / Location</label>
 <input type="text" id="exp-location" class="input-field" placeholder="e.g. Workshop, Client Site...">
 </div>

 <div>
 <label class="label">Remarks</label>
 <textarea id="exp-remarks" class="input-field h-24 resize-none" placeholder="Add any additional notes..."></textarea>
 </div>
 </div>
 </div>

 <div class="mt-6 flex justify-end">
 <button id="save-exp-btn" class="btn-primary flex items-center gap-2">
 <i data-lucide="wallet" class="w-4 h-4"></i> Save Expenditure
 </button>
 </div>
 </div>
 </div>
 
 ${!storeId ? `
 <div class="card p-6 bg-zinc-50 border border-zinc-200 rounded-xl text-center text-zinc-500 italic mt-6">
 <i data-lucide="building-2" class="w-8 h-8 mx-auto mb-2 text-zinc-400"></i>
 Select a specific store from the sidebar to record a new expenditure.
 </div>
 ` : ''}

 <!-- History List -->
 <div class="card">
 <div class="card-header flex flex-row items-center justify-between pb-2">
 <h3 class="card-title">Recent Expenditure</h3>
 <div class="text-xs text-muted-foreground font-mono">Total Recorded: <span id="total-exp-count">0</span></div>
 </div>
 <div class="card-content overflow-x-auto">
 <table class="table relative">
 <thead class="table-header sticky top-0 bg-card z-10">
 <tr>
 <th class="table-head w-[120px]">Date</th>
 <th class="table-head">Item / Description</th>
 <th class="table-head">Type</th>
 <th class="table-head">Where Used</th>
 <th class="table-head">Category</th>
 <th class="table-head text-right w-[100px]">Amount</th>
 <th class="table-head text-center w-[60px]">Action</th>
 </tr>
 </thead>
 <tbody id="exp-history-body" class="table-body">
 <tr><td colspan="7" class="table-cell text-center text-muted-foreground text-xs py-4">Loading...</td></tr>
 </tbody>
 </table>
 </div>
 </div>
 </div>

 <!-- DETAIL MODAL (POP SCREEN) -->
 <div id="detail-modal" class="dialog-overlay hidden transition-opacity duration-300 opacity-0">
 <div id="detail-modal-content" class="dialog-content absolute transform scale-95 transition-transform duration-300 p-0 overflow-hidden w-full max-w-md border-0">
 <!-- Modal Header -->
 <div class="bg-primary p-5 text-primary-foreground flex justify-between items-start">
 <div>
 <p class="text-[10px] opacity-80 uppercase tracking-wider font-semibold">Transaction Details</p>
 <h3 id="modal-title" class="text-xl font-bold mt-1 leading-tight">Item Name</h3>
 <p id="modal-date" class="text-xs opacity-90 mt-1 font-medium">Date</p>
 </div>
 <div class="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
 <i data-lucide="receipt" class="w-6 h-6 text-white"></i>
 </div>
 </div>

 <!-- Modal Body -->
 <div class="p-6 space-y-5">
 <!-- Amount Display -->
 <div class="flex justify-between items-end border-b pb-4">
 <span class="text-muted-foreground font-medium text-sm">Total Amount</span>
 <span id="modal-amount" class="text-2xl font-bold text-foreground">₹0.00</span>
 </div>

 <!-- Info Grid -->
 <div class="grid grid-cols-2 gap-4 text-sm">
 <div class="bg-muted/50 p-3 rounded-md border">
 <p class="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-1">Category</p>
 <p id="modal-category" class="font-semibold text-foreground">-</p>
 </div>
 <div class="bg-muted/50 p-3 rounded-md border">
 <p class="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-1">Type</p>
 <span id="modal-type" class="badge badge-secondary">-</span>
 </div>
 <div class="bg-muted/50 p-3 rounded-md border col-span-2">
 <p class="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-1">Location</p>
 <p id="modal-location" class="font-semibold text-foreground truncate">-</p>
 </div>
 </div>

 <!-- Remarks -->
 <div>
 <p class="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-1">Remarks</p>
 <div id="modal-remarks-box" class="hidden">
 <p id="modal-remarks" class="text-sm text-foreground italic bg-muted/50 p-3 rounded-md border-l-4 border-primary/50">-</p>
 </div>
 <p id="modal-no-remarks" class="text-sm text-muted-foreground italic opacity-60">No remarks provided.</p>
 </div>
 </div>

 <!-- Modal Footer -->
 <div class="bg-muted/30 px-6 py-4 flex justify-end border-t">
 <button id="close-modal-btn" class="btn-secondary text-sm flex items-center gap-2">
 <i data-lucide="x" class="w-4 h-4"></i> Close
 </button>
 </div>
 </div>
 </div>
 `;

 // Global Menu Logic — body-level popup (same pattern as other modules)
 let expPopupMenu = document.getElementById('exp-action-menu');
 if (expPopupMenu) expPopupMenu.remove();

 expPopupMenu = document.createElement('div');
 expPopupMenu.id = 'exp-action-menu';
 expPopupMenu.className = 'hidden fixed z-[500] bg-white rounded-lg shadow-sm border border-zinc-100 w-44 py-1';
 expPopupMenu.style.transition = 'opacity 150ms ease, transform 150ms ease';
 expPopupMenu.innerHTML = `
 <button id="exp-popup-view" class="w-full text-left px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2">
 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
 View Detail
 </button>
 <div class="border-t border-zinc-100 my-1"></div>
 <button id="exp-popup-edit" class="w-full text-left px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2">
 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
 Edit
 </button>
 <div class="border-t border-zinc-100 my-1"></div>
 <button id="exp-popup-delete" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
 Delete
 </button>
 `;
 document.body.appendChild(expPopupMenu);

 // Alias so existing code references work
 const popupMenu = expPopupMenu;
 let currentActiveId = null;

 function showPopup(btn, id) {
 currentActiveId = id;

 const rect = btn.getBoundingClientRect();

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
 }

 function hidePopup() {
 popupMenu.classList.add('hidden');
 popupMenu.style.opacity = '';
 popupMenu.style.transform = '';
 currentActiveId = null;
 }

 document.addEventListener('click', (e) => {
 if (!popupMenu.contains(e.target) && !e.target.closest('.menu-trigger')) {
 hidePopup();
 }
 });

 if (window.lucide) window.lucide.createIcons();

 let allExpenditures = [];
 const typeRadios = container.querySelectorAll('input[name="exp-type"]');
 const manualGroup = container.querySelector('#manual-input-group');
 const stockGroup = container.querySelector('#stock-input-group');
 const stockSearch = container.querySelector('#stock-search');
 const stockResults = container.querySelector('#stock-results');
 const selProdInfo = container.querySelector('#selected-product-info');
 const selProdName = container.querySelector('#sel-prod-name');
 const clearProdBtn = container.querySelector('#clear-prod');
 const descInput = container.querySelector('#exp-desc');
 const amountInput = container.querySelector('#exp-amount');
 const saveBtn = container.querySelector('#save-exp-btn');
 const tbody = container.querySelector('#exp-history-body');

 // Modal Elements
 const detailModal = container.querySelector('#detail-modal');
 const detailModalContent = container.querySelector('#detail-modal-content');
 const closeModalBtn = container.querySelector('#close-modal-btn');

 // Modal Logic
 function openDetailModal(data) {
 // Populate Data
 container.querySelector('#modal-title').textContent = data.item_name;
 container.querySelector('#modal-date').textContent = new Date(data.created_at).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' });
 container.querySelector('#modal-amount').textContent = `₹${parseFloat(data.amount).toFixed(2)}`;
 container.querySelector('#modal-category').textContent = data.category || '-';
 container.querySelector('#modal-location').textContent = data.location || '-';
 
 const typeSpan = container.querySelector('#modal-type');
 typeSpan.textContent = data.type;
 // Color coding for type
 typeSpan.className = `inline-block px-2 py-0.5 rounded text-xs font-bold ${data.type === 'Stock' || data.type === 'From Stock' ? 'bg-blue-100 text-blue-700' : 'bg-zinc-200 text-zinc-700'}`;

 // Remarks Logic
 if (data.remarks && data.remarks.trim() !== '') {
 container.querySelector('#modal-remarks').textContent = data.remarks;
 container.querySelector('#modal-remarks-box').classList.remove('hidden');
 container.querySelector('#modal-no-remarks').classList.add('hidden');
 } else {
 container.querySelector('#modal-remarks-box').classList.add('hidden');
 container.querySelector('#modal-no-remarks').classList.remove('hidden');
 }

 // Show Modal with Animation
 detailModal.classList.remove('hidden');
 // Trigger reflow
 void detailModal.offsetWidth;
 detailModal.classList.remove('opacity-0');
 detailModalContent.classList.remove('scale-95');
 detailModalContent.classList.add('scale-100');
 }

 function closeDetailModal() {
 detailModal.classList.add('opacity-0');
 detailModalContent.classList.remove('scale-100');
 detailModalContent.classList.add('scale-95');
 
 setTimeout(() => {
 detailModal.classList.add('hidden');
 }, 300); // Wait for transition duration
 }

 // Attach Close Events
 closeModalBtn.addEventListener('click', closeDetailModal);
 detailModal.addEventListener('click', (e) => {
 if (e.target === detailModal) closeDetailModal();
 });
 // Escape key to close
 document.addEventListener('keydown', (e) => {
 if (e.key === 'Escape' && !detailModal.classList.contains('hidden')) {
 closeDetailModal();
 }
 });

 let selectedProduct = null;
 let products = [];

 typeRadios.forEach(r => {
 r.addEventListener('change', (e) => {
 if (e.target.value === 'Stock' || e.target.value === 'From Stock') {
 manualGroup.classList.add('hidden');
 stockGroup.classList.remove('hidden');
 // Auto fetch products if not loaded
 if (products.length === 0) fetchProductList();
 } else {
 manualGroup.classList.remove('hidden');
 stockGroup.classList.add('hidden');
 }
 });
 });

 // --- Stock Search Logic ---
 async function fetchProductList() {
 let query = supabase.from('products').select('id, name, quantity, price');
 if (storeId) query = query.eq('store_id', storeId);
 const { data } = await query;
 if (data) products = data;
 }

 stockSearch.addEventListener('input', (e) => {
 const term = e.target.value.toLowerCase();
 if (term.length < 2) {
 stockResults.classList.add('hidden');
 return;
 }

 const matches = products.filter(p => p.name.toLowerCase().includes(term));
 if (matches.length > 0) {
 stockResults.innerHTML = matches.map(p => `
 <div class="p-2 hover:bg-zinc-100 cursor-pointer text-sm border-b border-zinc-50 last:border-0" data-id="${p.id}">
 <div class="font-medium text-zinc-900">${p.name}</div>
 <div class="text-xs text-zinc-500 flex justify-between">
 <span>Qty: ${p.quantity}</span>
 <span>Price: ₹${p.price}</span>
 </div>
 </div>
 `).join('');
 stockResults.classList.remove('hidden');

 // Re-attach listeners
 stockResults.querySelectorAll('div[data-id]').forEach(div => {
 div.addEventListener('click', () => {
 const id = div.dataset.id;
 selectedProduct = products.find(p => p.id === id);
 if (selectedProduct) {
 selProdName.textContent = selectedProduct.name;
 selProdInfo.classList.remove('hidden');
 stockSearch.value = '';
 stockResults.classList.add('hidden');
 amountInput.value = selectedProduct.price || 0;
 }
 });
 });

 } else {
 stockResults.innerHTML = '<div class="p-2 text-xs text-zinc-400">No matches found</div>';
 stockResults.classList.remove('hidden');
 }
 });

 // Hide search on outside click
 document.addEventListener('click', (e) => {
 if (!stockGroup.contains(e.target)) stockResults.classList.add('hidden');
 });

 clearProdBtn.addEventListener('click', () => {
 selectedProduct = null;
 selProdInfo.classList.add('hidden');
 amountInput.value = '';
 });


 // --- Save Logic ---
 saveBtn.addEventListener('click', async () => {
 const id = container.querySelector('#exp-id').value;
 const type = container.querySelector('input[name="exp-type"]:checked').value;
 const itemName = type === 'Stock' || type === 'From Stock' ? (selectedProduct ? selectedProduct.name : (id ? descInput.value : '')) : descInput.value.trim();

 const amount = parseFloat(amountInput.value);
 const date = container.querySelector('#exp-date').value;
 const category = container.querySelector('#exp-category').value;
 const location = container.querySelector('#exp-location').value.trim();
 const remarks = container.querySelector('#exp-remarks').value.trim();

 if (!itemName) return alert("Please enter item description or select a product.");
 if (isNaN(amount) || amount <= 0) return alert("Please enter a valid amount.");

 saveBtn.disabled = true;
 saveBtn.innerText = 'Saving...';

 try {
 if (type === 'Stock' && selectedProduct) {
 if (selectedProduct.quantity < 1) {
 alert("Warning: Stock is 0 or low. Proceeding anyway, count will become negative.");
 }
 const { error: stockErr } = await supabase
 .from('products')
 .update({ quantity: selectedProduct.quantity - 1 })
 .eq('id', selectedProduct.id);

 if (stockErr) throw stockErr;
 selectedProduct.quantity -= 1;
 }

 const payload = {
 item_name: itemName,
 amount: amount,
 type: type,
 category: category,
 location: location,
 remarks: remarks,
 product_id: (type === 'Stock' || type === 'From Stock') ? (selectedProduct?.id || null) : null,
 quantity: 1,
 created_at: new Date(date).toISOString(),
 store_id: storeId
 };

 let error;
 if (id) {
 const { error: upErr } = await supabase.from('expenditures').update(payload).eq('id', id);
 error = upErr;
 } else {
 const { error: insErr } = await supabase.from('expenditures').insert(payload);
 error = insErr;
 }

 if (error) throw error;

 descInput.value = '';
 amountInput.value = '';
 container.querySelector('#exp-location').value = '';
 container.querySelector('#exp-remarks').value = '';
 if (selectedProduct) {
 selectedProduct = null;
 selProdInfo.classList.add('hidden');
 }
 fetchExpHistory();
 alert(id ? "Expenditure updated!" : "Expenditure saved successfully!");
 container.querySelector('#exp-id').value = '';
 saveBtn.innerHTML = `<i data-lucide="wallet" class="w-4 h-4"></i> Save Expenditure`;

 } catch (err) {
 console.error(err);
 alert("Error saving: " + err.message);
 } finally {
 saveBtn.disabled = false;
 saveBtn.innerHTML = `<i data-lucide="wallet" class="w-4 h-4"></i> Save Expenditure`;
 if (window.lucide) window.lucide.createIcons();
 }
 });


 // --- History Logic ---
 async function fetchExpHistory() {
 let query = supabase
 .from('expenditures')
 .select('*')
 .order('created_at', { ascending: false })
 .limit(50);
 if (storeId) query = query.eq('store_id', storeId);
 const { data, error } = await query;

 if (error) {
 tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-red-500">Error: ${error.message}</td></tr>`;
 return;
 }

 allExpenditures = data;
 container.querySelector('#total-exp-count').textContent = data.length;

 if (data.length === 0) {
 tbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-zinc-400 italic">No expenditures recorded yet.</td></tr>`;
 return;
 }

 tbody.innerHTML = data.map(ex => `
 <tr class="table-row group">
 <td class="table-cell align-top text-muted-foreground">${new Date(ex.created_at).toLocaleDateString()}</td>
 <td class="table-cell align-top font-medium text-foreground">
 ${ex.item_name}
 ${ex.remarks ? `<div class="text-[10px] text-muted-foreground truncate max-w-[200px] mt-1">${ex.remarks}</div>` : ''}
 </td>
 <td class="table-cell align-top">
 <span class="badge ${ex.type === 'Stock' || ex.type === 'From Stock' ? 'badge-primary bg-primary/10 hover:bg-primary/20 text-primary border-primary/20' : 'badge-secondary hover:bg-muted'}">
 ${ex.type}
 </span>
 </td>
 <td class="table-cell align-top text-muted-foreground">${ex.location || '-'}</td>
 <td class="table-cell align-top text-muted-foreground text-[10px] uppercase font-semibold">${ex.category || '-'}</td>
 <td class="table-cell align-top text-right font-bold text-foreground">₹${ex.amount.toFixed(2)}</td>
 <td class="table-cell align-top text-center">
 <button class="menu-trigger btn-icon rounded-full hover:bg-muted text-muted-foreground transition-colors" data-id="${ex.id}">
 <i data-lucide="more-vertical" class="w-4 h-4"></i>
 </button>
 </td>
 </tr>
 `).join('');

 if (window.lucide) window.lucide.createIcons();

 tbody.querySelectorAll('.menu-trigger').forEach(btn => {
 btn.addEventListener('click', (e) => {
 e.stopPropagation();
 showPopup(btn, btn.dataset.id);
 });
 });
 }

 // --- Global Menu Actions ---
 
 // 1. Edit Action
 expPopupMenu.querySelector('#exp-popup-edit').addEventListener('click', (e) => {
 e.stopPropagation();
 if (currentActiveId) {
 const record = allExpenditures.find(d => d.id === currentActiveId);
 if (record) {
 hidePopup();
 container.querySelector('#exp-id').value = record.id;
 container.querySelector('#exp-date').value = new Date(record.created_at).toISOString().split('T')[0];

 if (record.type === 'Manual') {
 container.querySelector('input[value="Manual"]').click();
 descInput.value = record.item_name;
 } else {
 const stockRadio = container.querySelector('input[value="From Stock"]') || container.querySelector('input[value="Stock"]');
 if (stockRadio) stockRadio.click();
 descInput.value = record.item_name;
 }

 amountInput.value = record.amount;
 container.querySelector('#exp-category').value = record.category || 'Store';
 container.querySelector('#exp-location').value = record.location || '';
 container.querySelector('#exp-remarks').value = record.remarks || '';

 saveBtn.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i> Update Expenditure`;
 container.querySelector('.card').scrollIntoView({ behavior: 'smooth' });
 }
 }
 });

 // 2. Delete Action
 expPopupMenu.querySelector('#exp-popup-delete').addEventListener('click', async (e) => {
 e.stopPropagation();
 if (currentActiveId) {
 hidePopup();
 if (confirm('Delete this expenditure record?')) {
 const { error } = await supabase.from('expenditures').delete().eq('id', currentActiveId);
 if (!error) fetchExpHistory();
 else alert(error.message);
 }
 }
 });

 // 3. View Action (Modified to open Modal)
 expPopupMenu.querySelector('#exp-popup-view').addEventListener('click', (e) => {
 e.stopPropagation();
 if (currentActiveId) {
 const rec = allExpenditures.find(d => d.id === currentActiveId);
 hidePopup();
 if (rec) {
 // Open the custom modal instead of alert
 openDetailModal(rec);
 }
 }
 });

 // Init Load
 fetchExpHistory();
}
