"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Eye, Plus, Trash, User, X } from "lucide-react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { formatDate } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { useToast } from "@/components/ui/use-toast"
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList 
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface ReceiptItem {
  id: string
  categoryId: string
  categoryName: string
  name?: string
  quantity?: string
  unitPrice?: string
  amount: string
  searchQuery?: string
}

interface Contact {
  _id: string
  name: string
  email?: string
  phone?: string
  address?: string
  contactType: {
    _id: string
    name: string
  }
}

interface ReceiptType {
  _id: string
  name: string
  description?: string
}

export function NewReceiptClient() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([{ 
    id: "1", 
    categoryId: "", 
    categoryName: "", 
    amount: "",
    searchQuery: ""
  }])
  const [selectedReceiptType, setSelectedReceiptType] = useState<ReceiptType | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")
  // Format the current date for the receipt date field
  const formattedToday = new Date().toISOString().split("T")[0] // YYYY-MM-DD format for date input
  
  const [formData, setFormData] = useState({
    contributorName: "",
    receiptDate: formattedToday,
    email: "",
    phone: "",
    address: "",
    notes: "",
    receiptTypeId: "" // Added receipt type ID
  })
  
  // Contact search and selection
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [isContactPopoverOpen, setIsContactPopoverOpen] = useState(false)
  
  // Fund category popover state
  const [openFundPopoverId, setOpenFundPopoverId] = useState<string | null>(null)
  
  // Per-receipt tax override
  const [disableTaxForReceipt, setDisableTaxForReceipt] = useState(false)

  // Get contacts for autocomplete - only run when search query changes and is not empty
  const searchResults = useQuery(
    api.contacts.searchContacts, 
    searchQuery.length > 1 ? { search: searchQuery, limit: 5 } : "skip"
  ) || []

  // Get organization settings for currency
  const orgSettings = useQuery(api.settings.getOrganizationSettings)
  
  // Get receipt types from the database
  const receiptTypes = useQuery(api.receiptTypes.listReceiptTypes) || []
  
  // Initialize receipt types if none exist
  const initializeReceiptTypes = useMutation(api.receiptTypes.initializeDefaultReceiptTypes)
  
  // Check if we need to initialize receipt types
  useEffect(() => {
    if (receiptTypes.length === 0) {
      // Initialize default receipt types
      initializeReceiptTypes()
        .catch(error => {
          console.error("Failed to initialize receipt types:", error)
        })
    }
  }, [receiptTypes.length, initializeReceiptTypes])
  
  // Get item categories based on selected receipt type
  const itemCategories = useQuery(
    api.itemCategories.listItemCategories,
    selectedReceiptType ? { receiptTypeId: selectedReceiptType._id as Id<"receiptTypes"> } : "skip"
  ) || []
  
  // Initialize item categories mutation
  const initializeItemCategories = useMutation(api.itemCategories.initializeItemCategories)
  
  // Initialize item categories if none exist and we have a receipt type
  useEffect(() => {
    if (itemCategories.length === 0 && selectedReceiptType) {
      // Initialize item categories
      initializeItemCategories({
        receiptTypeId: selectedReceiptType._id as Id<"receiptTypes">
      }).catch(error => {
        console.error("Failed to initialize item categories:", error)
      })
    }
  }, [itemCategories.length, selectedReceiptType, initializeItemCategories])
  
  // Get templates for the selected receipt type
  const receiptTemplates = useQuery(
    api.templates.listTemplatesByType,
    selectedReceiptType ? { receiptTypeId: selectedReceiptType._id as Id<"receiptTypes"> } : "skip"
  ) || []
  
  // Initialize templates mutation
  const initializeTemplates = useMutation(api.templates.initializeDefaultTemplates)
  
  // Initialize templates if none exist and we have receipt types
  useEffect(() => {
    if (receiptTemplates.length === 0 && selectedReceiptType) {
      // Initialize templates
      initializeTemplates()
        .catch(error => {
          console.error("Failed to initialize templates:", error)
        })
    }
  }, [receiptTemplates.length, selectedReceiptType, initializeTemplates])
  
  // Get item categories for autocomplete
  const itemCategorySearchResults = useQuery(
    api.itemCategories.searchItemCategories,
    receiptItems.some(item => item.searchQuery && item.searchQuery.length > 1 && item.id === openFundPopoverId) && selectedReceiptType
      ? { 
          receiptTypeId: selectedReceiptType._id as Id<"receiptTypes">,
          search: receiptItems.find(item => item.id === openFundPopoverId)?.searchQuery || "", 
          limit: 5 
        }
      : "skip"
  ) || []
  
  // Create item category mutation
  const createItemCategory = useMutation(api.itemCategories.createItemCategory)
  
  // Create receipt type mutation
  const createReceiptType = useMutation(api.receiptTypes.createReceiptType)
  
  // Default currency symbol and code
  const currencySymbol = orgSettings?.currencySettings?.symbol || "$"
  const currencyCode = orgSettings?.currencySettings?.code || "USD"

  // Create receipt mutation
  const createReceipt = useMutation(api.receipts.createReceipt)

  // Handle contact selection
  const selectContact = (contact: Contact) => {
    setSelectedContact(contact)
    setFormData({
      ...formData,
      contributorName: contact.name,
      email: contact.email || "",
      phone: contact.phone || "",
      address: contact.address || "",
    })
    setIsContactPopoverOpen(false)
  }

  // Clear selected contact
  const clearSelectedContact = () => {
    setSelectedContact(null)
    // Keep the form data as is
  }

  const addReceiptItem = () => {
    const newId = String(receiptItems.length + 1)
    setReceiptItems([...receiptItems, { 
      id: newId, 
      categoryId: "", 
      categoryName: "", 
      amount: "", 
      searchQuery: "" 
    }])
  }

  const removeReceiptItem = (id: string) => {
    if (receiptItems.length > 1) {
      setReceiptItems(receiptItems.filter((item) => item.id !== id))
    }
  }

  const updateReceiptItem = (id: string, field: keyof ReceiptItem, value: string) => {
    setReceiptItems(receiptItems.map((item) => {
      if (item.id === id) {
        if (field === "categoryId") {
          // Find the category name when the ID is selected
          const selectedCategory = itemCategories?.find(cat => cat._id === value)
          return { 
            ...item, 
            categoryId: value,
            categoryName: selectedCategory?.name || ""
          }
        }
        if (field === "searchQuery") {
          return { ...item, searchQuery: value, categoryName: value }
        }
        if (field === "quantity" || field === "unitPrice") {
          // Recalculate amount when quantity or unit price changes
          const quantity = field === "quantity" ? parseFloat(value) || 0 : parseFloat(item.quantity || "0")
          const unitPrice = field === "unitPrice" ? parseFloat(value) || 0 : parseFloat(item.unitPrice || "0")
          return { 
            ...item, 
            [field]: value,
            amount: (quantity * unitPrice).toFixed(2)
          }
        }
        return { ...item, [field]: value }
      }
      return item
    }))
  }
  
  // Select a item category from the autocomplete
  const selectItemCategory = async (id: string, category: { _id: string, name: string }) => {
    updateReceiptItem(id, "categoryId", category._id)
    updateReceiptItem(id, "categoryName", category.name)
    setOpenFundPopoverId(null)
  }
  
  // Create a new item category if it doesn't exist
  const handleCreateItemCategory = async (id: string) => {
    if (!selectedReceiptType) {
      toast({
        title: "Error creating category",
        description: "Please select a receipt type first",
        variant: "destructive"
      })
      return
    }

    const item = receiptItems.find(item => item.id === id)
    if (!item || !item.categoryName) return
    
    try {
      const itemCategoryId = await createItemCategory({
        name: item.categoryName,
        description: `Created automatically when adding item category to receipt`,
        receiptTypeId: selectedReceiptType._id as Id<"receiptTypes">
      })
      
      if (itemCategoryId) {
        updateReceiptItem(id, "categoryId", itemCategoryId)
        setOpenFundPopoverId(null)
        
        toast({
          title: "Item category created",
          description: `Created new item category: ${item.categoryName}`,
        })
      }
    } catch (error: any) {
      toast({
        title: "Error creating item category",
        description: error.message || "Something went wrong",
        variant: "destructive"
      })
    }
  }
  
  // Handle receipt type selection
  const handleReceiptTypeChange = (receiptTypeId: string) => {
    const receiptType = receiptTypes.find(type => type._id === receiptTypeId)
    if (receiptType) {
      setSelectedReceiptType(receiptType)
      setFormData({
        ...formData,
        receiptTypeId: receiptTypeId
      })
      
      // Reset receipt items when type changes
      setReceiptItems([{ 
        id: "1", 
        categoryId: "", 
        categoryName: "", 
        amount: "",
        searchQuery: "" 
      }])
      
      // Reset template selection - we'll set it when templates load
      setSelectedTemplateId("")
    }
  }
  
  // Select default template when templates load
  useEffect(() => {
    if (receiptTemplates.length > 0 && !selectedTemplateId) {
      // Find the default template
      const defaultTemplate = receiptTemplates.find(template => template.isDefault)
      if (defaultTemplate) {
        setSelectedTemplateId(defaultTemplate._id)
      } else if (receiptTemplates[0]) {
        // Otherwise use the first template
        setSelectedTemplateId(receiptTemplates[0]._id)
      }
    }
  }, [receiptTemplates, selectedTemplateId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData({
      ...formData,
      [id]: value
    })

    // If changing the name field, update the search query
    if (id === "contributorName") {
      setSearchQuery(value)
    }
  }

  // Calculate subtotal (sum of all items)
  const calculateSubtotal = () => {
    return receiptItems
      .reduce((sum, item) => {
        const amount = Number.parseFloat(item.amount) || 0
        return sum + amount
      }, 0)
  }

  // Calculate tax amount for sales receipts if tax is enabled and not overridden
  const calculateTaxAmount = () => {
    // No tax if not a sales receipt, if tax is disabled globally, or if tax is disabled for this receipt
    if (
      selectedReceiptType?.name !== "Sales" || 
      !orgSettings?.salesTaxSettings?.enabled ||
      disableTaxForReceipt
    ) {
      return 0;
    }
    
    const subtotal = calculateSubtotal();
    const taxPercentage = orgSettings.salesTaxSettings.percentage || 0;
    
    // Round to 2 decimal places
    return Math.round(subtotal * (taxPercentage / 100) * 100) / 100;
  }
  
  // Calculate raw total (for API) including tax for sales receipts
  const calculateRawTotal = () => {
    const subtotal = calculateSubtotal();
    
    // For sales receipts with tax enabled and not overridden, add tax amount
    if (
      selectedReceiptType?.name === "Sales" && 
      orgSettings?.salesTaxSettings?.enabled &&
      !disableTaxForReceipt
    ) {
      return subtotal + calculateTaxAmount();
    }
    
    return subtotal;
  }
  
  // Format total for display with commas
  const formatTotal = () => {
    const total = calculateRawTotal()
    
    // Format with thousand separators and 2 decimal places
    return total.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate form data
      if (!formData.contributorName) {
        throw new Error("Contributor name is required")
      }
      
      // Validate receipt type
      if (!selectedReceiptType) {
        throw new Error("Receipt type is required")
      }
      
      // Validate template selection
      if (!selectedTemplateId) {
        throw new Error("Receipt template is required")
      }

      // Validate receipt items
      const invalidItems = receiptItems.filter(item => (!item.categoryId && !item.categoryName) || !item.amount)
      if (invalidItems.length > 0) {
        throw new Error("All item categories and amounts are required")
      }
      
      // Create any new item categories if needed
      for (const item of receiptItems) {
        if (item.categoryName && !item.categoryId) {
          try {
            const categoryId = await createItemCategory({
              name: item.categoryName,
              description: `Created automatically when creating receipt`,
              receiptTypeId: selectedReceiptType._id as Id<"receiptTypes">
            })
            item.categoryId = categoryId
          } catch (error: any) {
            console.error("Error creating item category:", error)
            throw new Error(`Failed to create item category: ${item.categoryName}`)
          }
        }
      }

      // Prepare data for API call
      const receiptData: any = {
        templateId: selectedTemplateId as Id<"receiptTemplates">,
        receiptTypeId: selectedReceiptType._id as Id<"receiptTypes">,
        recipientName: formData.contributorName,
        recipientEmail: formData.email || undefined,
        recipientPhone: formData.phone || undefined,
        contactId: selectedContact?._id as unknown as Id<"contacts"> || undefined,
        totalAmount: calculateRawTotal(),
        currency: currencyCode,
        date: new Date(formData.receiptDate).getTime(),
        notes: formData.notes || undefined,
        items: receiptItems.map(item => ({
          itemCategoryId: item.categoryId as unknown as Id<"itemCategories">,
          name: item.name,
          quantity: item.quantity ? parseFloat(item.quantity) : undefined,
          unitPrice: item.unitPrice ? parseFloat(item.unitPrice) : undefined,
          amount: parseFloat(item.amount),
          description: undefined
        }))
      }
      
      // Add tax information for sales receipts with tax enabled
      if (selectedReceiptType.name === "Sales" && orgSettings?.salesTaxSettings?.enabled) {
        receiptData.subtotalAmount = calculateSubtotal();
        
        // Include the tax disable flag
        receiptData.taxDisabled = disableTaxForReceipt;
        
        // If tax is disabled for this receipt, set tax amount to 0
        if (disableTaxForReceipt) {
          receiptData.taxAmount = 0;
        } else {
          receiptData.taxAmount = calculateTaxAmount();
          receiptData.taxPercentage = orgSettings.salesTaxSettings.percentage;
          receiptData.taxName = orgSettings.salesTaxSettings.name;
        }
      }

      // Call the API to create the receipt
      const result = await createReceipt(receiptData)

      toast({
        title: "Receipt created",
        description: "The receipt has been created successfully.",
      })
      
      // Navigate to the receipts list
      router.push("/dashboard/receipts")
    } catch (error: any) {
      toast({
        title: "Error creating receipt",
        description: error.message || "Something went wrong",
        variant: "destructive"
      })
      setIsLoading(false)
    }
  }

  return (
    <DashboardShell>
      <DashboardHeader heading="Create New Receipt" text="Generate a new receipt for contributions received.">
        <div className="flex gap-2">
          <Link href="/dashboard/receipts">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </Link>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => {}}>
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
        </div>
      </DashboardHeader>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Receipt Type Selection */}
              <div className="space-y-2">
                <Label htmlFor="receiptType">Receipt Type</Label>
                <Select 
                  onValueChange={handleReceiptTypeChange} 
                  value={selectedReceiptType?._id || ""}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select receipt type" />
                  </SelectTrigger>
                  <SelectContent>
                    {receiptTypes.map((type) => (
                      <SelectItem key={type._id} value={type._id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedReceiptType?.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedReceiptType.description}
                  </p>
                )}
              </div>
              
              {/* Template selection - only show when receipt type is selected */}
              {selectedReceiptType && (
                <div className="space-y-2">
                  <Label htmlFor="templateId">Receipt Template</Label>
                  <Select 
                    onValueChange={setSelectedTemplateId} 
                    value={selectedTemplateId}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select receipt template" />
                    </SelectTrigger>
                    <SelectContent>
                      {receiptTemplates.map((template) => (
                        <SelectItem key={template._id} value={template._id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contributorName">Recipient</Label>
                  <div className="relative">
                    <Popover open={isContactPopoverOpen} onOpenChange={setIsContactPopoverOpen}>
                      <PopoverTrigger asChild>
                        <div className="flex items-center">
                          <Input 
                            id="contributorName" 
                            placeholder="Search existing or enter new recipient" 
                            required 
                            value={formData.contributorName}
                            onChange={(e) => {
                              handleInputChange(e)
                              setIsContactPopoverOpen(e.target.value.length > 1)
                            }}
                            className={selectedContact ? "pl-10 pr-10" : "pr-10"}
                          />
                          {selectedContact && (
                            <div className="absolute left-3 flex items-center">
                              <User className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <div className="absolute right-3 flex items-center">
                            {selectedContact ? (
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0" 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  clearSelectedContact()
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            ) : (
                              <User className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="p-0" align="start" side="bottom" sideOffset={5}>
                        <Command>
                          <CommandInput 
                            placeholder="Search contacts..." 
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                          />
                          <CommandList>
                            <CommandEmpty>No contacts found</CommandEmpty>
                            <CommandGroup heading="Contacts">
                              {searchResults.map((contact) => (
                                <CommandItem
                                  key={contact._id}
                                  value={contact.name}
                                  onSelect={() => selectContact(contact)}
                                >
                                  <div className="flex flex-col">
                                    <span className="font-medium">{contact.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {contact.email} • {contact.contactType.name}
                                    </span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="receiptDate">Receipt Date</Label>
                  <Input 
                    id="receiptDate" 
                    type="date" 
                    required 
                    value={formData.receiptDate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input 
                  id="address" 
                  placeholder="123 Main St, City, State"
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </div>

              <Separator className="my-4" />

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">
                    {selectedReceiptType?.name === "Donation" 
                      ? "Fund Contributions" 
                      : selectedReceiptType?.name === "Sales" 
                        ? "Items" 
                        : "Services"}
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* Headers for receipt items - displayed only once */}
                  <div className="flex gap-4 px-1">
                    <div className="flex-1">
                      <Label>Category</Label>
                    </div>
                    {selectedReceiptType?.name === "Sales" && (
                      <>
                        <div className="w-24">
                          <Label>Qty</Label>
                        </div>
                        <div className="w-24">
                          <Label>Unit Price</Label>
                        </div>
                      </>
                    )}
                    <div className="w-1/3">
                      <Label>Amount ({currencySymbol})</Label>
                    </div>
                    <div className="w-10"></div> {/* Space for remove button */}
                  </div>
                  
                  {/* Receipt items */}
                  {receiptItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-4">
                      <div className="flex-1">
                        <Popover 
                          open={openFundPopoverId === item.id} 
                          onOpenChange={(open) => {
                            if (open) {
                              setOpenFundPopoverId(item.id)
                            } else {
                              setOpenFundPopoverId(null)
                              // If we have text but no category ID, try to create a new category
                              if (item.categoryName && !item.categoryId) {
                                handleCreateItemCategory(item.id)
                              }
                            }
                          }}
                        >
                          <PopoverTrigger asChild>
                            <div className="relative">
                              <Input 
                                id={`item-category-${item.id}`}
                                placeholder={`Enter ${selectedReceiptType?.name === "Donation" ? "fund" : selectedReceiptType?.name === "Sales" ? "product" : "service"} category...`}
                                value={item.categoryName}
                                disabled={!selectedReceiptType}
                                onChange={(e) => {
                                  updateReceiptItem(item.id, "searchQuery", e.target.value)
                                  updateReceiptItem(item.id, "categoryName", e.target.value)
                                  if (e.target.value.length > 1 && selectedReceiptType) {
                                    setOpenFundPopoverId(item.id)
                                  } else {
                                    setOpenFundPopoverId(null)
                                  }
                                  // Clear the category ID if the name is changed
                                  if (item.categoryId) {
                                    updateReceiptItem(item.id, "categoryId", "")
                                  }
                                }}
                              />
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className="p-0" align="start" side="bottom" sideOffset={5}>
                            <Command>
                              <CommandInput 
                                placeholder="Search categories..." 
                                value={item.searchQuery || ""}
                                onValueChange={(value) => {
                                  updateReceiptItem(item.id, "searchQuery", value)
                                }}
                              />
                              <CommandList>
                                <CommandEmpty>
                                  <div className="px-2 py-3 text-center text-sm">
                                    <p>No categories found.</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Press enter to create "{item.categoryName}"
                                    </p>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="mt-2 w-full"
                                      onClick={() => handleCreateItemCategory(item.id)}
                                    >
                                      Create "{item.categoryName}"
                                    </Button>
                                  </div>
                                </CommandEmpty>
                                <CommandGroup heading="Categories">
                                  {itemCategorySearchResults.map((category) => (
                                    <CommandItem
                                      key={category._id}
                                      value={category.name}
                                      onSelect={() => selectItemCategory(item.id, category)}
                                    >
                                      <div className="flex flex-col">
                                        <span className="font-medium">{category.name}</span>
                                        {category.description && (
                                          <span className="text-xs text-muted-foreground">
                                            {category.description}
                                          </span>
                                        )}
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Only show quantity and unit price for Sales receipts */}
                      {selectedReceiptType?.name === "Sales" && (
                        <>
                          <div className="w-24">
                            <Input
                              placeholder="Qty"
                              value={item.quantity || ""}
                              onChange={(e) => updateReceiptItem(item.id, "quantity", e.target.value)}
                              type="number"
                              min="1"
                              step="1"
                            />
                          </div>
                          <div className="w-24">
                            <Input
                              placeholder="Price"
                              value={item.unitPrice || ""}
                              onChange={(e) => updateReceiptItem(item.id, "unitPrice", e.target.value)}
                              type="number"
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </>
                      )}

                      <div className="w-1/3">
                        <Input
                          placeholder="0.00"
                          value={item.amount}
                          onChange={(e) => updateReceiptItem(item.id, "amount", e.target.value)}
                          type="number"
                          min="0"
                          step="0.01"
                          // Read-only if this is a sales receipt and quantity/unit price are used
                          readOnly={selectedReceiptType?.name === "Sales" && 
                                   !!item.quantity && 
                                   !!item.unitPrice}
                        />
                      </div>
                      <div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeReceiptItem(item.id)}
                          disabled={receiptItems.length === 1}
                          className="h-10 w-10"
                        >
                          <Trash className="h-4 w-4" />
                          <span className="sr-only">Remove item</span>
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={addReceiptItem} 
                    className="mt-2"
                    disabled={!selectedReceiptType}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Another {selectedReceiptType?.name === "Donation" 
                      ? "Fund" 
                      : selectedReceiptType?.name === "Sales" 
                        ? "Item" 
                        : "Service"}
                  </Button>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Show subtotal and tax for sales receipts with tax enabled */}
              {selectedReceiptType?.name === "Sales" && orgSettings?.salesTaxSettings?.enabled ? (
                <div className="space-y-4">
                  {/* Tax Override Checkbox */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="disable-tax"
                      checked={disableTaxForReceipt}
                      onChange={(e) => setDisableTaxForReceipt(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label 
                      htmlFor="disable-tax" 
                      className="font-medium cursor-pointer"
                    >
                      Disable {orgSettings.salesTaxSettings.name} for this receipt
                    </Label>
                  </div>
                  
                  {/* Only show tax breakdown if tax is not disabled for this receipt */}
                  {!disableTaxForReceipt ? (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="text-lg">Subtotal</div>
                        <div className="text-lg">{currencySymbol} {calculateSubtotal().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-lg">{orgSettings.salesTaxSettings.name} ({orgSettings.salesTaxSettings.percentage}%)</div>
                        <div className="text-lg">{currencySymbol} {calculateTaxAmount().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <div className="text-lg font-medium">Total Amount</div>
                        <div className="text-xl font-bold">{currencySymbol} {formatTotal()}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <div className="text-lg font-medium">Total Amount (No Tax)</div>
                      <div className="text-xl font-bold">{currencySymbol} {formatTotal()}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div className="text-lg font-medium">Total Amount</div>
                  <div className="text-xl font-bold">{currencySymbol} {formatTotal()}</div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input 
                  id="notes" 
                  placeholder="Any additional information"
                  value={formData.notes}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href="/dashboard/receipts">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Receipt"}
          </Button>
        </div>
      </form>
    </DashboardShell>
  )
}