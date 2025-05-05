import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Organizations table - the main tenant for users
  organizations: defineTable({
    name: v.string(),
    logo: v.optional(v.string()), // URL to logo in storage
    primaryColor: v.optional(v.string()), // Brand color (HEX)
    subscriptionTier: v.optional(v.string()), // "starter", "professional", "enterprise"
    receiptCounter: v.number(), // For generating sequential receipt IDs
    active: v.boolean(), // Whether organization is active
    createdAt: v.number(), // Timestamp
  }).index("by_name", ["name"]),

  // Users table - members of organizations with different roles
  users: defineTable({
    clerkId: v.string(), // External auth ID from Clerk
    name: v.string(),
    email: v.string(),
    organizationId: v.id("organizations"),
    role: v.string(), // "admin", "member", etc.
    permissions: v.array(v.string()), // Array of permission strings
    active: v.boolean(),
    lastLogin: v.optional(v.number()), // Timestamp
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_organization", ["organizationId"]),

  // Fund categories for contributions
  fundCategories: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    organizationId: v.id("organizations"),
    active: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(), // Timestamp
  }).index("by_organization", ["organizationId"]),

  // Contact types for classification
  contactTypes: defineTable({
    name: v.string(), // E.g., "Individual", "Institution", "Corporate", etc.
    description: v.optional(v.string()),
    organizationId: v.id("organizations"),
    isDefault: v.boolean(), // System-provided defaults vs user-created
    active: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(), // Timestamp
  })
    .index("by_organization", ["organizationId"])
    .index("by_name_and_org", ["name", "organizationId"]),

  // Contacts list - saved contributors for receipts
  contacts: defineTable({
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    contactTypeId: v.id("contactTypes"),
    notes: v.optional(v.string()),
    organizationId: v.id("organizations"),
    totalContributions: v.number(), // Running total of all contributions
    lastReceiptDate: v.optional(v.number()), // Timestamp of most recent receipt
    createdBy: v.id("users"),
    createdAt: v.number(), // Timestamp
    updatedAt: v.number(), // Timestamp
    active: v.boolean(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_email", ["email", "organizationId"])
    .index("by_name", ["name", "organizationId"])
    .index("by_contact_type", ["contactTypeId", "organizationId"])
    .index("by_latest", ["organizationId", "lastReceiptDate"]),

  // Receipt templates
  receiptTemplates: defineTable({
    name: v.string(),
    organizationId: v.id("organizations"),
    receiptTypeId: v.id("receiptTypes"), // Link to receipt type
    content: v.string(), // JSON or HTML template structure
    isDefault: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(), // Timestamp
    updatedAt: v.number(), // Timestamp
  })
    .index("by_organization", ["organizationId"])
    .index("by_receipt_type", ["organizationId", "receiptTypeId"]),

  // Organization settings
  organizationSettings: defineTable({
    organizationId: v.id("organizations"),
    emailSettings: v.optional(v.object({
      senderName: v.string(),
      senderEmail: v.string(),
      defaultSubject: v.string(),
      defaultMessage: v.string(),
    })),
    contactInfo: v.optional(v.object({
      phone: v.optional(v.string()),
      address: v.optional(v.string()),
    })),
    currencySettings: v.optional(v.object({
      code: v.string(), // Currency code, e.g., "USD", "EUR", "GBP"
      symbol: v.string(), // Currency symbol, e.g., "$", "€", "£"
    })),
    salesTaxSettings: v.optional(v.object({
      enabled: v.boolean(),
      percentage: v.number(),
      name: v.string(), // e.g., "VAT", "GST", "Sales Tax"
    })),
    whatsappIntegration: v.optional(v.object({
      enabled: v.boolean(),
      apiKey: v.string(),
    })),
    receiptNumberingFormat: v.optional(v.string()), // Format for receipt IDs (e.g., "ORG-{YEAR}-{NUMBER}")
    updatedBy: v.id("users"),
    updatedAt: v.number(), // Timestamp
  }).index("by_organization", ["organizationId"]),

  // Receipt types - define different types of receipts
  receiptTypes: defineTable({
    name: v.string(), // E.g., "Donation", "Sales", "Service", etc.
    description: v.optional(v.string()),
    organizationId: v.id("organizations"),
    isDefault: v.boolean(), // System-provided defaults vs user-created
    active: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(), // Timestamp
  })
    .index("by_organization", ["organizationId"])
    .index("by_name_and_org", ["name", "organizationId"]),

  // Receipts - the core entity being managed
  receipts: defineTable({
    receiptId: v.string(), // Custom formatted ID (e.g., "ORG-2023-001")
    organizationId: v.id("organizations"),
    createdBy: v.id("users"),
    templateId: v.id("receiptTemplates"),
    receiptTypeId: v.id("receiptTypes"), // Link to receipt type
    recipientName: v.string(),
    recipientEmail: v.optional(v.string()),
    recipientPhone: v.optional(v.string()), // For WhatsApp
    contactId: v.optional(v.id("contacts")), // Link to contact in contacts list
    totalAmount: v.number(),
    subtotalAmount: v.optional(v.number()), // Subtotal before tax for sales receipts
    taxAmount: v.optional(v.number()), // Tax amount for sales receipts
    taxPercentage: v.optional(v.number()), // Tax percentage used for this receipt
    taxName: v.optional(v.string()), // Name of the tax (e.g., "VAT", "GST")
    taxDisabled: v.optional(v.boolean()), // Flag to indicate if tax is disabled for this receipt
    currency: v.string(), // "USD", "EUR", etc.
    date: v.number(), // Timestamp
    status: v.string(), // "draft", "sent", "viewed", etc.
    sentVia: v.optional(v.string()), // "email", "whatsapp"
    sentDate: v.optional(v.number()), // Timestamp
    notes: v.optional(v.string()),
    metadata: v.optional(v.object({})), // Flexible field for additional data
  })
    .index("by_organization", ["organizationId"])
    .index("by_receipt_id", ["receiptId"])
    .index("by_recipient_email", ["recipientEmail"])
    .index("by_contact", ["contactId", "organizationId"])
    .index("by_status", ["organizationId", "status"])
    .index("by_date", ["organizationId", "date"])
    .index("by_receipt_type", ["organizationId", "receiptTypeId"]),

  // Item categories - generic categories for receipt items (renamed from fund categories)
  itemCategories: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    organizationId: v.id("organizations"),
    receiptTypeId: v.id("receiptTypes"), // Associated with a receipt type
    active: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(), // Timestamp
  })
    .index("by_organization", ["organizationId"])
    .index("by_receipt_type", ["organizationId", "receiptTypeId"]),

  // Receipt items - line items for each receipt (renamed from contributions)
  receiptItems: defineTable({
    receiptId: v.id("receipts"),
    itemCategoryId: v.id("itemCategories"),
    name: v.optional(v.string()), // Item name or description
    quantity: v.optional(v.number()), // Quantity for sales receipts
    unitPrice: v.optional(v.number()), // Unit price for sales receipts
    amount: v.number(), // Total amount (quantity * unitPrice for sales, or contribution amount for donations)
    description: v.optional(v.string()),
  }).index("by_receipt", ["receiptId"]),

  // Activity log for auditing
  activityLogs: defineTable({
    organizationId: v.id("organizations"),
    userId: v.id("users"),
    action: v.string(), // "create_receipt", "send_receipt", etc.
    resourceType: v.string(), // "receipt", "template", etc.
    resourceId: v.string(), // ID of the resource
    details: v.optional(v.string()), // Additional context
    timestamp: v.number(), // Timestamp
  })
    .index("by_organization", ["organizationId"])
    .index("by_user", ["userId"])
    .index("by_resource", ["resourceType", "resourceId"]),
});