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
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardHeader } from "@/components/dashboard-header";
import { ReceiptList } from "@/components/receipt-list";
import { RecentActivity } from "@/components/recent-activity";

export default function DashboardPage() {
  // Router removed as it's not currently used
  const { isLoaded, isSignedIn, user } = useUser();
  const [isInitializing, setIsInitializing] = useState(true);

  const userProfile = useQuery(api.auth.getUserProfile);
  const recentReceipts = useQuery(api.receipts.listReceipts, {
    limit: 10,
  });

  const orgSettings = useQuery(api.settings.getOrganizationSettings);
  const createDefaultSettings = useMutation(api.settings.createDefaultSettings);

  // If orgSettings is null, try to create default settings
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

  // Handle user onboarding instead of redirecting
  // (redirection is now handled by layout.tsx)
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      setIsInitializing(false);
    }
  }, [isLoaded, isSignedIn]);

  // Show loading only when initializing
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

  // Define default values to use when data is missing
  const orgCurrency = orgSettings?.currencySettings?.symbol || "$";
  const orgCurrencyCode = orgSettings?.currencySettings?.code || "USD";

  // Handle potentially missing receipt data with defaults
  const receipts = recentReceipts?.receipts || [];
  const totalReceipts = receipts.length || 0;
  const totalAmount =
    receipts.reduce((sum, receipt) => sum + receipt.totalAmount, 0) || 0;

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
              {orgCurrency} {totalAmount.toLocaleString()}
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
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none justify-center"
                >
                  <Filter className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Filter</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none justify-center"
                >
                  <CalendarDays className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Date Range</span>
                </Button>
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
          {receipts.length > 0 ? (
            <ReceiptList receipts={receipts} />
          ) : (
            <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed">
              <div className="flex flex-col items-center gap-1 text-center">
                <p className="text-sm text-muted-foreground">
                  No receipts found
                </p>
                <Link href="/receipts/new">
                  <Button variant="outline" size="sm" className="mt-2">
                    Create your first receipt
                  </Button>
                </Link>
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
