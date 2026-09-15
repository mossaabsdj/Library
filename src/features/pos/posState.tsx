"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { playBeep } from "@/lib/utils";

export interface CartItem {
  productId: number;
  name: string;
  reference?: string | null;
  barcode?: string | null;
  unitPrice: number;
  purchasePrice: number;
  quantity: number;
  maxStock: number;
  discount: number;
  subtotal: number;
  image?: string | null;
}

export interface SelectedCustomer {
  id: number;
  fullName: string;
  phone?: string | null;
  credit: number;
  creditLimit: number;
}

export interface HeldSale {
  id: string;
  customer: SelectedCustomer | null;
  items: CartItem[];
  date: string;
  note: string;
  total: number;
}

export interface PosTicket {
  id: string;
  name: string;
  cart: CartItem[];
  selectedCustomer: SelectedCustomer | null;
  globalDiscount: number;
  createdAt: string;
}

interface PosContextType {
  // Multi-Ticket Management
  tickets: PosTicket[];
  activeTicketId: string;
  activeTicket: PosTicket;
  createNewTicket: (name?: string) => string;
  switchTicket: (ticketId: string) => void;
  closeTicket: (ticketId: string) => void;
  renameTicket: (ticketId: string, name: string) => void;

  // Active Ticket Properties & Operations
  cart: CartItem[];
  addToCart: (
    product: {
      id: number;
      name: string;
      reference?: string | null;
      primaryBarcode?: string | null;
      unitPrice: number | string;
      purchasePrice?: number | string | null;
      stockQuantity: number;
      image?: string | null;
    },
    barcode?: string | null,
  ) => { success: boolean; message?: string };
  updateQuantity: (
    productId: number,
    quantity: number,
  ) => { success: boolean; message?: string };
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
  selectedCustomer: SelectedCustomer | null;
  setSelectedCustomer: (customer: SelectedCustomer | null) => void;
  globalDiscount: number;
  setGlobalDiscount: (discount: number) => void;
  subtotal: number;
  totalDue: number;
  totalItemsCount: number;

  // Suspended Sales
  heldSales: HeldSale[];
  holdCurrentSale: (note?: string) => boolean;
  restoreHeldSale: (heldSaleId: string) => void;
  deleteHeldSale: (heldSaleId: string) => void;

  // Settings & Rules
  allowNegativeStock: boolean;
  setAllowNegativeStock: (val: boolean) => void;
}

const PosContext = createContext<PosContextType | undefined>(undefined);

export function PosProvider({ children }: { children: React.ReactNode }) {
  // Multi-ticket tabs
  const [tickets, setTickets] = useState<PosTicket[]>([
    {
      id: "ticket-1",
      name: "Ticket 1",
      cart: [],
      selectedCustomer: null,
      globalDiscount: 0,
      createdAt: new Date().toISOString(),
    },
  ]);
  const [activeTicketId, setActiveTicketId] = useState<string>("ticket-1");

  const [heldSales, setHeldSales] = useState<HeldSale[]>([]);
  const [allowNegativeStock, setAllowNegativeStock] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("smartpos_allow_negative_stock");
        if (saved !== null) {
          return JSON.parse(saved);
        }
      } catch {
        // ignore parse error
      }
    }
    return false;
  });

  // Load suspended sales from local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("smartpos_held_sales");
      if (saved) {
        setHeldSales(JSON.parse(saved));
      }
    } catch {
      // ignore parse error
    }
  }, []);

  // Fetch allowNegativeStock from /api/settings and listen for real-time changes
  useEffect(() => {
    let isMounted = true;
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data && data.allowNegativeStock !== undefined) {
            const isAllowed = Boolean(data.allowNegativeStock);
            setAllowNegativeStock(isAllowed);
            try {
              localStorage.setItem(
                "smartpos_allow_negative_stock",
                JSON.stringify(isAllowed),
              );
            } catch {
              // ignore
            }
          }
        }
      } catch (err) {
        console.error("Failed to load settings in POS:", err);
      }
    };

    fetchSettings();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "smartpos_allow_negative_stock" && e.newValue !== null) {
        try {
          setAllowNegativeStock(JSON.parse(e.newValue));
        } catch {
          // ignore
        }
      }
    };

    const handleCustomSettingsUpdate = (e: any) => {
      if (e.detail && e.detail.allowNegativeStock !== undefined) {
        setAllowNegativeStock(Boolean(e.detail.allowNegativeStock));
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(
      "settings-updated",
      handleCustomSettingsUpdate as EventListener,
    );

    return () => {
      isMounted = false;
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "settings-updated",
        handleCustomSettingsUpdate as EventListener,
      );
    };
  }, []);

  const saveHeldSales = (updated: HeldSale[]) => {
    setHeldSales(updated);
    localStorage.setItem("smartpos_held_sales", JSON.stringify(updated));
  };

  // Helper to get active ticket safely
  const activeTicket = tickets.find((t) => t.id === activeTicketId) ||
    tickets[0] || {
      id: "ticket-1",
      name: "Ticket 1",
      cart: [],
      selectedCustomer: null,
      globalDiscount: 0,
      createdAt: new Date().toISOString(),
    };

  const cart = activeTicket.cart;
  const selectedCustomer = activeTicket.selectedCustomer;
  const globalDiscount = activeTicket.globalDiscount;

  // Update active ticket state helper
  const updateActiveTicket = (updater: (prev: PosTicket) => PosTicket) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === activeTicket.id ? updater(t) : t)),
    );
  };

  // Create a new sales ticket tab
  const createNewTicket = (name?: string): string => {
    const nextNumber = tickets.length + 1;
    const newId = `ticket-${Date.now()}`;
    const newTicket: PosTicket = {
      id: newId,
      name: name || `Ticket ${nextNumber}`,
      cart: [],
      selectedCustomer: null,
      globalDiscount: 0,
      createdAt: new Date().toISOString(),
    };
    setTickets((prev) => [...prev, newTicket]);
    setActiveTicketId(newId);
    playBeep("click");
    return newId;
  };

  // Switch active ticket tab
  const switchTicket = (ticketId: string) => {
    if (tickets.some((t) => t.id === ticketId)) {
      setActiveTicketId(ticketId);
      playBeep("click");
    }
  };

  // Close ticket tab
  const closeTicket = (ticketId: string) => {
    if (tickets.length <= 1) {
      // If only 1 ticket left, just reset it
      setTickets([
        {
          id: "ticket-1",
          name: "Ticket 1",
          cart: [],
          selectedCustomer: null,
          globalDiscount: 0,
          createdAt: new Date().toISOString(),
        },
      ]);
      setActiveTicketId("ticket-1");
      playBeep("click");
      return;
    }

    const remaining = tickets.filter((t) => t.id !== ticketId);
    setTickets(remaining);
    if (activeTicketId === ticketId) {
      setActiveTicketId(remaining[remaining.length - 1].id);
    }
    playBeep("click");
  };

  // Rename a ticket tab
  const renameTicket = (ticketId: string, newName: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, name: newName } : t)),
    );
  };

  const setSelectedCustomer = (customer: SelectedCustomer | null) => {
    updateActiveTicket((t) => ({ ...t, selectedCustomer: customer }));
  };

  const setGlobalDiscount = (discount: number) => {
    updateActiveTicket((t) => ({ ...t, globalDiscount: discount }));
  };

  const addToCart = (
    product: {
      id: number;
      name: string;
      reference?: string | null;
      primaryBarcode?: string | null;
      unitPrice: number | string;
      purchasePrice?: number | string | null;
      stockQuantity: number;
      image?: string | null;
    },
    barcode?: string | null,
  ) => {
    const existingIndex = cart.findIndex(
      (item) => item.productId === product.id,
    );
    const unitP = Number(product.unitPrice) || 0;
    const purchaseP = Number(product.purchasePrice) || 0;

    if (existingIndex > -1) {
      const item = cart[existingIndex];
      const newQty = item.quantity + 1;

      if (!allowNegativeStock && newQty > product.stockQuantity) {
        playBeep("error");
        return {
          success: false,
          message: `Stock insuffisant. Disponible : ${product.stockQuantity}`,
        };
      }

      const updated = [...cart];
      updated[existingIndex] = {
        ...item,
        quantity: newQty,
        subtotal: newQty * item.unitPrice - item.discount,
      };
      updateActiveTicket((t) => ({ ...t, cart: updated }));
      playBeep("success");
      return { success: true };
    } else {
      if (!allowNegativeStock && product.stockQuantity <= 0) {
        playBeep("error");
        return {
          success: false,
          message: `Stock insuffisant. Disponible : ${product.stockQuantity}`,
        };
      }

      const newItem: CartItem = {
        productId: product.id,
        name: product.name,
        reference: product.reference,
        barcode: barcode || product.primaryBarcode,
        unitPrice: unitP,
        purchasePrice: purchaseP,
        quantity: 1,
        maxStock: product.stockQuantity,
        discount: 0,
        subtotal: unitP,
        image: product.image,
      };

      updateActiveTicket((t) => ({ ...t, cart: [...t.cart, newItem] }));
      playBeep("success");
      return { success: true };
    }
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return { success: true };
    }

    const index = cart.findIndex((i) => i.productId === productId);
    if (index === -1) return { success: false };

    const item = cart[index];
    if (!allowNegativeStock && quantity > item.maxStock) {
      playBeep("error");
      return {
        success: false,
        message: `Stock insuffisant. Disponible : ${item.maxStock}`,
      };
    }

    const updated = [...cart];
    updated[index] = {
      ...item,
      quantity,
      subtotal: quantity * item.unitPrice - item.discount,
    };
    updateActiveTicket((t) => ({ ...t, cart: updated }));
    playBeep("click");
    return { success: true };
  };

  const removeFromCart = (productId: number) => {
    updateActiveTicket((t) => ({
      ...t,
      cart: t.cart.filter((item) => item.productId !== productId),
    }));
    playBeep("click");
  };

  const clearCart = () => {
    updateActiveTicket((t) => ({
      ...t,
      cart: [],
      selectedCustomer: null,
      globalDiscount: 0,
    }));
    playBeep("click");
  };

  const holdCurrentSale = (note = ""): boolean => {
    if (cart.length === 0) return false;

    const newHeld: HeldSale = {
      id: "HELD-" + Date.now(),
      customer: selectedCustomer,
      items: [...cart],
      date: new Date().toISOString(),
      note:
        note ||
        (selectedCustomer ? selectedCustomer.fullName : "Client Comptoir"),
      total: totalDue,
    };

    saveHeldSales([...heldSales, newHeld]);
    clearCart();
    playBeep("success");
    return true;
  };

  const restoreHeldSale = (heldSaleId: string) => {
    const sale = heldSales.find((h) => h.id === heldSaleId);
    if (!sale) return;

    updateActiveTicket((t) => ({
      ...t,
      cart: sale.items,
      selectedCustomer: sale.customer,
    }));
    saveHeldSales(heldSales.filter((h) => h.id !== heldSaleId));
    playBeep("success");
  };

  const deleteHeldSale = (heldSaleId: string) => {
    saveHeldSales(heldSales.filter((h) => h.id !== heldSaleId));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const totalDue = Math.max(0, subtotal - globalDiscount);
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <PosContext.Provider
      value={{
        tickets,
        activeTicketId,
        activeTicket,
        createNewTicket,
        switchTicket,
        closeTicket,
        renameTicket,
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        selectedCustomer,
        setSelectedCustomer,
        globalDiscount,
        setGlobalDiscount,
        subtotal,
        totalDue,
        totalItemsCount,
        heldSales,
        holdCurrentSale,
        restoreHeldSale,
        deleteHeldSale,
        allowNegativeStock,
        setAllowNegativeStock,
      }}
    >
      {children}
    </PosContext.Provider>
  );
}

export function usePos() {
  const context = useContext(PosContext);
  if (!context) {
    throw new Error("usePos must be used within a PosProvider");
  }
  return context;
}
