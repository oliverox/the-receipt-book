"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  CalendarDays,
  Download,
  FileText,
  Filter,
  Plus,
  Search,
  CreditCard,
  Users,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardHeader } from "@/components/dashboard-header";
import { ReceiptList } from "@/components/receipt-list";
import { RecentActivity } from "@/components/recent-activity";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Receipt } from "@/lib/definitions";

// Helper function to format dates in "dd MMM YYYY" format
function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

// Helper to format a Date object to a YYYY-MM-DD string for input fields
function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

export default function DashboardPage() {
  // Core states
  const { isLoaded, isSignedIn, user } = useUser();
  const [isInitializing, setIsInitializing] = useState(true);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Data fetching
  const userProfile = useQuery(api.auth.getUserProfile);
  const recentReceipts = useQuery(api.receipts.listReceipts, {
    limit: 50, // Increased limit to allow for filtering
  });
  const orgSettings = useQuery(api.settings.getOrganizationSettings);
  const createDefaultSettings = useMutation(api.settings.createDefaultSettings);

  // Initialize settings if needed
  useEffect(() => {
    const initializeSettings = async () => {
      if (userProfile?.organizationId && orgSettings === null) {
        try {
          await createDefaultSettings();
          console.log("Created default settings");
        } catch (error) {
          console.error("Error creating default settings:", error);
        }
      }
    };

    initializeSettings();
  }, [userProfile, orgSettings, createDefaultSettings]);

  // Handle initialization state
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      setIsInitializing(false);
    }
  }, [isLoaded, isSignedIn]);

  // Show loading state when initializing
  if (isInitializing) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600"></div>
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Get default values from org settings
  const orgCurrency = orgSettings?.currencySettings?.symbol || "$";
  const orgCurrencyCode = orgSettings?.currencySettings?.code || "USD";

  // Handle receipt data with defaults
  const allReceipts = recentReceipts?.receipts || [];
  const totalReceipts = allReceipts.length || 0;
  const totalAmount = allReceipts.reduce(
    (sum, receipt) => sum + (receipt.totalAmount || 0),
    0,
  );

  // Filter function for receipts
  const filterReceipts = (receipts: Receipt[]) => {
    return receipts.filter((receipt) => {
      // Search filter
      let matchesSearch = true;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const receiptId = (receipt.receiptId || "").toLowerCase();
        const recipientName = (receipt.recipientName || "").toLowerCase();
        const notes = (receipt.notes || "").toLowerCase();

        matchesSearch =
          receiptId.includes(query) ||
          recipientName.includes(query) ||
          notes.includes(query);
      }

      // Date filter
      let matchesDate = true;
      if (startDate || endDate) {
        const receiptDate = new Date(receipt.date);
        if (startDate && !isNaN(receiptDate.getTime())) {
          matchesDate = matchesDate && new Date(startDate) <= receiptDate;
        }
        if (endDate && !isNaN(receiptDate.getTime())) {
          matchesDate = matchesDate && new Date(endDate) >= receiptDate;
        }
      }

      // Status filter
      const matchesStatus = !statusFilter || receipt.status === statusFilter;

      return matchesSearch && matchesDate && matchesStatus;
    });
  };

  // Apply filters
  const filteredReceipts = filterReceipts(allReceipts);

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery("");
    setStatusFilter(null);
    setStartDate("");
    setEndDate("");
    setShowDateFilter(false);
  };

  return (
    <>
      <DashboardHeader
        heading={`Welcome, ${user?.firstName || userProfile?.name?.split(" ")[0] || "User"}`}
        text="Manage your receipts and organization activities."
      >
        <Link href="/receipts/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="mr-2 h-4 w-4" />
            New Receipt
          </Button>
        </Link>
      </DashboardHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Receipts
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReceipts}</div>
            <p className="text-xs text-muted-foreground">Total receipts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orgCurrency} {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Total contributions ({orgCurrencyCode})
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organization</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">
              {userProfile?.organization?.name || "Your Organization"}
            </div>
            <p className="text-xs text-muted-foreground">
              {userProfile?.organization?.subscriptionTier || "Starter"} plan
            </p>
          </CardContent>
        </Card>
      </div>
      <Tabs defaultValue="recent" className="space-y-4 mt-4">
        <TabsList className="w-full">
          <TabsTrigger value="recent" className="flex-1">
            Recent Receipts
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex-1">
            Recent Activity
          </TabsTrigger>
        </TabsList>
        <TabsContent value="recent" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 sm:items-center sm:justify-between">
            <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search receipts..."
                  className="pl-8 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-9 w-9 p-0"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Clear search</span>
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={statusFilter ? "secondary" : "outline"}
                      size="sm"
                      className="flex-1 sm:flex-none justify-center"
                    >
                      <Filter className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Status</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-60 p-3">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Filter by Status</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className={
                              statusFilter === "draft" ? "border-amber-500" : ""
                            }
                            onClick={() => setStatusFilter("draft")}
                          >
                            <div className="h-2 w-2 rounded-full bg-amber-500 mr-2" />
                            Drafts
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className={
                              statusFilter === "sent"
                                ? "border-emerald-500"
                                : ""
                            }
                            onClick={() => setStatusFilter("sent")}
                          >
                            <div className="h-2 w-2 rounded-full bg-emerald-500 mr-2" />
                            Sent
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className={
                              statusFilter === "viewed" ? "border-blue-500" : ""
                            }
                            onClick={() => setStatusFilter("viewed")}
                          >
                            <div className="h-2 w-2 rounded-full bg-blue-500 mr-2" />
                            Viewed
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className={
                              statusFilter === "paid" ? "border-green-600" : ""
                            }
                            onClick={() => setStatusFilter("paid")}
                          >
                            <div className="h-2 w-2 rounded-full bg-green-600 mr-2" />
                            Paid
                          </Button>
                        </div>
                      </div>

                      {statusFilter && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => setStatusFilter(null)}
                        >
                          Show All Statuses
                        </Button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
                <Popover open={showDateFilter} onOpenChange={setShowDateFilter}>
                  <PopoverTrigger asChild>
                    <Button
                      variant={startDate || endDate ? "secondary" : "outline"}
                      size="sm"
                      className="flex-1 sm:flex-none justify-center"
                    >
                      <CalendarDays className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Date</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-3" align="start">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Custom Date Range</h4>
                        <div className="grid gap-2">
                          <div className="grid grid-cols-3 items-center gap-2">
                            <label
                              htmlFor="start-date"
                              className="text-sm font-medium"
                            >
                              From
                            </label>
                            <Input
                              id="start-date"
                              type="date"
                              className="col-span-2"
                              value={startDate}
                              onChange={(e) => setStartDate(e.target.value)}
                            />
                          </div>
                          <div className="grid grid-cols-3 items-center gap-2">
                            <label
                              htmlFor="end-date"
                              className="text-sm font-medium"
                            >
                              To
                            </label>
                            <Input
                              id="end-date"
                              type="date"
                              className="col-span-2"
                              value={endDate}
                              onChange={(e) => setEndDate(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Quick date selectors */}
                      <div className="border-t pt-3">
                        <div className="grid gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const today = new Date();
                              setStartDate(formatDateForInput(today));
                              setEndDate(formatDateForInput(today));
                            }}
                          >
                            Today
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const today = new Date();
                              const thisWeekStart = new Date(today);
                              // Set to Monday of current week
                              thisWeekStart.setDate(
                                today.getDate() -
                                  today.getDay() +
                                  (today.getDay() === 0 ? -6 : 1),
                              );

                              setStartDate(formatDateForInput(thisWeekStart));
                              setEndDate(formatDateForInput(today));
                            }}
                          >
                            This Week
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const today = new Date();
                              const thisMonthStart = new Date(
                                today.getFullYear(),
                                today.getMonth(),
                                1,
                              );

                              setStartDate(formatDateForInput(thisMonthStart));
                              setEndDate(formatDateForInput(today));
                            }}
                          >
                            This Month
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const today = new Date();
                              const thisYearStart = new Date(
                                today.getFullYear(),
                                0,
                                1,
                              );

                              setStartDate(formatDateForInput(thisYearStart));
                              setEndDate(formatDateForInput(today));
                            }}
                          >
                            This Year
                          </Button>
                        </div>
                      </div>

                      {(startDate || endDate) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            setStartDate("");
                            setEndDate("");
                            setShowDateFilter(false);
                          }}
                        >
                          Clear Dates
                        </Button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto mt-2 sm:mt-0 justify-center"
            >
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>

          {/* Show applied filters */}
          {(searchQuery || statusFilter || startDate || endDate) && (
            <div className="flex flex-wrap gap-2 mb-2">
              <div className="text-sm text-muted-foreground mr-1">Filters:</div>
              {searchQuery && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Search: {searchQuery}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Remove filter</span>
                  </Button>
                </Badge>
              )}
              {statusFilter && (
                <Badge
                  variant="outline"
                  className="flex items-center gap-1 capitalize"
                >
                  Status: {statusFilter}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1"
                    onClick={() => setStatusFilter(null)}
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Remove filter</span>
                  </Button>
                </Badge>
              )}
              {(startDate || endDate) && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Date: {startDate ? formatDateDisplay(startDate) : "Any"} to {endDate ? formatDateDisplay(endDate) : "Any"}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1"
                    onClick={() => {
                      setStartDate("");
                      setEndDate("");
                    }}
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Remove filter</span>
                  </Button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-6"
                onClick={clearAllFilters}
              >
                Clear all filters
              </Button>
            </div>
          )}

          {filteredReceipts.length > 0 ? (
            <ReceiptList receipts={filteredReceipts} />
          ) : (
            <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed">
              <div className="flex flex-col items-center gap-1 text-center">
                <p className="text-sm text-muted-foreground">
                  {allReceipts.length > 0
                    ? "No receipts match your search criteria"
                    : "No receipts found"}
                </p>
                {allReceipts.length > 0 ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={clearAllFilters}
                  >
                    Clear filters
                  </Button>
                ) : (
                  <Link href="/receipts/new">
                    <Button variant="outline" size="sm" className="mt-2">
                      Create your first receipt
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </TabsContent>
        <TabsContent value="activity" className="space-y-4">
          <RecentActivity />
        </TabsContent>
      </Tabs>
    </>
  );
}