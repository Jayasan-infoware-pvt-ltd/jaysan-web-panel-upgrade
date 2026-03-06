import './style.css'
import { renderSidebar, openMobileSidebar } from './modules/layout.js'
import { initStock } from './modules/stock.js'
import { initBilling } from './modules/billing.js'
import { initInvoiceHistory } from './modules/invoice_history.js'
import { initRepairs } from './modules/repairs.js'
import { initRepairHistory } from './modules/repair_history.js'
import { initExpenditure } from './modules/expenditure.js'
import { initQueries } from './modules/queries.js'
import { initAnalytics } from './modules/analytics.js'
import { initBackup } from './modules/backup.js'
import { initStoreManagement } from './modules/store_management.js'
import { initStockTransfer } from './modules/stock_transfer.js'
import { checkAuth, isMainAdmin, renderLogin, getUserStoreId } from './modules/auth.js'
import { loadStores, getActiveStoreId, setActiveStore, getActiveStore, getAllStores } from './modules/store_context.js'

const app = document.querySelector('#app')
const loading = document.querySelector('#loading')

// State
let currentState = {
    view: 'dashboard',
    user: null
}

async function init() {
    const user = checkAuth();

    if (!user) {
        loading.style.display = 'none';
        renderLogin(app);
        return;
    }

    currentState.user = user;

    // Load stores
    await loadStores();

    // If store admin, lock to their store
    if (user.role === 'store_admin' && user.store_id) {
        const stores = getAllStores();
        const myStore = stores.find(s => s.id === user.store_id);
        if (myStore) {
            setActiveStore(myStore);
        }
    }

    // Hide loading and render app
    setTimeout(() => {
        loading.style.display = 'none';
        renderApp();
    }, 400);
}

function renderApp() {
    app.innerHTML = '';

    // Layout Shell
    const sidebar = document.createElement('div');
    sidebar.id = 'sidebar';

    const main = document.createElement('main');
    main.id = 'main-content';

    app.appendChild(sidebar);
    app.appendChild(main);

    // Render Sidebar
    renderSidebar(sidebar, setCurrentView);

    // Listen for store changes → refresh current view
    window.addEventListener('store-changed', () => {
        // Re-render sidebar to update selection
        renderSidebar(sidebar, setCurrentView);
        // Re-highlight current nav
        const activeBtn = sidebar.querySelector(`[data-view="${currentState.view}"]`);
        if (activeBtn) activeBtn.classList.add('nav-active');
        // Reload current view
        navigateTo(currentState.view);
    });

    // Initial navigate
    navigateTo('dashboard');
}

function setCurrentView(view) {
    currentState.view = view;
    navigateTo(view);
}

function getStoreId() {
    // Store admin: always their store. Main admin: whatever they selected (null = all)
    if (!isMainAdmin()) {
        return getUserStoreId();
    }
    return getActiveStoreId(); // null means "all stores"
}

function navigateTo(view) {
    const main = document.querySelector('#main-content');
    if (!main) return;
    main.innerHTML = '';

    // Add mobile header
    const mobileHeader = document.createElement('div');
    mobileHeader.className = 'mobile-header';
    const activeStore = getActiveStore();
    mobileHeader.innerHTML = `
        <button class="burger-btn" id="open-sidebar-btn">
            <i data-lucide="menu" class="w-5 h-5"></i>
        </button>
        <span class="mobile-brand">JRPL Panel</span>
        <span class="mobile-store">${activeStore ? activeStore.name : 'All Stores'}</span>
    `;
    main.appendChild(mobileHeader);

    // Burger click
    const burgerBtn = mobileHeader.querySelector('#open-sidebar-btn');
    if (burgerBtn) {
        burgerBtn.addEventListener('click', openMobileSidebar);
    }

    if (window.lucide) window.lucide.createIcons();

    // Content container
    const content = document.createElement('div');
    content.className = 'animate-fade-in';
    main.appendChild(content);

    const storeId = getStoreId();

    // Role guard — admin-only views
    const adminOnlyViews = ['stores', 'stock-transfer'];
    if (adminOnlyViews.includes(view) && !isMainAdmin()) {
        content.innerHTML = `
            <div class="flex items-center justify-center h-64">
                <div class="text-center">
                    <i data-lucide="shield-x" class="w-16 h-16 text-slate-300 mx-auto mb-4"></i>
                    <h2 class="text-xl font-bold text-slate-400">Access Denied</h2>
                    <p class="text-slate-400 text-sm mt-2">This section is for Main Admin only.</p>
                </div>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        return;
    }

    switch (view) {
        case 'dashboard':
            initAnalytics(content, navigateTo, storeId);
            break;
        case 'stock':
            initStock(content, storeId);
            break;
        case 'billing':
            initBilling(content, storeId);
            break;
        case 'invoices':
            initInvoiceHistory(content, storeId);
            break;
        case 'repairs':
            initRepairs(content, storeId);
            break;
        case 'repair-history':
            initRepairHistory(content, storeId);
            break;
        case 'expenditure':
            initExpenditure(content, storeId);
            break;
        case 'queries':
            initQueries(content, storeId);
            break;
        case 'backup':
            initBackup(content, storeId);
            break;
        case 'stores':
            initStoreManagement(content);
            break;
        case 'stock-transfer':
            initStockTransfer(content);
            break;
        default:
            content.innerHTML = '<h1 class="text-2xl font-bold text-slate-400">Page Not Found</h1>';
    }
}

init();
