"use client"

import { useEffect, useState } from "react"
import { 
  Check, 
  CreditCard, 
  CheckCircle, 
  Percent, 
  Plus, 
  Search,
  MoreHorizontal,
  Edit,
  Trash
} from "lucide-react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useToast } from "@/components/ui/use-toast"
import { useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { ReceiptTemplatePreview } from "@/components/receipt-template-preview"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function SettingsPage() {
  // We removed the unused variables from useUser()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  
  // Get tab from URL parameters
  const tabParam = searchParams.get('tab')
  const defaultTab = tabParam || "organization"
  
  // State for form handling
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState("modern")
  const [showSuccess, setShowSuccess] = useState(false)
  
  // Organization form state
  const [orgName, setOrgName] = useState("")
  const [orgEmail, setOrgEmail] = useState("")
  const [orgPhone, setOrgPhone] = useState("")
  const [orgAddress, setOrgAddress] = useState("")
  const [currencyCode, setCurrencyCode] = useState("USD")
  const [customCurrencyCode, setCustomCurrencyCode] = useState("")
  const [currencySymbol, setCurrencySymbol] = useState("$")
  
  // Receipt settings state
  const [receiptPrefix, setReceiptPrefix] = useState("REC")
  const [receiptFormat, setReceiptFormat] = useState("{PREFIX}-{YEAR}-{NUMBER}")
  const [nextReceiptNumber, setNextReceiptNumber] = useState(1)
  const [receiptDigits, setReceiptDigits] = useState(4)
  const [receiptFooter, setReceiptFooter] = useState("Thank you for your contribution!")
  
  // Sales tax settings
  const [taxEnabled, setTaxEnabled] = useState(false)
  const [taxPercentage, setTaxPercentage] = useState(10)
  const [taxName, setTaxName] = useState("Sales Tax")
  
  // Categories management state
  const [searchCategoryQuery, setSearchCategoryQuery] = useState("")
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false)
  const [isEditCategoryDialogOpen, setIsEditCategoryDialogOpen] = useState(false)
  const [isDeleteCategoryDialogOpen, setIsDeleteCategoryDialogOpen] = useState(false)
  const [selectedCategoryTab, setSelectedCategoryTab] = useState("donation")
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryDescription, setNewCategoryDescription] = useState("")
  const [newCategoryType, setNewCategoryType] = useState("donation")
  const [editingCategory, setEditingCategory] = useState<{ id: Id<"itemCategories">, name: string, description: string } | null>(null)
  const [deletingCategoryId, setDeletingCategoryId] = useState<Id<"itemCategories"> | null>(null)
  
  // Convex queries and mutations
  const userProfile = useQuery(api.auth.getUserProfile)
  const orgSettings = useQuery(api.settings.getOrganizationSettings)
  const receiptTypes = useQuery(api.receiptTypes.listReceiptTypes) || []
  
  // Find receipt type IDs for the different tabs
  const donationTypeId = receiptTypes.find((type: { name: string; _id: string }) => type.name === "Donation")?._id
  const salesTypeId = receiptTypes.find((type: { name: string; _id: string }) => type.name === "Sales")?._id
  const serviceTypeId = receiptTypes.find((type: { name: string; _id: string }) => type.name === "Service")?._id
  
  // Get the current receipt type ID based on selected category tab
  const getSelectedTypeId = () => {
    switch (selectedCategoryTab) {
      case "donation":
        return donationTypeId
      case "sales":
        return salesTypeId
      case "service":
        return serviceTypeId
      default:
        return donationTypeId
    }
  }
  
  // Get categories for the selected type
  const categories = useQuery(
    api.itemCategories.listAllItemCategories, 
    getSelectedTypeId() ? { receiptTypeId: getSelectedTypeId()! } : "skip"
  ) || []
  
  // Filter categories based on search
  const filteredCategories = categories.filter(
    category => 
      category.name.toLowerCase().includes(searchCategoryQuery.toLowerCase()) ||
      (category.description || "").toLowerCase().includes(searchCategoryQuery.toLowerCase())
  )
  
  // Sort categories: active first, then alphabetically by name
  const sortedCategories = [...filteredCategories].sort((a, b) => {
    if (a.active && !b.active) return -1
    if (!a.active && b.active) return 1
    return a.name.localeCompare(b.name)
  })
  
  // Convex mutations for updating settings
  const updateOrgProfile = useMutation(api.settings.updateOrganizationProfile)
  const updateOrgSettings = useMutation(api.settings.updateOrganizationSettings)
  const createDefaultSettings = useMutation(api.settings.createDefaultSettings)
  
  // Category mutations
  const createCategory = useMutation(api.itemCategories.createItemCategory)
  const updateCategory = useMutation(api.itemCategories.updateItemCategory)
  const deleteCategory = useMutation(api.itemCategories.deleteItemCategory)
  
  // Handle adding a new category
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Missing information",
        description: "Category name is required",
        variant: "destructive"
      })
      return
    }
    
    let selectedTypeId
    switch (newCategoryType) {
      case "donation":
        selectedTypeId = donationTypeId
        break
      case "sales":
        selectedTypeId = salesTypeId
        break
      case "service":
        selectedTypeId = serviceTypeId
        break
      default:
        selectedTypeId = donationTypeId
    }
    
    if (!selectedTypeId) {
      toast({
        title: "Error",
        description: "Receipt type not found",
        variant: "destructive"
      })
      return
    }
    
    setIsLoading(true)
    try {
      await createCategory({
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim() || undefined,
        receiptTypeId: selectedTypeId
      })
      
      toast({
        title: "Category created",
        description: "The category has been created successfully",
      })
      
      // Reset form and close dialog
      setNewCategoryName("")
      setNewCategoryDescription("")
      setIsAddCategoryDialogOpen(false)
      // Set the category tab to match the newly created category type
      setSelectedCategoryTab(newCategoryType)
    } catch (error) {
      console.error("Error creating category:", error)
      toast({
        title: "Error creating category",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Handle updating a category
  const handleUpdateCategory = async () => {
    if (!editingCategory) return
    
    if (!editingCategory.name.trim()) {
      toast({
        title: "Missing information",
        description: "Category name is required",
        variant: "destructive"
      })
      return
    }
    
    setIsLoading(true)
    try {
      await updateCategory({
        id: editingCategory.id,
        name: editingCategory.name.trim(),
        description: editingCategory.description.trim() || undefined,
      })
      
      toast({
        title: "Category updated",
        description: "The category has been updated successfully",
      })
      
      // Reset form and close dialog
      setEditingCategory(null)
      setIsEditCategoryDialogOpen(false)
    } catch (error) {
      console.error("Error updating category:", error)
      toast({
        title: "Error updating category",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Handle deleting a category
  const handleDeleteCategory = async () => {
    if (!deletingCategoryId) return
    
    setIsLoading(true)
    try {
      await deleteCategory({
        id: deletingCategoryId
      })
      
      toast({
        title: "Category deleted",
        description: "The category has been deleted successfully",
      })
      
      // Reset state and close dialog
      setDeletingCategoryId(null)
      setIsDeleteCategoryDialogOpen(false)
    } catch (error) {
      console.error("Error deleting category:", error)
      toast({
        title: "Error deleting category",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Open edit dialog for a category
  const openEditCategoryDialog = (category: { _id: Id<"itemCategories">, name: string, description?: string }) => {
    setEditingCategory({
      id: category._id,
      name: category.name,
      description: category.description || ""
    })
    setIsEditCategoryDialogOpen(true)
  }
  
  // Open delete dialog for a category
  const openDeleteCategoryDialog = (categoryId: Id<"itemCategories">) => {
    setDeletingCategoryId(categoryId)
    setIsDeleteCategoryDialogOpen(true)
  }
  
  // Format date from timestamp
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString()
  }
  
  // Load data from Convex when available
  useEffect(() => {
    if (userProfile?.organization) {
      setOrgName(userProfile.organization.name || "")
    }
    
    // Check if we have settings, if not create default ones
    if (userProfile?.organizationId && orgSettings === undefined) {
      // This means we got an error or settings don't exist
      // Let's create default settings
      createDefaultSettings().catch(error => {
        console.error("Error creating default settings:", error)
      })
    }
    
    if (orgSettings) {
      // Receipt settings
      if (orgSettings.receiptNumberingFormat) {
        setReceiptFormat(orgSettings.receiptNumberingFormat)
        
        // Try to extract prefix from format if available
        const prefixMatch = orgSettings.receiptNumberingFormat.match(/{PREFIX}/i)
        if (prefixMatch && prefixMatch.index === 0) {
          const parts = orgSettings.receiptNumberingFormat.split('-')
          if (parts.length > 0) {
            setReceiptPrefix(parts[0].replace('{PREFIX}', 'REC'))
          }
        }
      }
      
      // Email settings
      if (orgSettings.emailSettings) {
        setOrgEmail(orgSettings.emailSettings.senderEmail || "")
        setReceiptFooter(orgSettings.emailSettings.defaultMessage || "Thank you for your contribution!")
      }
      
      // Contact info
      if (orgSettings.contactInfo) {
        setOrgPhone(orgSettings.contactInfo.phone || "")
        setOrgAddress(orgSettings.contactInfo.address || "")
      }
      
      // Currency settings
      if (orgSettings.currencySettings) {
        const code = orgSettings.currencySettings.code || "USD";
        const symbol = orgSettings.currencySettings.symbol || "$";
        
        // Check if it's a standard currency
        const standardCurrencies = ["USD", "EUR", "GBP", "CAD", "AUD", "INR", "JPY", "CNY", "NZD"];
        
        if (standardCurrencies.includes(code)) {
          setCurrencyCode(code);
        } else {
          // It's a custom currency
          setCurrencyCode("CUSTOM");
          setCustomCurrencyCode(code);
        }
        
        setCurrencySymbol(symbol);
      }
      
      // Sales tax settings
      if (orgSettings.salesTaxSettings) {
        setTaxEnabled(orgSettings.salesTaxSettings.enabled || false);
        setTaxPercentage(orgSettings.salesTaxSettings.percentage || 10);
        setTaxName(orgSettings.salesTaxSettings.name || "Sales Tax");
      }
    }
  }, [userProfile, orgSettings, createDefaultSettings])
  
  // Show loading until data is ready
  const isDataLoading = !userProfile || !orgSettings
  
  // Handle saving organization information
  const handleSaveOrgInfo = async () => {
    setIsLoading(true)
    
    try {
      // Handle custom currency code
      let finalCurrencyCode = currencyCode;
      let finalCurrencySymbol = currencySymbol;
      
      // If it's a custom currency, use the custom code
      if (finalCurrencyCode === "CUSTOM") {
        if (customCurrencyCode && customCurrencyCode.trim() !== "") {
          finalCurrencyCode = customCurrencyCode.trim();
        } else {
          // If no custom code was entered, revert to USD
          finalCurrencyCode = "USD";
          finalCurrencySymbol = "$";
        }
      }
      
      // Update organization profile
      await updateOrgProfile({
        name: orgName,
        // Note: logo would be handled separately with file upload
      })
      
      // Update organization settings
      await updateOrgSettings({
        emailSettings: {
          senderName: orgName,
          senderEmail: orgEmail,
          defaultSubject: "Your Receipt",
          defaultMessage: receiptFooter,
        },
        contactInfo: {
          phone: orgPhone,
          address: orgAddress,
        },
        currencySettings: {
          code: finalCurrencyCode,
          symbol: finalCurrencySymbol,
        },
        receiptNumberingFormat: receiptFormat,
      })
      
      // Show success message
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
      
      toast({
        title: "Settings saved",
        description: "Your organization settings have been updated successfully.",
      })
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error saving settings",
        description: "There was a problem saving your settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Handle saving receipt settings
  const handleSaveReceiptSettings = async () => {
    setIsLoading(true)
    
    try {
      // Format the receipt numbering string with the prefix
      const formattedReceiptFormat = receiptFormat.replace('{PREFIX}', receiptPrefix)
      
      // Update organization settings
      await updateOrgSettings({
        receiptNumberingFormat: formattedReceiptFormat,
        salesTaxSettings: {
          enabled: taxEnabled,
          percentage: Number(taxPercentage),
          name: taxName,
        },
      })
      
      // Show success message
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
      
      toast({
        title: "Receipt settings saved",
        description: "Your receipt settings have been updated successfully.",
      })
    } catch (error) {
      console.error("Error saving receipt settings:", error)
      toast({
        title: "Error saving settings",
        description: "There was a problem saving your receipt settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Handle saving template choice
  const handleSaveTemplate = async () => {
    setIsLoading(true)
    
    try {
      // Update template settings - just a placeholder for now
      setIsLoading(false)
      
      // Show success message
      toast({
        title: "Template saved",
        description: "Your receipt template has been updated successfully.",
      })
    } catch (error) {
      console.error("Error saving template:", error)
      toast({
        title: "Error saving template",
        description: "There was a problem saving your template. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Create a new fund category - uncomment when implemented
  // const handleCreateFundCategory = async (name: string) => {
  //   try {
  //     await createFundCategory({
  //       name,
  //     })
  //     
  //     toast({
  //       title: "Fund category created",
  //       description: "The fund category has been created successfully.",
  //     })
  //   } catch (error) {
  //     console.error("Error creating fund category:", error)
  //     toast({
  //       title: "Error creating category",
  //       description: "There was a problem creating the fund category. Please try again.",
  //       variant: "destructive",
  //     })
  //   }
  // }
  
  if (isDataLoading) {
    return (
      <DashboardShell>
        <div className="flex h-[50vh] items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600"></div>
            <p className="text-sm text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </DashboardShell>
    )
  }
  
  return (
    <DashboardShell>
      <DashboardHeader heading="Settings" text="Manage your organization and receipt settings." />
      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="receipt">Receipt Settings</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>
        <TabsContent value="organization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Organization Information</CardTitle>
              <CardDescription>Update your organization&apos;s details and contact information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input 
                  id="org-name" 
                  value={orgName} 
                  onChange={(e) => setOrgName(e.target.value)}
                  disabled={isDataLoading || isLoading}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="org-email">Email</Label>
                  <Input 
                    id="org-email" 
                    type="email" 
                    value={orgEmail}
                    onChange={(e) => setOrgEmail(e.target.value)}
                    disabled={isDataLoading || isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-phone">Phone</Label>
                  <Input 
                    id="org-phone" 
                    value={orgPhone}
                    onChange={(e) => setOrgPhone(e.target.value)}
                    disabled={isDataLoading || isLoading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-address">Address</Label>
                <Textarea 
                  id="org-address" 
                  value={orgAddress}
                  onChange={(e) => setOrgAddress(e.target.value)}
                  disabled={isDataLoading || isLoading}
                />
              </div>
              <Separator className="my-4" />
              <div className="space-y-4">
                <h3 className="text-md font-medium">Currency Settings</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="currency-code">Currency</Label>
                    <select
                      id="currency-code"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={currencyCode}
                      onChange={(e) => setCurrencyCode(e.target.value)}
                      disabled={isDataLoading || isLoading}
                    >
                      <option value="USD">US Dollar (USD)</option>
                      <option value="EUR">Euro (EUR)</option>
                      <option value="GBP">British Pound (GBP)</option>
                      <option value="CAD">Canadian Dollar (CAD)</option>
                      <option value="AUD">Australian Dollar (AUD)</option>
                      <option value="INR">Indian Rupee (INR)</option>
                      <option value="JPY">Japanese Yen (JPY)</option>
                      <option value="CNY">Chinese Yuan (CNY)</option>
                      <option value="NZD">New Zealand Dollar (NZD)</option>
                      <option value="CUSTOM">Other / Custom</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency-symbol">Symbol</Label>
                    <Input 
                      id="currency-symbol" 
                      value={currencySymbol}
                      onChange={(e) => setCurrencySymbol(e.target.value)}
                      disabled={isDataLoading || isLoading || currencyCode !== "CUSTOM"}
                    />
                  </div>
                </div>
                
                {currencyCode === "CUSTOM" && (
                  <div className="space-y-2">
                    <Label htmlFor="custom-currency-code">Custom Currency Code</Label>
                    <Input 
                      id="custom-currency-code" 
                      value={customCurrencyCode}
                      onChange={(e) => setCustomCurrencyCode(e.target.value)}
                      disabled={isDataLoading || isLoading}
                      placeholder="e.g., MXN, BRL, SGD"
                    />
                    <p className="text-sm text-muted-foreground">
                      Enter a 3-letter ISO currency code for your custom currency
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex items-center gap-2 w-full justify-end">
                {showSuccess && (
                  <div className="flex items-center text-emerald-600 text-sm">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    <span>Changes saved</span>
                  </div>
                )}
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleSaveOrgInfo}
                  disabled={isLoading || isDataLoading}
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="receipt" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Receipt Configuration</CardTitle>
              <CardDescription>Customize how your receipts are generated and numbered.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="receipt-prefix">Receipt Number Prefix</Label>
                <Input 
                  id="receipt-prefix" 
                  value={receiptPrefix}
                  onChange={(e) => setReceiptPrefix(e.target.value)}
                  disabled={isDataLoading || isLoading}
                />
                <p className="text-sm text-muted-foreground">
                  This will appear before the receipt number (e.g., REC-2024-0001)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="receipt-format">Receipt Number Format</Label>
                <Input 
                  id="receipt-format" 
                  value={receiptFormat}
                  onChange={(e) => setReceiptFormat(e.target.value)}
                  disabled={isDataLoading || isLoading}
                />
                <p className="text-sm text-muted-foreground">
                  Available placeholders: {"{PREFIX}"}, {"{YEAR}"}, {"{MONTH}"}, {"{NUMBER}"}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="receipt-start">Next Receipt Number</Label>
                <Input 
                  id="receipt-start" 
                  type="number" 
                  value={nextReceiptNumber}
                  onChange={(e) => setNextReceiptNumber(parseInt(e.target.value))}
                  disabled={isDataLoading || isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="receipt-digits">Number of Digits</Label>
                <Input 
                  id="receipt-digits" 
                  type="number" 
                  value={receiptDigits}
                  onChange={(e) => setReceiptDigits(parseInt(e.target.value))}
                  disabled={isDataLoading || isLoading}
                />
                <p className="text-sm text-muted-foreground">
                  The receipt number will be padded with zeros (e.g., 0001, 0002)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="receipt-footer">Receipt Footer Text</Label>
                <Textarea 
                  id="receipt-footer" 
                  value={receiptFooter}
                  onChange={(e) => setReceiptFooter(e.target.value)}
                  disabled={isDataLoading || isLoading}
                />
              </div>
              
              <Separator className="my-4" />
              
              <div>
                <h3 className="text-md font-medium flex items-center mb-2">
                  <Percent className="h-4 w-4 mr-2 text-muted-foreground" />
                  Sales Tax Settings
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Configure sales tax for sales receipts. This will be applied to all sales receipts when enabled.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="tax-enabled"
                      checked={taxEnabled}
                      onChange={(e) => setTaxEnabled(e.target.checked)}
                      className="rounded border-gray-300"
                      disabled={isDataLoading || isLoading}
                    />
                    <Label htmlFor="tax-enabled" className="font-medium">Enable Sales Tax</Label>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tax-name">Tax Name</Label>
                    <Input 
                      id="tax-name" 
                      value={taxName}
                      onChange={(e) => setTaxName(e.target.value)}
                      disabled={!taxEnabled || isDataLoading || isLoading}
                      placeholder="e.g., Sales Tax, VAT, GST"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tax-percentage">Tax Percentage (%)</Label>
                    <Input 
                      id="tax-percentage" 
                      type="number" 
                      min="0" 
                      max="100" 
                      step="0.01"
                      value={taxPercentage}
                      onChange={(e) => setTaxPercentage(parseFloat(e.target.value))}
                      disabled={!taxEnabled || isDataLoading || isLoading}
                    />
                    <p className="text-sm text-muted-foreground">
                      This percentage will be applied to the subtotal of sales receipts.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex items-center gap-2 w-full justify-end">
                {showSuccess && (
                  <div className="flex items-center text-emerald-600 text-sm">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    <span>Changes saved</span>
                  </div>
                )}
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleSaveReceiptSettings}
                  disabled={isLoading || isDataLoading}
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Receipt Templates</CardTitle>
              <CardDescription>Choose and customize the appearance of your receipts.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div
                  className={`cursor-pointer rounded-lg border-2 p-2 transition-all hover:shadow-md ${
                    selectedTemplate === "modern" ? "border-emerald-600" : "border-transparent"
                  }`}
                  onClick={() => setSelectedTemplate("modern")}
                >
                  <div className="aspect-[3/4] rounded bg-slate-100 flex items-center justify-center mb-2">
                    <div className="w-3/4 h-3/4 bg-white rounded shadow-sm p-2 flex flex-col">
                      <div className="h-6 bg-emerald-100 rounded mb-2"></div>
                      <div className="flex-1 flex flex-col gap-1">
                        <div className="h-2 bg-slate-200 rounded w-3/4"></div>
                        <div className="h-2 bg-slate-200 rounded w-1/2"></div>
                        <div className="h-2 bg-slate-200 rounded w-2/3"></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Modern</span>
                    {selectedTemplate === "modern" && <Check className="h-4 w-4 text-emerald-600" />}
                  </div>
                </div>

                <div
                  className={`cursor-pointer rounded-lg border-2 p-2 transition-all hover:shadow-md ${
                    selectedTemplate === "classic" ? "border-emerald-600" : "border-transparent"
                  }`}
                  onClick={() => setSelectedTemplate("classic")}
                >
                  <div className="aspect-[3/4] rounded bg-slate-100 flex items-center justify-center mb-2">
                    <div className="w-3/4 h-3/4 bg-white rounded shadow-sm p-2 flex flex-col">
                      <div className="h-6 bg-slate-200 rounded mb-2 flex items-center justify-center">
                        <div className="h-4 w-1/2 bg-slate-300 rounded"></div>
                      </div>
                      <div className="flex-1 flex flex-col gap-1">
                        <div className="h-2 bg-slate-200 rounded w-3/4"></div>
                        <div className="h-2 bg-slate-200 rounded w-1/2"></div>
                        <div className="h-2 bg-slate-200 rounded w-2/3"></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Classic</span>
                    {selectedTemplate === "classic" && <Check className="h-4 w-4 text-emerald-600" />}
                  </div>
                </div>

                <div
                  className={`cursor-pointer rounded-lg border-2 p-2 transition-all hover:shadow-md ${
                    selectedTemplate === "minimal" ? "border-emerald-600" : "border-transparent"
                  }`}
                  onClick={() => setSelectedTemplate("minimal")}
                >
                  <div className="aspect-[3/4] rounded bg-slate-100 flex items-center justify-center mb-2">
                    <div className="w-3/4 h-3/4 bg-white rounded shadow-sm p-2 flex flex-col">
                      <div className="h-4 w-20 bg-slate-200 rounded mb-4 mx-auto"></div>
                      <div className="flex-1 flex flex-col gap-1">
                        <div className="h-2 bg-slate-200 rounded w-3/4"></div>
                        <div className="h-2 bg-slate-200 rounded w-1/2"></div>
                        <div className="h-2 bg-slate-200 rounded w-2/3"></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Minimal</span>
                    {selectedTemplate === "minimal" && <Check className="h-4 w-4 text-emerald-600" />}
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <Button 
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleSaveTemplate} 
                  disabled={isLoading}
                >
                  {isLoading ? "Saving..." : "Apply Template"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Template Preview</CardTitle>
              <CardDescription>Preview how your receipts will look with the selected template.</CardDescription>
            </CardHeader>
            <CardContent>
              <ReceiptTemplatePreview template={selectedTemplate} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Category Management</CardTitle>
                <CardDescription>
                  Manage categories for different types of receipts in your organization.
                </CardDescription>
              </div>
              <Dialog open={isAddCategoryDialogOpen} onOpenChange={setIsAddCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Category</DialogTitle>
                    <DialogDescription>
                      Create a new category for the selected receipt type.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="category-name">Category Name <span className="text-red-500">*</span></Label>
                      <Input
                        id="category-name"
                        placeholder="Enter category name"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category-description">Description (Optional)</Label>
                      <Textarea
                        id="category-description"
                        placeholder="Enter category description"
                        rows={3}
                        value={newCategoryDescription}
                        onChange={(e) => setNewCategoryDescription(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="receipt-type">Receipt Type</Label>
                      <Select 
                        defaultValue={newCategoryType}
                        onValueChange={(value) => setNewCategoryType(value)}
                      >
                        <SelectTrigger id="receipt-type">
                          <SelectValue placeholder="Select receipt type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="donation">Donation</SelectItem>
                          <SelectItem value="sales">Sales</SelectItem>
                          <SelectItem value="service">Service</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      variant="outline"
                      onClick={() => setIsAddCategoryDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={handleAddCategory}
                      disabled={isLoading}
                    >
                      {isLoading ? "Creating..." : "Create Category"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Tabs 
                value={selectedCategoryTab} 
                onValueChange={setSelectedCategoryTab} 
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="donation">Donation</TabsTrigger>
                  <TabsTrigger value="sales">Sales</TabsTrigger>
                  <TabsTrigger value="service">Service</TabsTrigger>
                </TabsList>
                
                <div className="flex items-center my-4">
                  <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search categories..."
                      className="pl-8"
                      value={searchCategoryQuery}
                      onChange={(e) => setSearchCategoryQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                <TabsContent value="donation">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[250px]">Category Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-[120px]">Status</TableHead>
                        <TableHead className="w-[120px]">Created</TableHead>
                        <TableHead className="w-[70px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!donationTypeId || sortedCategories.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            No categories found. Add your first category above.
                          </TableCell>
                        </TableRow>
                      ) : (
                        sortedCategories.map((category) => (
                          <TableRow key={category._id} className={!category.active ? "bg-muted/50" : ""}>
                            <TableCell className="font-medium">{category.name}</TableCell>
                            <TableCell>{category.description || "-"}</TableCell>
                            <TableCell>
                              {category.active ? (
                                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Active</Badge>
                              ) : (
                                <Badge variant="outline" className="text-gray-500">Inactive</Badge>
                              )}
                            </TableCell>
                            <TableCell>{formatDate(category.createdAt)}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => openEditCategoryDialog(category)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-red-600"
                                    onClick={() => openDeleteCategoryDialog(category._id)}
                                  >
                                    <Trash className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>
                
                <TabsContent value="sales">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[250px]">Category Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-[120px]">Status</TableHead>
                        <TableHead className="w-[120px]">Created</TableHead>
                        <TableHead className="w-[70px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!salesTypeId || sortedCategories.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            No categories found. Add your first category above.
                          </TableCell>
                        </TableRow>
                      ) : (
                        sortedCategories.map((category) => (
                          <TableRow key={category._id} className={!category.active ? "bg-muted/50" : ""}>
                            <TableCell className="font-medium">{category.name}</TableCell>
                            <TableCell>{category.description || "-"}</TableCell>
                            <TableCell>
                              {category.active ? (
                                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Active</Badge>
                              ) : (
                                <Badge variant="outline" className="text-gray-500">Inactive</Badge>
                              )}
                            </TableCell>
                            <TableCell>{formatDate(category.createdAt)}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => openEditCategoryDialog(category)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-red-600"
                                    onClick={() => openDeleteCategoryDialog(category._id)}
                                  >
                                    <Trash className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>
                
                <TabsContent value="service">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[250px]">Category Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-[120px]">Status</TableHead>
                        <TableHead className="w-[120px]">Created</TableHead>
                        <TableHead className="w-[70px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!serviceTypeId || sortedCategories.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            No categories found. Add your first category above.
                          </TableCell>
                        </TableRow>
                      ) : (
                        sortedCategories.map((category) => (
                          <TableRow key={category._id} className={!category.active ? "bg-muted/50" : ""}>
                            <TableCell className="font-medium">{category.name}</TableCell>
                            <TableCell>{category.description || "-"}</TableCell>
                            <TableCell>
                              {category.active ? (
                                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Active</Badge>
                              ) : (
                                <Badge variant="outline" className="text-gray-500">Inactive</Badge>
                              )}
                            </TableCell>
                            <TableCell>{formatDate(category.createdAt)}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => openEditCategoryDialog(category)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-red-600"
                                    onClick={() => openDeleteCategoryDialog(category._id)}
                                  >
                                    <Trash className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>
              </Tabs>
              
              <p className="text-xs text-muted-foreground mt-4">
                Categories are used to organize line items on your receipts. You can create different categories for each receipt type.
              </p>
            </CardContent>
          </Card>
          
          {/* Edit Category Dialog */}
          <Dialog open={isEditCategoryDialogOpen} onOpenChange={setIsEditCategoryDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Category</DialogTitle>
                <DialogDescription>
                  Update the category information.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-category-name">Category Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="edit-category-name"
                    placeholder="Enter category name"
                    value={editingCategory?.name || ""}
                    onChange={(e) => setEditingCategory(curr => curr ? { ...curr, name: e.target.value } : null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-category-description">Description (Optional)</Label>
                  <Textarea
                    id="edit-category-description"
                    placeholder="Enter category description"
                    value={editingCategory?.description || ""}
                    onChange={(e) => setEditingCategory(curr => curr ? { ...curr, description: e.target.value } : null)}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditCategoryDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleUpdateCategory}
                  disabled={isLoading}
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Category Dialog */}
          <Dialog open={isDeleteCategoryDialogOpen} onOpenChange={setIsDeleteCategoryDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Category</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this category? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <p className="text-sm text-muted-foreground">
                  If this category is used in any receipts, it will be marked as inactive instead of being permanently deleted.
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDeleteCategoryDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteCategory}
                  disabled={isLoading}
                >
                  {isLoading ? "Deleting..." : "Delete Category"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Plan</CardTitle>
              <CardDescription>Manage your subscription and billing information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-md border p-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-emerald-600 text-white p-3">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium">Starter Plan</h3>
                    <p className="text-sm text-muted-foreground">$0 per month</p>
                  </div>
                  <Button className="bg-emerald-600 hover:bg-emerald-700" disabled>Current Plan</Button>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm">100 receipts per month</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm">Basic receipt templates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm">Email receipts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm">CSV exports</span>
                  </div>
                </div>
              </div>

              <div className="rounded-md border p-6 bg-slate-50">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-slate-200 text-slate-700 p-3">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium">Professional Plan</h3>
                    <p className="text-sm text-muted-foreground">$29 per month</p>
                  </div>
                  <Button variant="outline">Upgrade</Button>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-slate-600" />
                    <span className="text-sm">Unlimited receipts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-slate-600" />
                    <span className="text-sm">All receipt templates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-slate-600" />
                    <span className="text-sm">Email & WhatsApp receipts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-slate-600" />
                    <span className="text-sm">CSV & PDF exports</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-slate-600" />
                    <span className="text-sm">Advanced analytics</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-slate-600" />
                    <span className="text-sm">Priority support</span>
                  </div>
                </div>
              </div>

              <div className="rounded-md border p-6 bg-slate-50">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-slate-200 text-slate-700 p-3">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium">Enterprise Plan</h3>
                    <p className="text-sm text-muted-foreground">Custom pricing</p>
                  </div>
                  <Button variant="outline">Contact Sales</Button>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-slate-600" />
                    <span className="text-sm">Everything in Professional</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-slate-600" />
                    <span className="text-sm">Custom integrations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-slate-600" />
                    <span className="text-sm">Dedicated account manager</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-slate-600" />
                    <span className="text-sm">SSO & advanced security</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-slate-600" />
                    <span className="text-sm">Custom branding</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}