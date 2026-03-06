/**
 * Layout Module — Fully Redesigned
 * Premium scrollable sidebar with store selector, responsive mobile/tablet support
 */

import { checkAuth, isMainAdmin, logout } from './auth.js';
import { getActiveStore, getAllStores, setActiveStore, getActiveStoreId } from './store_context.js';

export function renderSidebar(container, navigateCallback) {
    const user = checkAuth();
    const stores = getAllStores();
    const activeStore = getActiveStore();
    const mainAdmin = isMainAdmin();

    // Menu items — grouped by section
    const mainMenuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
    ];

    const operationItems = [
        { id: 'stock', label: 'Stock Management', icon: 'package' },
        { id: 'billing', label: 'New Invoice', icon: 'receipt' },
        { id: 'invoices', label: 'Invoice History', icon: 'file-text' },
        { id: 'expenditure', label: 'Expenditure', icon: 'wallet' },
        { id: 'queries', label: 'Customer Queries', icon: 'message-circle' },
        { id: 'repairs', label: 'Repair Board', icon: 'wrench' },
        { id: 'repair-history', label: 'All Repairs', icon: 'clipboard-list' },
    ];

    // Admin-only items
    const adminItems = mainAdmin ? [
        { id: 'stores', label: 'Manage Stores', icon: 'building-2' },
        { id: 'stock-transfer', label: 'Stock Transfer', icon: 'arrow-left-right' },
    ] : [];

    const utilityItems = [
        { id: 'backup', label: 'Backup & Restore', icon: 'database' },
    ];

    const renderNavItem = (item) => `
        <button
            data-view="${item.id}"
            class="nav-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sidebar-muted hover:bg-white/[0.08] hover:text-white transition-all duration-200 group text-sm"
            id="nav-${item.id}"
        >
            <i data-lucide="${item.icon}" class="w-[18px] h-[18px] flex-shrink-0 group-hover:scale-110 transition-transform"></i>
            <span class="nav-label font-medium truncate">${item.label}</span>
        </button>
    `;

    const storeOptions = stores.map(s => `
        <option value="${s.id}" ${activeStore?.id === s.id ? 'selected' : ''}>
            ${s.name} — ${s.location}
        </option>
    `).join('');

    container.innerHTML = `
        <!-- Mobile Overlay -->
        <div id="sidebar-overlay" class="sidebar-overlay hidden"></div>

        <div class="sidebar-inner">
            <!-- Header -->
            <div class="sidebar-header">
                <div class="sidebar-brand">
                    <div class="brand-icon">
                        <i data-lucide="zap" class="w-5 h-5"></i>
                    </div>
                    <div class="brand-text">
                        <span class="brand-name">JRPL</span>
                        <span class="brand-sub">Multi-Store Panel</span>
                    </div>
                </div>
                <button id="sidebar-close" class="sidebar-close-btn">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>

            <!-- Store Selector -->
            ${mainAdmin ? `
                <div class="store-selector">
                    <label class="store-label">
                        <i data-lucide="building-2" class="w-3 h-3"></i>
                        Active Store
                    </label>
                    <select id="store-switcher" class="store-dropdown">
                        <option value="">🏢 All Stores</option>
                        ${storeOptions}
                    </select>
                </div>
            ` : activeStore ? `
                <div class="store-badge">
                    <i data-lucide="map-pin" class="w-3.5 h-3.5"></i>
                    <span>${activeStore.name}</span>
                    <span class="store-location">${activeStore.location}</span>
                </div>
            ` : ''}

            <!-- Scrollable Navigation -->
            <nav class="sidebar-nav">
                <!-- Main -->
                <div class="nav-section">
                    ${mainMenuItems.map(renderNavItem).join('')}
                </div>

                <!-- Operations -->
                <div class="nav-section">
                    <div class="nav-section-title">Operations</div>
                    ${operationItems.map(renderNavItem).join('')}
                </div>

                ${adminItems.length > 0 ? `
                    <!-- Management (Admin Only) -->
                    <div class="nav-section">
                        <div class="nav-section-title">
                            <i data-lucide="shield" class="w-3 h-3"></i>
                            Management
                        </div>
                        ${adminItems.map(renderNavItem).join('')}
                    </div>
                ` : ''}

                <!-- Utility -->
                <div class="nav-section">
                    <div class="nav-section-title">System</div>
                    ${utilityItems.map(renderNavItem).join('')}
                </div>
            </nav>

            <!-- Footer -->
            <div class="sidebar-footer">
                <div class="user-info">
                    <div class="user-avatar">
                        ${(user?.display_name || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div class="user-details">
                        <span class="user-name">${user?.display_name || 'Admin'}</span>
                        <span class="user-role">${mainAdmin ? 'Main Admin' : 'Store Admin'}</span>
                    </div>
                </div>
                <button id="logout-btn" class="logout-btn" title="Logout">
                    <i data-lucide="log-out" class="w-[18px] h-[18px]"></i>
                </button>
            </div>
        </div>
    `;

    // Re-initialize icons
    if (window.lucide) window.lucide.createIcons();

    // -- Event Listeners --

    // Nav buttons
    container.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Active state
            container.querySelectorAll('.nav-btn').forEach(b => {
                b.classList.remove('nav-active');
            });
            btn.classList.add('nav-active');

            navigateCallback(btn.dataset.view);

            // Close mobile sidebar
            closeMobileSidebar();
        });
    });

    // Store switcher (main admin)
    const storeSwitcher = container.querySelector('#store-switcher');
    if (storeSwitcher) {
        storeSwitcher.addEventListener('change', (e) => {
            const storeId = e.target.value;
            if (storeId) {
                const store = getAllStores().find(s => s.id === storeId);
                setActiveStore(store);
            } else {
                setActiveStore(null); // All stores
            }
        });
    }

    // Logout
    const logoutBtn = container.querySelector('#logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                logout();
            }
        });
    }

    // Mobile sidebar close
    const closeBtn = container.querySelector('#sidebar-close');
    const overlay = container.querySelector('#sidebar-overlay');
    if (closeBtn) closeBtn.addEventListener('click', closeMobileSidebar);
    if (overlay) overlay.addEventListener('click', closeMobileSidebar);

    function closeMobileSidebar() {
        const sidebar = document.querySelector('#sidebar');
        if (sidebar) {
            sidebar.classList.remove('sidebar-open');
        }
        const ov = document.querySelector('#sidebar-overlay');
        if (ov) ov.classList.add('hidden');
    }

    // Set active default
    const defaultBtn = container.querySelector('[data-view="dashboard"]');
    if (defaultBtn) {
        defaultBtn.classList.add('nav-active');
    }
}

/**
 * Open mobile sidebar
 */
export function openMobileSidebar() {
    const sidebar = document.querySelector('#sidebar');
    if (sidebar) {
        sidebar.classList.add('sidebar-open');
    }
    const overlay = document.querySelector('#sidebar-overlay');
    if (overlay) overlay.classList.remove('hidden');
}
