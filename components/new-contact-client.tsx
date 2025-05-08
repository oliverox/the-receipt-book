"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, X } from "lucide-react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DashboardHeader } from "@/components/dashboard-header"
import { useToast } from "@/components/ui/use-toast"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export function NewContactClient() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    contactType: "",
    notes: ""
  })

  // For contact type autocomplete
  const [contactTypesOpen, setContactTypesOpen] = useState(false)
  const [selectedContactType, setSelectedContactType] = useState<{id?: string, name: string} | null>(null)
  
  // Get contact types for autocomplete
  const contactTypes = useQuery(api.contacts.listContactTypes) || []
  
  // Create contact mutation
  const createContact = useMutation(api.contacts.createContact)
  
  // Create contact type mutation
  const createContactType = useMutation(api.contacts.createContactType)

  // Filter contact types based on input
  const filteredContactTypes = contactTypes.filter(type => 
    formData.contactType && type.name.toLowerCase().includes(formData.contactType.toLowerCase())
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData({
      ...formData,
      [id]: value
    })
    
    // If changing contact type, reset selection
    if (id === 'contactType') {
      setSelectedContactType(null)
    }
  }

  const handleContactTypeSelect = (type: {_id: string, name: string}) => {
    setSelectedContactType({
      id: type._id,
      name: type.name
    })
    setFormData({
      ...formData,
      contactType: type.name
    })
    setContactTypesOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate form data
      if (!formData.name) {
        throw new Error("Contact name is required")
      }

      if (!formData.contactType) {
        throw new Error("Contact type is required")
      }

      let contactTypeId: Id<"contactTypes">;
      
      // If we don't have a selected contact type ID, we need to create a new type or find it
      if (!selectedContactType?.id) {
        // Check if a contact type with this name already exists
        const existingType = contactTypes.find(type => 
          type.name.toLowerCase() === formData.contactType.toLowerCase()
        )
        
        if (existingType) {
          // Use existing type
          contactTypeId = existingType._id as Id<"contactTypes">
        } else {
          // Create new contact type
          const newTypeResult = await createContactType({
            name: formData.contactType,
            description: `Created automatically when adding ${formData.name}`
          })
          
          if (!newTypeResult.success || !newTypeResult.contactTypeId) {
            throw new Error("Failed to create contact type")
          }
          
          contactTypeId = newTypeResult.contactTypeId
        }
      } else {
        // Use selected type
        contactTypeId = selectedContactType.id as Id<"contactTypes">
      }

      // Create contact
      const result = await createContact({
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        contactTypeId: contactTypeId,
        notes: formData.notes || undefined
      })

      if (result.success) {
        toast({
          title: "Contact created",
          description: "The contact has been created successfully."
        })
        router.push("/contacts")
      } else {
        throw new Error("Failed to create contact")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Something went wrong";
      toast({
        title: "Error creating contact",
        description: errorMessage,
        variant: "destructive"
      })
      setIsLoading(false)
    }
  }

  return (
    <>
      <DashboardHeader heading="New Contact" text="Create a new contact entry for your organization.">
        <Link href="/contacts">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </Link>
      </DashboardHeader>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                />
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

              <div className="space-y-2">
                <Label htmlFor="contactType">Contact Type *</Label>
                <div className="relative">
                  <Popover open={contactTypesOpen} onOpenChange={setContactTypesOpen}>
                    <PopoverTrigger asChild>
                      <div className="flex items-center">
                        <Input
                          id="contactType"
                          placeholder="Individual, Institution, etc."
                          required
                          value={formData.contactType}
                          onChange={handleInputChange}
                          onFocus={() => {
                            if (formData.contactType.length > 0) {
                              setContactTypesOpen(true)
                            }
                          }}
                          className={selectedContactType ? "pr-10" : ""}
                        />
                        {selectedContactType && (
                          <div className="absolute right-3 flex items-center">
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0" 
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedContactType(null)
                                setFormData(prev => ({...prev, contactType: ""}))
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="p-0" align="start" side="bottom" sideOffset={5}>
                      <Command>
                        <CommandInput 
                          placeholder="Search contact types" 
                          value={formData.contactType}
                          onValueChange={(value) => {
                            setFormData(prev => ({...prev, contactType: value}))
                            setSelectedContactType(null)
                          }}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {formData.contactType.length > 0 ? (
                              <div className="py-3 px-4 text-sm">
                                No matches found. Press enter to create &quot;{formData.contactType}&quot;.
                              </div>
                            ) : (
                              <div className="py-3 px-4 text-sm">Type to search contact types</div>
                            )}
                          </CommandEmpty>
                          <CommandGroup heading="Contact Types">
                            {filteredContactTypes.map((type) => (
                              <CommandItem
                                key={type._id}
                                value={type.name}
                                onSelect={() => handleContactTypeSelect(type)}
                              >
                                {type.name}
                                {type.isDefault && <span className="ml-1 text-xs text-muted-foreground">(default)</span>}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter an existing type or create a new one
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional information about this contact"
                  rows={4}
                  value={formData.notes}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href="/contacts">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Contact"}
          </Button>
        </div>
      </form>
    </>
  )
}