/**
 * Store Context Manager
 * Manages the currently active store for the entire application.
 * Main admin can switch stores; store admin is locked to their store.
 */

import { supabase } from "../supabase.js";

let activeStore = null; // { id, name, location }
let allStores = [];
let listeners = [];

export function getActiveStoreId() {
  return activeStore?.id || null;
}

export function getActiveStoreName() {
  return activeStore?.name || "All Stores";
}

export function getActiveStore() {
  return activeStore;
}

export function getAllStores() {
  return allStores;
}

export function setActiveStore(store) {
  activeStore = store;
  // Save to session
  if (store) {
    sessionStorage.setItem("active_store", JSON.stringify(store));
  } else {
    sessionStorage.removeItem("active_store");
  }
  // Notify all listeners
  listeners.forEach((fn) => fn(store));
  // Dispatch custom event for modules
  window.dispatchEvent(new CustomEvent("store-changed", { detail: store }));
}

export function onStoreChange(callback) {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter((fn) => fn !== callback);
  };
}

export async function loadStores() {
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (!error && data) {
    allStores = data;
  }

  // Restore from session if available
  const saved = sessionStorage.getItem("active_store");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Validate that the store still exists
      const exists = allStores.find((s) => s.id === parsed.id);
      if (exists) {
        activeStore = exists;
      }
    } catch (e) {}
  }

  return allStores;
}

/**
 * Apply store filter to a Supabase query.
 * If storeId is provided, filters by it.
 * If storeId is null (main admin viewing all), returns unfiltered.
 */
export function applyStoreFilter(query, storeId) {
  if (storeId) {
    return query.eq("store_id", storeId);
  }
  return query;
}
