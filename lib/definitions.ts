/**
 * Type definitions for Digital Receipt Pro application
 * This file contains all the shared type definitions used across the application
 */

import { Id } from "@/convex/_generated/dataModel";

/**
 * Receipt Types
 */

/**
 * Basic receipt information
 */
export interface Receipt {
  _id: string;
  receiptId: string;
  recipientName: string;
  totalAmount: number;
  date: number;
  status: string;
  currency?: string;
  items?: ReceiptItemRecord[];
  subtotalAmount?: number;
  taxAmount?: number;
  taxPercentage?: number;
  taxName?: string;
  taxDisabled?: boolean;
  notes?: string;
  templateId?: string;
  receiptTypeId?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  contactId?: string;
}

/**
 * Receipt item for creating a new receipt (client-side)
 */
export interface ReceiptItem {
  id: string;
  categoryId: string;
  categoryName: string;
  name?: string;
  quantity?: string;
  unitPrice?: string;
  amount: string;
  searchQuery?: string;
}

/**
 * Receipt item as stored in the database
 */
export interface ReceiptItemRecord {
  itemCategoryId: Id<"itemCategories">;
  name?: string;
  quantity?: number;
  unitPrice?: number;
  amount: number;
  description?: string;
}

/**
 * Data for creating a new receipt via the API
 */
export interface CreateReceiptData {
  templateId: Id<"receiptTemplates">;
  receiptTypeId: Id<"receiptTypes">;
  recipientName: string;
  recipientEmail?: string;
  recipientPhone?: string;
  contactId?: Id<"contacts">;
  totalAmount: number;
  currency: string;
  date: number;
  notes?: string;
  items: ReceiptItemRecord[];
  // Tax-related fields
  subtotalAmount?: number;
  taxDisabled?: boolean;
  taxAmount?: number;
  taxPercentage?: number;
  taxName?: string;
}

/**
 * Receipt type definition
 */
export interface ReceiptType {
  _id: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  active?: boolean;
}

/**
 * Item category for receipt items
 */
export interface ItemCategory {
  _id: string;
  name: string;
  description?: string;
  active?: boolean;
  receiptTypeId?: string;
}

/**
 * Contact related types
 */

/**
 * Contact information
 */
export interface Contact {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contactType: {
    _id: string;
    name: string;
  };
  totalContributions?: number;
  lastReceiptDate?: number;
  notes?: string;
}

/**
 * Contact type definition
 */
export interface ContactType {
  _id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  active: boolean;
}

/**
 * Organization Settings
 */
export interface OrganizationSettings {
  organizationId: string;
  emailSettings?: {
    senderName: string;
    senderEmail: string;
    defaultSubject: string;
    defaultMessage: string;
  };
  contactInfo?: {
    phone?: string;
    address?: string;
  };
  currencySettings?: {
    code: string;
    symbol: string;
  };
  salesTaxSettings?: {
    enabled: boolean;
    percentage: number;
    name: string;
  };
  whatsappIntegration?: {
    enabled: boolean;
    apiKey: string;
  };
  receiptNumberingFormat?: string;
}

/**
 * Activity and logging
 */
export interface ActivityLog {
  _id: string;
  _creationTime: number;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details?: string;
  timestamp: number;
  user: {
    name: string;
    email: string;
  };
  resourceDetails?: Record<string, unknown>;
  organizationId: string;
}

/**
 * Receipt Templates
 */
export interface ReceiptTemplate {
  _id: string;
  name: string;
  content: string;
  isDefault: boolean;
  organizationId?: string;
  receiptTypeId?: string;
  createdBy?: string;
  createdAt?: number;
  updatedAt?: number;
}

/**
 * Fund Categories
 */
export interface FundCategory {
  _id: string;
  name: string;
  description?: string;
  active: boolean;
  organizationId?: string;
  createdBy?: string;
  createdAt?: number;
}