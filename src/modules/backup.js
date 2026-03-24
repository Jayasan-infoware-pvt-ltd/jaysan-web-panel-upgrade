import { supabase } from '../supabase.js';
import { Database, Upload, Download, AlertTriangle, CheckCircle, Lock } from 'lucide';

export function initBackup(container, storeId = null) {
    container.innerHTML = `
        <div class="space-y-6">
            <div class="flex items-center gap-3">
                <h2 class="text-2xl font-bold text-zinc-900">Data Backup & Restore</h2>
                <span class="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold border border-amber-200">Admin Only</span>
            </div>

            <p class="text-zinc-500 max-w-2xl">
                Securely export your entire database to a JSON file or restore data from a previous backup. 
                <br><strong>Note:</strong> Restore operations require the Administrator Password.
            </p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                <!-- EXPORT SECTION -->
                <div class="card p-8 border-l-4 border-l-emerald-500">
                    <div class="flex items-center gap-4 mb-6">
                        <div class="p-4 bg-emerald-100 text-emerald-600 rounded-full">
                            <i data-lucide="download" class="w-8 h-8"></i>
                        </div>
                        <div>
                            <h3 class="text-xl font-bold text-zinc-900">Export / Backup</h3>
                            <p class="text-sm text-zinc-500">Download all data as a .json file</p>
                        </div>
                    </div>
                    
                    <div class="space-y-4">
                        <div class="p-4 bg-zinc-50 rounded-lg text-sm text-zinc-600 border border-zinc-100">
                            <strong>Includes:</strong> Products, Stock Levels, Repairs, Bills, Sales History, Expenditures, and Customer Queries.
                        </div>
                        <button id="start-backup-btn" class="btn-primary w-full py-4 text-lg shadow-emerald-200 shadow-sm hover:shadow-md transition-all">
                            Download Backup File
                        </button>
                        <div id="backup-status" class="text-center text-sm font-medium h-6"></div>
                    </div>
                </div>

                <!-- IMPORT SECTION -->
                <div class="card p-8 border-l-4 border-l-blue-500 relative overflow-hidden">
                    <div class="flex items-center gap-4 mb-6">
                        <div class="p-4 bg-blue-100 text-blue-600 rounded-full">
                            <i data-lucide="upload" class="w-8 h-8"></i>
                        </div>
                        <div>
                            <h3 class="text-xl font-bold text-zinc-900">Restore Data</h3>
                            <p class="text-sm text-zinc-500">Import data from a backup file</p>
                        </div>
                    </div>

                    <div class="space-y-4">
                        <div class="p-4 bg-amber-50 rounded-lg text-sm text-amber-800 border border-amber-100 flex gap-2">
                            <i data-lucide="alert-triangle" class="w-5 h-5 flex-shrink-0"></i>
                            <p><strong>Warning:</strong> Restoring data acts as a "Smart Update". It will update existing records (if IDs match) and create new ones. It does not delete existing data.</p>
                        </div>
                        
                        <div class="relative group">
                            <input type="file" id="restore-file-input" accept=".json" class="bs-file-input block w-full text-sm text-zinc-500
                              file:mr-4 file:py-3 file:px-4
                              file:rounded-full file:border-0
                              file:text-sm file:font-semibold
                              file:bg-blue-50 file:text-blue-700
                              hover:file:bg-blue-100 cursor-pointer
                            "/>
                        </div>

                        <button id="start-restore-btn" class="btn-secondary w-full py-4 text-lg border-2 border-dashed border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-blue-600 transition-all">
                            <i data-lucide="lock" class="w-4 h-4 inline mr-2"></i> Restore from Backup
                        </button>
                        <div id="restore-status" class="text-center text-sm font-medium h-6"></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Logic
    const backupBtn = container.querySelector('#start-backup-btn');
    const backupStatus = container.querySelector('#backup-status');

    // EXPORT
    backupBtn.addEventListener('click', async () => {
        backupBtn.disabled = true;
        backupBtn.textContent = 'Gathering Data...';
        backupStatus.textContent = 'Fetching tables...';
        backupStatus.className = 'text-center text-sm font-medium h-6 text-zinc-500';

        try {
            const tables = ['products', 'expenditures', 'customer_queries', 'bills', 'bill_items', 'repairs'];
            const exportData = {};

            for (const table of tables) {
                let query = supabase.from(table).select('*');
                if (storeId) query = query.eq('store_id', storeId);
                const { data, error } = await query;
                if (error) throw new Error(`Failed to fetch ${table}: ${error.message}`);
                exportData[table] = data;
            }

            exportData.meta = {
                timestamp: new Date().toISOString(),
                version: '1.0',
                app: 'RepairCmd'
            };

            // Download
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_repaircmd_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            backupStatus.textContent = 'Backup Downloaded Successfully!';
            backupStatus.className = 'text-center text-sm font-medium h-6 text-emerald-600';
            setTimeout(() => {
                backupBtn.textContent = 'Download Backup File';
                backupBtn.disabled = false;
            }, 2000);

        } catch (err) {
            console.error(err);
            alert('Export Failed: ' + err.message);
            backupBtn.disabled = false;
            backupBtn.textContent = 'Download Backup File';
            backupStatus.textContent = '';
        }
    });


    // RESTORE
    const restoreBtn = container.querySelector('#start-restore-btn');
    const fileInput = container.querySelector('#restore-file-input');
    const restoreStatus = container.querySelector('#restore-status');

    restoreBtn.addEventListener('click', async () => {
        const file = fileInput.files[0];
        if (!file) {
            alert('Please select a .json backup file first.');
            return;
        }

        const pass = prompt('Enter Admin Password to RESTORE database:');
        if (pass !== 'admin123') {
            alert('Incorrect Password. Restore Cancelled.');
            return;
        }

        if (!storeId) {
            alert('CRITICAL: You must select a specific store from the top dropdown before restoring data. You cannot restore data into "All Stores".');
            return;
        }

        if (!confirm('Are you sure you want to restore? This will update existing records and add new ones.')) return;

        restoreBtn.disabled = true;
        restoreBtn.innerHTML = '<span class="animate-pulse">Restoring... Do NOT Close.</span>';

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                let json = JSON.parse(e.target.result);

                // HANDLE RAW SUPABASE EXPORT (ARRAY)
                if (Array.isArray(json)) {
                    // Heuristic detection of table
                    const sample = json[0];
                    if (!sample) throw new Error("Empty file.");

                    let detectedTable = null;
                    const keys = Object.keys(sample).map(k => k.toLowerCase());
                    
                    if (keys.includes('bill_id') && (keys.includes('product_name') || keys.includes('price_at_sale'))) detectedTable = 'bill_items';
                    else if (keys.includes('total_amount') && keys.includes('customer_name')) detectedTable = 'bills';
                    else if (keys.includes('device_details') && keys.includes('status')) detectedTable = 'repairs';
                    else if (keys.includes('item_name') && keys.includes('amount')) detectedTable = 'expenditures';
                    else if (keys.includes('requirement') && keys.includes('customer_name')) detectedTable = 'customer_queries';
                    else if (keys.includes('name') && keys.includes('price') && keys.includes('quantity')) detectedTable = 'products';

                    if (detectedTable) {
                        const confirmMsg = `Detected Supabase export for table '${detectedTable}' (${json.length} rows).\nProceed to restore?`;
                        if (!confirm(confirmMsg)) {
                            restoreBtn.disabled = false;
                            restoreBtn.innerHTML = '<i data-lucide="lock" class="w-4 h-4 inline mr-2"></i> Restore from Backup';
                            return;
                        }
                        // Wrap it to match expected format
                        json = { [detectedTable]: json };
                    } else {
                        throw new Error("Could not automatically detect table type from JSON. Please use the system backup format.");
                    }
                }

                const sequence = ['stores', 'products', 'expenditures', 'customer_queries', 'repairs', 'bills', 'bill_items'];
                const aliases = {
                    'bill': 'bills', 'bill_item': 'bill_items', 'product': 'products',
                    'expenditure': 'expenditures', 'repair': 'repairs', 'store': 'stores',
                    'customer_query': 'customer_queries', 'stock': 'products'
                };

                let totalRestored = 0;

                // 1. Normalize JSON structure and keys
                const normalizedData = {};
                Object.keys(json).forEach(key => {
                    const lowerKey = key.toLowerCase();
                    const targetTable = aliases[lowerKey] || lowerKey;
                    if (Array.isArray(json[key])) {
                        normalizedData[targetTable] = json[key].map(row => {
                            const cleanRow = {};
                            Object.keys(row).forEach(rk => {
                                const rkLower = rk.toLowerCase();
                                cleanRow[rkLower] = row[rk];
                            });
                            // Legacy Mappings
                            if (cleanRow.billid && !cleanRow.bill_id) cleanRow.bill_id = cleanRow.billid;
                            if (cleanRow.productid && !cleanRow.product_id) cleanRow.product_id = cleanRow.productid;
                            if (!cleanRow.id && cleanRow.uuid) cleanRow.id = cleanRow.uuid;
                            return cleanRow;
                        });
                    }
                });

                // 2. Pre-scan: Check integrity of Bill Items
                if (normalizedData.bill_items && normalizedData.bill_items.length > 0) {
                    const billIds = new Set((normalizedData.bills || []).map(b => b.id));
                    const missingParents = normalizedData.bill_items.filter(item => 
                        item.bill_id && !billIds.has(item.bill_id)
                    );

                    if (missingParents.length > 0) {
                        const sample = missingParents[0];
                        const confirmed = confirm(`WARNING: Found ${missingParents.length} bill items referring to non-existent bills (e.g., ID: ${sample.bill_id}). \n\nThese will fail to restore. Would you like to attempt restoration anyway? (Recommended: No)`);
                        if (!confirmed) throw new Error("Restoration cancelled due to integrity issues.");
                    }
                }

                let statusLog = [];

                let tableStats = {};

                // 3. Sequential Restore
                for (const table of sequence) {
                    const rows = normalizedData[table];
                    if (rows && rows.length > 0) {
                        let successCount = 0;
                        let skipCount = 0;
                        let skipReasons = {};

                        restoreStatus.textContent = `Restoring ${table} (${rows.length} records)...`;
                        restoreStatus.className = 'text-center text-sm font-medium h-6 text-blue-600';

                        // Batch Upsert
                        const BATCH_SIZE = 50;
                        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
                            const chunk = rows.slice(i, i + BATCH_SIZE).map(row => {
                                if (storeId) row.store_id = storeId;
                                return row;
                            });
                            
                            try {
                                const { error } = await supabase.from(table).upsert(chunk);
                                if (error) throw error;
                                successCount += chunk.length;
                            } catch (batchError) {
                                console.warn(`Batch failed for ${table}, falling back to row-by-row:`, batchError);
                                
                                // ROW-LEVEL FALLBACK
                                for (const row of chunk) {
                                    try {
                                        const { error } = await supabase.from(table).upsert(row);
                                        if (error) {
                                            // 23503: Foreign Key Violation (Missing Parent)
                                            // 23505: Unique Constraint Violation (Already Exists)
                                            if (error.code === '23503' || error.code === '23505') {
                                                skipCount++;
                                                const reason = error.code === '23503' ? 'Missing Parent' : 'Already Exists';
                                                skipReasons[reason] = (skipReasons[reason] || 0) + 1;
                                                continue;
                                            }
                                            throw error;
                                        }
                                        successCount++;
                                    } catch (rowError) {
                                        console.error(`Fatal error on ${table} row:`, rowError);
                                        throw new Error(`Restore Failed on ${table}: ${rowError.message}\n\nID: ${row.id || 'N/A'}`);
                                    }
                                }
                            }
                        }
                        
                        totalRestored += successCount;
                        let statMsg = `${table}: ${successCount} restored`;
                        if (skipCount > 0) {
                            const details = Object.entries(skipReasons).map(([r, c]) => `${c} ${r}`).join(', ');
                            statMsg += ` (${details} skipped)`;
                        }
                        statusLog.push(statMsg);
                    }
                }

                restoreStatus.textContent = `Complete! Total Restored: ${totalRestored}`;
                restoreStatus.className = 'text-center text-sm font-medium h-6 text-emerald-600 font-bold';
                alert(`Database Restore Processed!\n\nSummary:\n${statusLog.join('\n')}`);
                fileInput.value = '';

            } catch (err) {
                console.error(err);
                alert('Restore Failed: ' + err.message);
                restoreStatus.textContent = 'Restore Failed. Check Console.';
                restoreStatus.className = 'text-center text-sm font-medium h-6 text-red-600';
            } finally {
                restoreBtn.innerHTML = '<i data-lucide="lock" class="w-4 h-4 inline mr-2"></i> Restore from Backup';
                restoreBtn.disabled = false;
                if (window.lucide) window.lucide.createIcons();
            }
        };
        reader.readAsText(file);
    });
}
