import { supabase } from '../supabase.js';
import { Plus, Search, Edit2, Trash2, Download, MoreVertical, Eye, Image as ImageIcon, Upload, X, ChevronLeft, ChevronRight } from 'lucide';

export async function initStock(container, storeId = null) {
    container.innerHTML = `
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h2 class="text-3xl font-bold text-slate-800">Stock Inventory</h2>
                <div class="flex gap-2">
                    <button id="export-stock-btn" class="btn-secondary flex items-center gap-2 text-sm">
                        <i data-lucide="download" class="w-4 h-4"></i> Export CSV
                    </button>
                    ${storeId ? `
                    <button id="add-product-btn" class="btn-primary flex items-center gap-2">
                        <i data-lucide="plus" class="w-4 h-4"></i> Add Product
                    </button>
                    ` : ''}
                </div>
            </div>

            <div class="card p-4 flex gap-4">
                <div class="relative flex-1">
                    <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none"></i>
                    <input type="text" id="search-stock" placeholder="Search products..." class="input-field pl-12" />
                </div>
                <div class="w-48">
                    <select id="filter-category" class="input-field cursor-pointer">
                        <option value="">All Categories</option>
                        <!-- Dynamic Options populated later -->
                    </select>
                </div>
            </div>

            <div class="card overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm uppercase tracking-wider">
                            <th class="p-4 font-semibold w-24">Img</th>
                            <th class="p-4 font-semibold">Product Name</th>
                            <th class="p-4 font-semibold">Category</th>
                            <th class="p-4 font-semibold">Price (₹)</th>
                            <th class="p-4 font-semibold">Quantity</th>
                            <th class="p-4 font-semibold">Created</th>
                            <th class="p-4 font-semibold">Last Updated</th>
                            <th class="p-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="stock-table-body" class="text-slate-700 divide-y divide-slate-100">
                        <tr><td colspan="8" class="p-4 text-center">Loading...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Modal Template -->
        <div id="product-modal" class="fixed inset-0 bg-black/60 hidden items-center justify-center z-[100] backdrop-blur-sm">
            <div class="bg-white rounded-xl p-8 w-full max-w-md shadow-2xl transform transition-all scale-100 ring-1 ring-black/5 max-h-[90vh] overflow-y-auto overscroll-contain">
                <h3 id="modal-title" class="text-xl font-bold mb-4">Add Product</h3>
                <form id="product-form" class="space-y-4">
                    <input type="hidden" id="product-id">
                    
                    <!-- Multi-Image Upload -->
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">Product Images</label>
                        <div class="grid grid-cols-3 gap-2" id="image-gallery-preview">
                             <!-- Preview Items -->
                        </div>
                        <label class="mt-2 flex items-center justify-center w-full h-12 border-2 border-dashed border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                            <i data-lucide="plus" class="w-5 h-5 text-slate-400 mr-2"></i>
                            <span class="text-sm text-slate-500">Add Images</span>
                            <input type="file" id="product-image-input" accept="image/*" multiple class="hidden">
                        </label>
                        <button type="button" id="add-image-url-btn" class="flex flex-col items-center justify-center w-full h-12 border-2 border-dashed border-slate-300 rounded-lg hover:bg-slate-50 text-slate-500 hover:text-blue-600 transition-colors">
                            <i data-lucide="link" class="w-5 h-5 mb-1"></i>
                            <span class="text-[10px]">Add via URL</span>
                        </button>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
                        <input type="text" id="product-name" required class="input-field" placeholder="e.g. iPhone Screen">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Category / Tag</label>
                        <input type="text" id="product-category" class="input-field" list="category-suggestions" placeholder="e.g. Printer, Cables, Screen...">
                        <datalist id="category-suggestions">
                            <option value="Printer">
                            <option value="Toner / Cartridge">
                            <option value="Cables">
                            <option value="Accessories">
                            <option value="Spare Parts">
                            <option value="Mobile">
                        </datalist>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Selling Price</label>
                            <input type="number" id="product-price" required class="input-field" placeholder="0.00">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                            <input type="number" id="product-qty" required class="input-field" placeholder="0" min="0">
                        </div>
                    </div>

                    <!-- Actual Price (Cost) - Secured -->
                    <div class="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                        <div class="flex justify-between items-center mb-1">
                            <label class="block text-sm font-bold text-indigo-900">Actual Price (Cost)</label>
                            <button type="button" id="unlock-cost-btn" class="text-xs text-indigo-600 hover:text-indigo-800 underline">
                                <i data-lucide="lock" class="w-3 h-3 inline mr-1"></i>Unlock
                            </button>
                        </div>
                        <div class="relative">
                            <input type="number" id="product-cost" class="input-field bg-white" placeholder="Locked" disabled>
                            <div id="cost-mask" class="absolute inset-0 bg-indigo-100/90 backdrop-blur-md flex items-center justify-center text-xs text-indigo-400 font-mono select-none">
                                ••••••••
                            </div>
                        </div>
                        <p class="text-[10px] text-indigo-400 mt-1">Hidden from standard users. Required for profit calculation.</p>
                    </div>

                    <!-- Dynamic Serials Container -->
                    <div class="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Serial Numbers</label>
                        <div id="serials-container" class="space-y-2 max-h-40 overflow-y-auto pr-1">
                            <p class="text-xs text-slate-400 italic">Enter quantity to add serial numbers.</p>
                        </div>
                    </div>
                    
                    <!-- Vendor/Location Fields -->
                    <div class="space-y-4 pt-2 border-t border-slate-100">
                        <div>
                             <label class="block text-sm font-medium text-slate-700 mb-1">Vendor/Supplier Name</label>
                             <input type="text" id="product-vendor" class="input-field" placeholder="e.g. ABC Electronics">
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-slate-700 mb-1">Sourced From</label>
                                <input type="text" id="product-location" class="input-field" placeholder="e.g. Bangalore">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-slate-700 mb-1">Courier Charges</label>
                                <input type="number" id="product-courier" class="input-field" placeholder="0" value="0">
                            </div>
                        </div>
                    </div>

                    <div class="flex justify-end gap-3 mt-6">
                        <button type="button" id="cancel-modal" class="btn-secondary">Cancel</button>
                        <button type="submit" id="save-product-btn" class="btn-primary">Save Product</button>
                    </div>
                </form>

                <!-- Meta Info Panel (shown in view mode) -->
                <div id="product-meta-panel" class="hidden mt-4 pt-4 border-t border-slate-100 space-y-3">
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span class="text-xs font-bold text-slate-400 uppercase">Created</span>
                            <div id="meta-created" class="text-slate-700 font-medium mt-0.5">—</div>
                        </div>
                        <div>
                            <span class="text-xs font-bold text-slate-400 uppercase">Last Updated</span>
                            <div id="meta-updated" class="text-slate-700 font-medium mt-0.5">—</div>
                        </div>
                    </div>
                    <div>
                        <span class="text-xs font-bold text-slate-400 uppercase mb-2 block">Update History</span>
                        <div id="product-history-list" class="space-y-1 max-h-48 overflow-y-auto overscroll-contain text-xs text-slate-600">
                            <div class="text-slate-400 italic">Loading history...</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Lightbox -->
        <div id="lightbox" class="fixed inset-0 z-[110] bg-black/95 hidden flex flex-col items-center justify-center backdrop-blur-md">
             <!-- Close button with very high z-index and pointer-events -->
             <button id="lightbox-close" class="absolute top-10 right-10 text-white hover:text-red-500 z-[200] cursor-pointer p-4 bg-black/60 rounded-full transition-all hover:scale-110 flex items-center justify-center border-2 border-white/20" title="Close Preview">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
             </button>
             
             <div class="relative w-full h-full flex items-center justify-center px-12 z-[115]">
                 <button id="lightbox-prev" class="absolute left-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-[120]">
                    <i data-lucide="chevron-left" class="w-8 h-8"></i>
                 </button>
                 <img id="lightbox-img" class="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl" src="" alt="Preview">
                 <button id="lightbox-next" class="absolute right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-[120]">
                    <i data-lucide="chevron-right" class="w-8 h-8"></i>
                 </button>
             </div>
             <div id="lightbox-caption" class="absolute bottom-4 text-white/50 text-sm z-[120]"></div>
        </div>
    `;

    // Re-run icons
    if (window.lucide) window.lucide.createIcons();

    const tbody = container.querySelector('#stock-table-body');
    const searchInput = container.querySelector('#search-stock');
    const modal = container.querySelector('#product-modal');
    const form = container.querySelector('#product-form');
    const imageInput = container.querySelector('#product-image-input');
    const galleryPreview = container.querySelector('#image-gallery-preview');

    // Lightbox
    const lightbox = container.querySelector('#lightbox');
    const lbImg = container.querySelector('#lightbox-img');
    const lbPrev = container.querySelector('#lightbox-prev');
    const lbNext = container.querySelector('#lightbox-next');
    const lbClose = container.querySelector('#lightbox-close');

    let products = [];
    let currentUploadFiles = []; // Files explicitly selected to upload
    let currentExistingImages = []; // URLs of images already saved
    let initialExistingImages = []; // To track deletions

    let lightboxImages = [];
    let lightboxIndex = 0;

    // Fetch Data
    async function fetchProducts() {
        let query = supabase.from('products').select('*').order('created_at', { ascending: false });
        if (storeId) query = query.eq('store_id', storeId);
        const { data, error } = await query;
        if (error) {
            console.error('Error fetching products:', error);
            tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-red-500">Error loading stock</td></tr>`;
            return;
        }
        products = data;
        updateCategoryDropdown();
        renderTable(products);
    }

    // Helper: Parse Image URLs
    function getImages(imgString) {
        if (!imgString) return [];
        return imgString.split(',').filter(s => s.trim().length > 0);
    }

    function getCategoryColor(cat) {
        const colors = {
            'Printer': 'bg-orange-100 text-orange-800',
            'Toner / Cartridge': 'bg-cyan-100 text-cyan-800',
            'Cables': 'bg-gray-100 text-gray-800',
            'Accessories': 'bg-purple-100 text-purple-800',
            'Spare Parts': 'bg-indigo-100 text-indigo-800',
            'Mobile': 'bg-pink-100 text-pink-800',
            'General': 'bg-blue-100 text-blue-800'
        };
        return colors[cat] || 'bg-emerald-100 text-emerald-800'; // Default fallback
    }

    function renderTable(items) {
        if (items.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="p-8 text-center text-slate-400">No products found</td></tr>`;
            return;
        }
        tbody.innerHTML = items.map(p => {
            const images = getImages(p.image_url);
            const thumb = images.length > 0 ? images[0] : null;

            return `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="p-4">
                    ${thumb ?
                    `<div class="relative w-12 h-12 group cursor-zoom-in img-preview-trigger" data-id="${p.id}">
                             <img src="${thumb}" class="w-12 h-12 rounded-lg object-cover border border-slate-200" alt="${p.name}">
                             ${images.length > 1 ? `<span class="absolute bottom-0 right-0 bg-black/60 text-white text-[10px] px-1 rounded-bl-sm rounded-tr-sm">+${images.length - 1}</span>` : ''}
                        </div>` :
                    `<div class="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400"><i data-lucide="image" class="w-5 h-5"></i></div>`
                }
                </td>
                <td class="p-4 font-medium text-slate-900">${p.name}</td>
                <td class="p-4">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(p.category)}">
                        ${p.category || 'General'}
                    </span>
                </td>
                <td class="p-4">₹${p.price}</td>
                <td class="p-4">
                    <span class="${p.quantity < 5 ? 'text-red-600 font-bold' : 'text-green-600'}">
                        ${p.quantity}
                    </span>
                </td>
                <td class="p-4 text-sm text-slate-500">
                    ${p.created_at ? new Date(p.created_at).toLocaleDateString() : '-'}
                </td>
                <td class="p-4 text-sm text-slate-500">
                    ${p.updated_at ? new Date(p.updated_at).toLocaleString() : '-'}
                </td>
                <td class="p-4 text-right">
                    <button class="menu-trigger p-2 rounded-full hover:bg-slate-200 text-slate-400 transition-colors" data-id="${p.id}">
                        <i data-lucide="more-vertical" class="w-4 h-4"></i>
                    </button>
                </td>
            </tr>`;
        }).join('');

        if (window.lucide) window.lucide.createIcons();
        attachRowListeners();
    }

    function openLightbox(images, index = 0) {
        lightboxImages = images;
        lightboxIndex = index;
        lbImg.src = lightboxImages[lightboxIndex];
        container.querySelector('#lightbox-caption').textContent = `${lightboxIndex + 1} / ${lightboxImages.length}`;
        if (window.lucide) window.lucide.createIcons(lightbox);
        lightbox.classList.remove('hidden');
    }

    function updateLightbox() {
        if (lightboxImages.length === 0) return;
        lbImg.src = lightboxImages[lightboxIndex];
        container.querySelector('#lightbox-caption').textContent = `${lightboxIndex + 1} / ${lightboxImages.length}`;
    }

    lbClose.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        lightbox.classList.add('hidden');
    });

    // Also close on background click
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) lightbox.classList.add('hidden');
    });

    lbPrev.addEventListener('click', () => {
        lightboxIndex = (lightboxIndex - 1 + lightboxImages.length) % lightboxImages.length;
        updateLightbox();
    });
    lbNext.addEventListener('click', () => {
        lightboxIndex = (lightboxIndex + 1) % lightboxImages.length;
        updateLightbox();
    });


    // --- Body-Level Popup Menu Setup ---
    let popupMenu = document.getElementById('stock-action-menu');
    if (popupMenu) popupMenu.remove(); // Cleanup old one if any

    popupMenu = document.createElement('div');
    popupMenu.id = 'stock-action-menu';
    popupMenu.className = 'hidden fixed z-[500] bg-white rounded-xl shadow-lg border border-slate-200 w-48 py-2';
    popupMenu.style.transition = 'opacity 150ms ease, transform 150ms ease';
    popupMenu.innerHTML = `
        <button id="stock-popup-view" class="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            View Detail
        </button>
        <div class="border-t border-slate-100 my-1"></div>
        <button id="stock-popup-edit" class="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
            Edit Product
        </button>
        <div class="border-t border-slate-100 my-1"></div>
        <button id="stock-popup-delete" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
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

        // Re-attach button listeners for the new active ID
        const viewBtn = popupMenu.querySelector('#stock-popup-view');
        const editBtn = popupMenu.querySelector('#stock-popup-edit');
        const deleteBtn = popupMenu.querySelector('#stock-popup-delete');

        // Clear old listeners
        const newView = viewBtn.cloneNode(true);
        const newEdit = editBtn.cloneNode(true);
        const newDel = deleteBtn.cloneNode(true);
        viewBtn.replaceWith(newView);
        editBtn.replaceWith(newEdit);
        deleteBtn.replaceWith(newDel);

        newView.onclick = () => {
            const product = products.find(p => p.id === currentActiveId);
            if (product) openModal(false, product, true);
            hidePopup();
        };

        newEdit.onclick = () => {
            const product = products.find(p => p.id === currentActiveId);
            if (product) openModal(true, product);
            hidePopup();
        };

        newDel.onclick = async () => {
            const idToDelete = currentActiveId;
            hidePopup();
            const adminPass = prompt("Enter Developer Password to DELETE:");
            if (adminPass !== "Jayasan@9045") {
                alert("Incorrect Password!");
                return;
            }
            if (confirm('Delete this product?')) {
                const { error } = await supabase.from('products').delete().eq('id', idToDelete);
                if (error) alert(error.message);
                else fetchProducts();
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

    // Move global listener to a named function so we can avoid duplicates if possible, 
    // though initStock usually runs once per module mount.
    const handleGlobalClick = (e) => {
        if (!popupMenu.contains(e.target) && !e.target.closest('.menu-trigger')) {
            hidePopup();
        }
    };
    document.addEventListener('click', handleGlobalClick);
    
    // Cleanup on module transition (a bit tricky without a router hook, 
    // but moving the menu to body means we MUST clean up eventually)
    // We'll add it to a window property that our main.js can call.
    window.cleanupCurrentModule = () => {
        if (popupMenu) popupMenu.remove();
        document.removeEventListener('click', handleGlobalClick);
    };

    function attachRowListeners() {
        // Thumbnail Click
        tbody.querySelectorAll('.img-preview-trigger').forEach(el => {
            el.addEventListener('click', (e) => {
                const id = el.dataset.id;
                const p = products.find(prod => prod.id === id);
                if (p) openLightbox(getImages(p.image_url));
            });
        });

        // Row Menu Triggers
        tbody.querySelectorAll('.menu-trigger').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const id = btn.dataset.id;
                showPopup(btn, id);
            });
        });
    }

    // Search & Filter Logic
    function applyFilters() {
        const term = searchInput.value.toLowerCase();
        const cat = container.querySelector('#filter-category').value;

        console.log(`Filtering Stock - Term: "${term}", Category: "${cat}"`);

        const filtered = products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(term);
            // Handle null/undefined category as 'General' and strict compare
            const prodCat = p.category || 'General';
            const matchesCat = cat === '' || prodCat === cat;
            return matchesSearch && matchesCat;
        });
        renderTable(filtered);
    }

    searchInput.addEventListener('input', applyFilters);

    container.querySelector('#filter-category').addEventListener('change', applyFilters);

    function updateCategoryDropdown() {
        // Collect unique categories
        // Normalize nulls to 'General'
        const cats = new Set(products.map(p => p.category || 'General'));
        const select = container.querySelector('#filter-category');
        const currentVal = select.value;

        // Sort alphabetically
        const sortedCats = Array.from(cats).sort((a, b) => a.localeCompare(b));

        select.innerHTML = '<option value="">All Categories</option>' +
            sortedCats.map(c => `<option value="${c}">${c}</option>`).join('');

        // Restore selection if it still exists, otherwise default to ""
        if (sortedCats.includes(currentVal)) {
            select.value = currentVal;
        } else {
            select.value = "";
        }
    }

    // Serials Logic
    const qtyInput = container.querySelector('#product-qty');
    const serialsContainer = container.querySelector('#serials-container');

    function renderSerialInputs(count, existingSerials = []) {
        if (count <= 0) {
            serialsContainer.innerHTML = '<p class="text-xs text-slate-400 italic">Enter quantity to add serial numbers.</p>';
            return;
        }

        const currentInputs = Array.from(serialsContainer.querySelectorAll('input'));
        const currentValues = currentInputs.map(i => i.value);
        const valuesToUse = existingSerials.length > 0 ? existingSerials : currentValues;

        let html = '';
        currentValues.forEach((val, i) => { if (i < count && !existingSerials.length) valuesToUse[i] = val; });

        for (let i = 0; i < count; i++) {
            const val = valuesToUse[i] || '';
            html += `
                <div class="flex items-center gap-2">
                    <span class="text-xs text-slate-400 w-6">#${i + 1}</span>
                    <input type="text" class="serial-input input-field py-1 text-sm" placeholder="Serial No." value="${val}">
                </div>
            `;
        }
        serialsContainer.innerHTML = html;
    }

    qtyInput.addEventListener('input', (e) => {
        const val = parseInt(e.target.value) || 0;
        const currentInputs = Array.from(serialsContainer.querySelectorAll('.serial-input')).map(i => i.value);
        renderSerialInputs(val, currentInputs);
    });

    // Unlock Cost Logic
    const costInput = container.querySelector('#product-cost');
    const costMask = container.querySelector('#cost-mask');
    const unlockBtn = container.querySelector('#unlock-cost-btn');

    unlockBtn.addEventListener('click', () => {
        const pass = prompt('Enter Developer Password to Unlock Cost Price:');
        if (pass === 'admin123') {
            costInput.disabled = false;
            costMask.classList.add('hidden');
            unlockBtn.classList.add('hidden');
            costInput.focus();
        } else {
            alert('Incorrect Password');
        }
    });

    // Image Upload Logic in Modal

    function renderGallery() {
        galleryPreview.innerHTML = '';

        // Existing
        currentExistingImages.forEach((url, i) => {
            const div = document.createElement('div');
            div.className = 'relative w-full h-20 rounded-lg overflow-hidden border border-slate-200 group bg-slate-100';
            div.innerHTML = `
                <img src="${url}" class="w-full h-full object-cover">
                <button type="button" class="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 z-20 shadow-sm transition-transform hover:scale-110" title="Remove">
                    <i data-lucide="x" class="w-3 h-3"></i>
                </button>
            `;
            // Delete existing
            const btn = div.querySelector('button');
            if (window.lucide) window.lucide.createIcons(div); // Init icons inside this div

            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                currentExistingImages.splice(i, 1);
                renderGallery();
            });
            galleryPreview.appendChild(div);
        });

        // New Uploads
        currentUploadFiles.forEach((file, i) => {
            const div = document.createElement('div');
            div.className = 'relative w-full h-20 rounded-lg overflow-hidden border border-slate-200 group bg-slate-100';
            // We use file reader just for viewing
            const reader = new FileReader();
            reader.onload = (e) => {
                div.innerHTML = `
                    <img src="${e.target.result}" class="w-full h-full object-cover opacity-90">
                    <div class="absolute inset-0 flex items-center justify-center text-xs font-bold text-white bg-black/20 pointer-events-none">NEW</div>
                    <button type="button" class="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 z-40 shadow-lg transition-transform hover:scale-110 flex items-center justify-center" title="Remove">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                `;
                if (window.lucide) window.lucide.createIcons(div);

                const btn = div.querySelector('button');
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    currentUploadFiles.splice(i, 1);
                    renderGallery();
                });
            };
            reader.readAsDataURL(file);
            galleryPreview.appendChild(div);
        });
    }

    imageInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        currentUploadFiles = [...currentUploadFiles, ...files];
        renderGallery();
        imageInput.value = ''; // reset so same files can be selected again
        imageInput.value = ''; // reset so same files can be selected again
    });

    // Add Image via URL
    container.querySelector('#add-image-url-btn').addEventListener('click', () => {
        const url = prompt("Paste Image URL (e.g., from Imgur, Google Photos, etc.):");
        if (url && url.trim().length > 0) {
            // Basic validation or just trust user? Trust user for now, maybe check http
            if (!url.startsWith('http')) {
                alert('Please enter a valid URL starting with http:// or https://');
                return;
            }
            currentExistingImages.push(url.trim());
            renderGallery();
        }
    });


    // Modal Logic
    const openModal = (isEdit = false, data = null, isView = false) => {
        const title = isView ? 'Product Details' : (isEdit ? 'Edit Product' : 'Add Product');
        document.querySelector('#modal-title').textContent = title;

        document.querySelector('#product-id').value = isEdit || isView ? data.id : '';
        document.querySelector('#product-name').value = isEdit || isView ? data.name : '';
        document.querySelector('#product-category').value = isEdit || isView ? data.category || '' : '';
        document.querySelector('#product-price').value = isEdit || isView ? data.price : '';
        document.querySelector('#product-qty').value = isEdit || isView ? data.quantity : '';

        // Cost Price Handling (Secure)
        costInput.value = isEdit || isView ? data.cost_price || 0 : 0;
        costInput.disabled = true; // Always start disabled/locked
        costMask.classList.remove('hidden');
        unlockBtn.classList.remove('hidden');

        document.querySelector('#product-vendor').value = isEdit || isView ? data.vendor_name || '' : '';
        document.querySelector('#product-location').value = isEdit || isView ? data.location_from || '' : '';
        document.querySelector('#product-courier').value = isEdit || isView ? data.courier_charges || 0 : '';

        // Images Init
        currentUploadFiles = [];
        const existingDataImages = (isEdit || isView) ? getImages(data.image_url) : [];
        currentExistingImages = [...existingDataImages];
        initialExistingImages = [...existingDataImages]; // Snapshot for deletion logic

        renderGallery();

        // View Mode Specifics: Disable/Enable fields
        const allInteractables = form.querySelectorAll('input, select, textarea, button:not(#cancel-modal)');
        const saveBtn = container.querySelector('#save-product-btn');
        const cancelBtn = container.querySelector('#cancel-modal');
        const imageAddArea = container.querySelector('#product-image-input').parentElement; // The label wrapper
        const addUrlBtn = container.querySelector('#add-image-url-btn');

        const metaPanel = container.querySelector('#product-meta-panel');

        if (isView) {
            allInteractables.forEach(i => {
                i.disabled = true;
                if (i.tagName === 'INPUT' || i.tagName === 'TEXTAREA' || i.tagName === 'SELECT') {
                    i.classList.add('bg-slate-100', 'text-slate-500');
                }
            });
            if (saveBtn) saveBtn.classList.add('hidden');
            if (cancelBtn) cancelBtn.textContent = 'Close';

            // Add "Edit Product" button next to Close if not already present
            let editViewBtn = container.querySelector('#edit-from-view-btn');
            if (!editViewBtn) {
                editViewBtn = document.createElement('button');
                editViewBtn.type = 'button';
                editViewBtn.id = 'edit-from-view-btn';
                editViewBtn.className = 'btn-primary flex items-center gap-2';
                editViewBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg> Edit Product';
                cancelBtn.insertAdjacentElement('afterend', editViewBtn);
            } else {
                editViewBtn.classList.remove('hidden');
            }
            editViewBtn.onclick = () => openModal(true, data);

            // Hide Image Upload Controls
            if (imageAddArea) imageAddArea.classList.add('hidden');
            if (addUrlBtn) addUrlBtn.classList.add('hidden');

            // Hide remove buttons on images
            galleryPreview.querySelectorAll('button').forEach(b => b.classList.add('hidden'));

            // Show meta panel with dates + history
            if (metaPanel) {
                metaPanel.classList.remove('hidden');
                container.querySelector('#meta-created').textContent =
                    data.created_at ? new Date(data.created_at).toLocaleString() : '—';
                container.querySelector('#meta-updated').textContent =
                    data.updated_at ? new Date(data.updated_at).toLocaleString() : '—';

                // Load history
                const historyList = container.querySelector('#product-history-list');
                supabase.from('stock_history')
                    .select('*')
                    .eq('product_id', data.id)
                    .order('changed_at', { ascending: false })
                    .limit(30)
                    .then(({ data: history, error }) => {
                        if (error || !history || history.length === 0) {
                            historyList.innerHTML = '<div class="text-slate-400 italic">No history recorded yet.</div>';
                            return;
                        }
                        historyList.innerHTML = history.map(h => `
                            <div class="flex items-start gap-2 py-1.5 border-b border-slate-50 last:border-0">
                                <span class="mt-0.5 w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0"></span>
                                <div class="flex-1">
                                    <span class="font-medium text-slate-700">${h.change_type}</span>
                                    ${h.old_value && h.new_value ? `<span class="text-slate-400"> · ${h.old_value} → ${h.new_value}</span>` : ''}
                                    ${h.changed_by ? `<span class="text-slate-400"> · by ${h.changed_by}</span>` : ''}
                                    <div class="text-slate-400 text-[10px] mt-0.5">${new Date(h.changed_at).toLocaleString()}</div>
                                </div>
                            </div>
                        `).join('');
                    });
            }
        } else {
            allInteractables.forEach(i => {
                i.disabled = false;
                if (i.tagName === 'INPUT' || i.tagName === 'TEXTAREA' || i.tagName === 'SELECT') {
                    i.classList.remove('bg-slate-100', 'text-slate-500');
                }
            });
            if (saveBtn) saveBtn.classList.remove('hidden');
            if (cancelBtn) cancelBtn.textContent = 'Cancel';

            // Hide the view-mode Edit button when in edit/add mode
            const editViewBtn = container.querySelector('#edit-from-view-btn');
            if (editViewBtn) editViewBtn.classList.add('hidden');

            if (imageAddArea) imageAddArea.classList.remove('hidden');
            if (addUrlBtn) addUrlBtn.classList.remove('hidden');

            // Show remove buttons
            galleryPreview.querySelectorAll('button').forEach(b => b.classList.remove('hidden'));

            // Hide meta panel in edit/add mode
            if (metaPanel) metaPanel.classList.add('hidden');
        }

        const serials = ((isEdit || isView) && data.serial_number) ? data.serial_number.split(',') : [];
        renderSerialInputs((isEdit || isView) ? data.quantity : 0, serials);

        // Disable serial inputs if view mode
        if (isView) {
            container.querySelectorAll('.serial-input').forEach(i => {
                i.disabled = true;
                i.classList.add('bg-slate-100');
            });
        }

        modal.classList.remove('hidden');
        modal.classList.add('flex');
    };

    const closeModal = () => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        form.reset();
        currentUploadFiles = [];
        currentExistingImages = [];
        initialExistingImages = [];

        // Reset Security
        costInput.disabled = true;
        costMask.classList.remove('hidden');
        unlockBtn.classList.remove('hidden');
    };

    container.querySelector('#add-product-btn').addEventListener('click', () => openModal(false));
    container.querySelector('#cancel-modal').addEventListener('click', closeModal);

    // Add/Edit Submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const saveBtn = container.querySelector('#save-product-btn');
        saveBtn.disabled = true;
        saveBtn.innerHTML = 'Saving...';

        const id = document.querySelector('#product-id').value;
        const name = document.querySelector('#product-name').value;
        const category = document.querySelector('#product-category').value.trim() || 'General';
        const serialInputs = container.querySelectorAll('.serial-input');
        const serial_number = Array.from(serialInputs).map(i => i.value).filter(v => v.trim() !== '').join(',');

        const price = parseFloat(document.querySelector('#product-price').value) || 0;
        const cost_price = parseFloat(costInput.value) || 0; // Capture Cost
        const quantity = parseInt(document.querySelector('#product-qty').value) || 0;
        const vendor_name = document.querySelector('#product-vendor').value;
        const location_from = document.querySelector('#product-location').value;
        const courier_charges = parseFloat(document.querySelector('#product-courier').value) || 0;

        try {
            // 0. Handle Image Deletions (Files)
            if (id && initialExistingImages.length > 0) {
                const deletedImages = initialExistingImages.filter(img => !currentExistingImages.includes(img));
                if (deletedImages.length > 0) {
                    console.log('Deleting images:', deletedImages);
                    // Extract file paths from URLs
                    // URL format: .../storage/v1/object/public/product-images/filename
                    const paths = deletedImages.map(url => {
                        const parts = url.split('/product-images/');
                        return parts.length > 1 ? parts[1] : null;
                    }).filter(p => p !== null);

                    if (paths.length > 0) {
                        const { error: delErr } = await supabase.storage.from('product-images').remove(paths);
                        if (delErr) console.error('Error deleting files:', delErr);
                    }
                }
            }

            // 1. Upload new files
            const uploadedUrls = [];
            for (const file of currentUploadFiles) {
                const fileName = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${file.name.replace(/[^a-z0-9.]/gi, '_')}`;

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('product-images')
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                const { data: publicUrlData } = supabase.storage
                    .from('product-images')
                    .getPublicUrl(fileName);

                uploadedUrls.push(publicUrlData.publicUrl);
            }

            // 2. Combine with kept existing images
            const finalImageString = [...currentExistingImages, ...uploadedUrls].join(',');

            let payload = { name, category, serial_number, price, cost_price, quantity, vendor_name, location_from, courier_charges, image_url: finalImageString, store_id: storeId };

            if (!name) throw new Error('Name is required');

            let error;
            if (id) {
                // Grab old product for history diff
                const oldProduct = products.find(p => p.id === id);
                payload.updated_at = new Date().toISOString();
                const { error: err } = await supabase.from('products').update(payload).eq('id', id);
                error = err;

                if (!error && oldProduct) {
                    const historyEntries = [];
                    if (oldProduct.quantity !== quantity) {
                        historyEntries.push({
                            product_id: id, store_id: storeId,
                            change_type: 'Quantity Update',
                            old_value: String(oldProduct.quantity),
                            new_value: String(quantity),
                        });
                    }
                    if (oldProduct.price !== price) {
                        historyEntries.push({
                            product_id: id, store_id: storeId,
                            change_type: 'Price Update',
                            old_value: `₹${oldProduct.price}`,
                            new_value: `₹${price}`,
                        });
                    }
                    if (historyEntries.length === 0) {
                        historyEntries.push({
                            product_id: id, store_id: storeId,
                            change_type: 'Product Edited',
                            old_value: null, new_value: null,
                        });
                    }
                    // Fire-and-forget history inserts
                    supabase.from('stock_history').insert(historyEntries).then(({ error: hErr }) => {
                        if (hErr) console.warn('History insert error:', hErr.message);
                    });
                }
            } else {
                const { error: err, data: inserted } = await supabase.from('products').insert([payload]).select().single();
                error = err;
                if (!error && inserted) {
                    supabase.from('stock_history').insert([{
                        product_id: inserted.id, store_id: storeId,
                        change_type: 'Product Created',
                        old_value: null, new_value: name,
                    }]).then(({ error: hErr }) => {
                        if (hErr) console.warn('History insert error:', hErr.message);
                    });
                }
            }

            if (error) throw error;

            fetchProducts();
            closeModal();

        } catch (err) {
            console.error('Save error:', err);
            alert('Failed to save product: ' + err.message);
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = 'Save Product';
        }
    });

    // Export CSV
    container.querySelector('#export-stock-btn').addEventListener('click', () => {
        if (products.length === 0) return;

        let csv = "ID,Name,Price,Quantity,Vendor,Location,Courier Charges,Serials,Created At,Image URLs\n";

        csv += products.map(p => {
            const safeName = (p.name || '').replace(/,/g, ' ');
            const safeVendor = (p.vendor_name || '').replace(/,/g, ' ');
            const safeLoc = (p.location_from || '').replace(/,/g, ' ');
            const safeSerials = (p.serial_number || '').replace(/,/g, ';');
            const safeImages = (p.image_url || '').replace(/,/g, ';');

            return `${p.id},${safeName},${p.price},${p.quantity},${safeVendor},${safeLoc},${p.courier_charges || 0},${safeSerials},${new Date(p.created_at).toLocaleDateString()},${safeImages}`;
        }).join("\n");

        const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csv);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `stock_inventory_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    fetchProducts();
}
