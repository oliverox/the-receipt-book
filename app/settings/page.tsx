"use client"

import { useEffect, useState } from "react"
import { Check, CreditCard, FileText, Pencil, Upload, Plus, Download, CheckCircle, Percent } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
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

export default function SettingsPage() {
  const { isLoaded, isSignedIn, user } = useUser()
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
  
  // Signature settings
  const [signatoryName, setSignatoryName] = useState("")
  const [signatoryTitle, setSignatoryTitle] = useState("")
  
  // Convex queries and mutations
  const userProfile = useQuery(api.auth.getUserProfile)
  const orgSettings = useQuery(api.settings.getOrganizationSettings)
  const fundCategories = useQuery(api.settings.listFundCategories)
  const templates = useQuery(api.settings.listReceiptTemplates)
  
  // Convex mutations for updating settings
  const updateOrgProfile = useMutation(api.settings.updateOrganizationProfile)
  const updateOrgSettings = useMutation(api.settings.updateOrganizationSettings)
  const createFundCategory = useMutation(api.settings.createFundCategory)
  const createDefaultSettings = useMutation(api.settings.createDefaultSettings)
  
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
  
  // Create a new fund category
  const handleCreateFundCategory = async (name: string) => {
    try {
      await createFundCategory({
        name,
      })
      
      toast({
        title: "Fund category created",
        description: "The fund category has been created successfully.",
      })
    } catch (error) {
      console.error("Error creating fund category:", error)
      toast({
        title: "Error creating category",
        description: "There was a problem creating the fund category. Please try again.",
        variant: "destructive",
      })
    }
  }
  
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
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>
        <TabsContent value="organization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Organization Information</CardTitle>
              <CardDescription>Update your organization's details and contact information.</CardDescription>
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

          <Card>
            <CardHeader>
              <CardTitle>Fund Categories</CardTitle>
              <CardDescription>Manage the fund categories that can be used in receipts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full bg-emerald-500" />
                    <span>National Fund</span>
                  </div>
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full bg-blue-500" />
                    <span>Continental Fund</span>
                  </div>
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full bg-purple-500" />
                    <span>Local Fund</span>
                  </div>
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full bg-amber-500" />
                    <span>Temple Fund</span>
                  </div>
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full bg-red-500" />
                    <span>Education Fund</span>
                  </div>
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                </div>
              </div>
              <Button variant="outline" size="sm" className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Add Fund Category
              </Button>
            </CardContent>
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
              <ReceiptTemplatePreview templateName={selectedTemplate} />
            </CardContent>
          </Card>
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