"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Eye, Plus, Trash, User, X } from "lucide-react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"

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

interface FundItem {
  id: string
  categoryId: string
  categoryName: string
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

export function NewReceiptClient() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [fundItems, setFundItems] = useState<FundItem[]>([{ 
    id: "1", 
    categoryId: "", 
    categoryName: "", 
    amount: "",
    searchQuery: ""
  }])
  const [formData, setFormData] = useState({
    contributorName: "",
    receiptDate: new Date().toISOString().split("T")[0],
    email: "",
    phone: "",
    address: "",
    notes: ""
  })
  
  // Contact search and selection
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [isContactPopoverOpen, setIsContactPopoverOpen] = useState(false)
  
  // Fund category popover state
  const [openFundPopoverId, setOpenFundPopoverId] = useState<string | null>(null)

  // Get contacts for autocomplete - only run when search query changes and is not empty
  const searchResults = useQuery(
    api.contacts.searchContacts, 
    searchQuery.length > 1 ? { search: searchQuery, limit: 5 } : "skip"
  ) || []

  // Get organization settings for currency
  const orgSettings = useQuery(api.settings.getOrganizationSettings)
  
  // Get fund categories from the database
  const fundCategories = useQuery(api.myFunctions.listFundCategories) || []
  
  // Get fund categories for autocomplete - we'll use a dynamic query based on which fund item is being edited
  const fundCategorySearchResults = useQuery(
    api.myFunctions.searchFundCategories,
    fundItems.some(item => item.searchQuery && item.searchQuery.length > 1 && item.id === openFundPopoverId)
      ? { 
          search: fundItems.find(item => item.id === openFundPopoverId)?.searchQuery || "", 
          limit: 5 
        }
      : "skip"
  ) || []
  
  // Create fund category mutation
  const createFundCategory = useMutation(api.myFunctions.createFundCategory)
  
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

  const addFundItem = () => {
    const newId = String(fundItems.length + 1)
    setFundItems([...fundItems, { id: newId, categoryId: "", categoryName: "", amount: "", searchQuery: "" }])
  }

  const removeFundItem = (id: string) => {
    if (fundItems.length > 1) {
      setFundItems(fundItems.filter((item) => item.id !== id))
    }
  }

  const updateFundItem = (id: string, field: keyof FundItem, value: string) => {
    setFundItems(fundItems.map((item) => {
      if (item.id === id) {
        if (field === "categoryId") {
          // Find the category name when the ID is selected
          const selectedCategory = fundCategories?.find(cat => cat._id === value)
          return { 
            ...item, 
            categoryId: value,
            categoryName: selectedCategory?.name || ""
          }
        }
        if (field === "searchQuery") {
          return { ...item, searchQuery: value, categoryName: value }
        }
        return { ...item, [field]: value }
      }
      return item
    }))
  }
  
  // Select a fund category from the autocomplete
  const selectFundCategory = async (id: string, category: { _id: string, name: string }) => {
    updateFundItem(id, "categoryId", category._id)
    updateFundItem(id, "categoryName", category.name)
    setOpenFundPopoverId(null)
  }
  
  // Create a new fund category if it doesn't exist
  const handleCreateFundCategory = async (id: string) => {
    const item = fundItems.find(item => item.id === id)
    if (!item || !item.categoryName) return
    
    try {
      const fundCategoryId = await createFundCategory({
        name: item.categoryName,
        description: `Created automatically when adding fund category to receipt`
      })
      
      if (fundCategoryId) {
        updateFundItem(id, "categoryId", fundCategoryId)
        setOpenFundPopoverId(null)
        
        toast({
          title: "Fund category created",
          description: `Created new fund category: ${item.categoryName}`,
        })
      }
    } catch (error: any) {
      toast({
        title: "Error creating fund category",
        description: error.message || "Something went wrong",
        variant: "destructive"
      })
    }
  }

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

  // Calculate raw total (for API)
  const calculateRawTotal = () => {
    return fundItems
      .reduce((sum, item) => {
        const amount = Number.parseFloat(item.amount) || 0
        return sum + amount
      }, 0)
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

      // Validate fund items
      const invalidItems = fundItems.filter(item => (!item.categoryId && !item.categoryName) || !item.amount)
      if (invalidItems.length > 0) {
        throw new Error("All fund categories and amounts are required")
      }
      
      // Create any new fund categories if needed
      for (const item of fundItems) {
        if (item.categoryName && !item.categoryId) {
          try {
            const categoryId = await createFundCategory({
              name: item.categoryName,
              description: `Created automatically when creating receipt`
            })
            item.categoryId = categoryId
          } catch (error: any) {
            console.error("Error creating fund category:", error)
            throw new Error(`Failed to create fund category: ${item.categoryName}`)
          }
        }
      }

      // Get a valid template ID or use a default one
      // In a real app, you would have a proper template selection UI
      let templateId: Id<"receiptTemplates"> = "defaultTemplateId" as unknown as Id<"receiptTemplates">
      
      // Prepare data for API call
      const receiptData = {
        templateId,
        recipientName: formData.contributorName,
        recipientEmail: formData.email || undefined,
        recipientPhone: formData.phone || undefined,
        contactId: selectedContact?._id as unknown as Id<"contacts"> || undefined,
        totalAmount: calculateRawTotal(),
        currency: currencyCode,
        date: new Date(formData.receiptDate).getTime(),
        notes: formData.notes || undefined,
        contributions: fundItems.map(item => ({
          fundCategoryId: item.categoryId as unknown as Id<"fundCategories">,
          amount: parseFloat(item.amount),
          description: undefined,
          categoryName: item.categoryName // Send name in case we need it for display
        }))
      }

      // Call the API to create the receipt
      // In a real implementation, this would be uncommented
      // const result = await createReceipt(receiptData)

      // For now, simulate success
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contributorName">Contributor</Label>
                  <div className="relative">
                    <Popover open={isContactPopoverOpen} onOpenChange={setIsContactPopoverOpen}>
                      <PopoverTrigger asChild>
                        <div className="flex items-center">
                          <Input 
                            id="contributorName" 
                            placeholder="Search existing or enter new contributor" 
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
                  <h3 className="text-lg font-medium">Fund Contributions</h3>
                </div>

                <div className="space-y-4">
                  {/* Headers for fund items - displayed only once */}
                  <div className="flex gap-4 px-1">
                    <div className="flex-1">
                      <Label>Fund Category</Label>
                    </div>
                    <div className="w-1/3">
                      <Label>Amount ({currencySymbol})</Label>
                    </div>
                    <div className="w-10"></div> {/* Space for remove button */}
                  </div>
                  
                  {/* Fund items */}
                  {fundItems.map((item) => (
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
                                handleCreateFundCategory(item.id)
                              }
                            }
                          }}
                        >
                          <PopoverTrigger asChild>
                            <div className="relative">
                              <Input 
                                id={`fund-category-${item.id}`}
                                placeholder="Start typing a fund category..."
                                value={item.categoryName}
                                onChange={(e) => {
                                  updateFundItem(item.id, "searchQuery", e.target.value)
                                  updateFundItem(item.id, "categoryName", e.target.value)
                                  if (e.target.value.length > 1) {
                                    setOpenFundPopoverId(item.id)
                                  } else {
                                    setOpenFundPopoverId(null)
                                  }
                                  // Clear the category ID if the name is changed
                                  if (item.categoryId) {
                                    updateFundItem(item.id, "categoryId", "")
                                  }
                                }}
                              />
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className="p-0" align="start" side="bottom" sideOffset={5}>
                            <Command>
                              <CommandInput 
                                placeholder="Search fund categories..." 
                                value={item.searchQuery || ""}
                                onValueChange={(value) => {
                                  updateFundItem(item.id, "searchQuery", value)
                                }}
                              />
                              <CommandList>
                                <CommandEmpty>
                                  <div className="px-2 py-3 text-center text-sm">
                                    <p>No fund categories found.</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Press enter to create "{item.categoryName}"
                                    </p>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="mt-2 w-full"
                                      onClick={() => handleCreateFundCategory(item.id)}
                                    >
                                      Create "{item.categoryName}"
                                    </Button>
                                  </div>
                                </CommandEmpty>
                                <CommandGroup heading="Fund Categories">
                                  {fundCategorySearchResults.map((category) => (
                                    <CommandItem
                                      key={category._id}
                                      value={category.name}
                                      onSelect={() => selectFundCategory(item.id, category)}
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
                      <div className="w-1/3">
                        <Input
                          id={`fund-amount-${item.id}`}
                          placeholder="0.00"
                          value={item.amount}
                          onChange={(e) => updateFundItem(item.id, "amount", e.target.value)}
                          type="number"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFundItem(item.id)}
                          disabled={fundItems.length === 1}
                          className="h-10 w-10"
                        >
                          <Trash className="h-4 w-4" />
                          <span className="sr-only">Remove fund item</span>
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Button type="button" variant="outline" size="sm" onClick={addFundItem} className="mt-2">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Another Fund
                  </Button>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between items-center">
                <div className="text-lg font-medium">Total Amount</div>
                <div className="text-xl font-bold">{currencySymbol}{formatTotal()}</div>
              </div>

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