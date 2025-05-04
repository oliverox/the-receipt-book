import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";

/**
 * Custom hook to handle user onboarding after Clerk authentication.
 * This ensures that a new user is properly set up in Convex with a default organization.
 */
export function useOnboarding() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Convex operations
  const getOrCreateUser = useMutation(api.auth.getOrCreateUser);
  const createOrganization = useMutation(api.auth.createOrganization);
  const userProfile = useQuery(api.auth.getUserProfile);
  
  useEffect(() => {
    // Only proceed if Clerk is loaded and user is signed in
    if (!isLoaded || !isSignedIn || isProcessing || isOnboardingComplete) {
      return;
    }
    
    const onboardUser = async () => {
      try {
        setIsProcessing(true);
        
        // If we can't find the user in Convex, create them
        if (!userProfile) {
          await getOrCreateUser({
            name: user?.fullName || "New User",
            email: user?.primaryEmailAddress?.emailAddress || "",
          });
          // Return early and wait for the userProfile to load
          return;
        }
        
        // If user doesn't have an organization, create one
        if (userProfile && !userProfile.organizationId) {
          await createOrganization({
            name: user?.organizationMemberships?.[0]?.organization.name || "My Organization",
          });
          // Return early and wait for the userProfile to refresh with org info
          return;
        }
        
        setIsOnboardingComplete(true);
      } catch (error) {
        console.error("Error during onboarding:", error);
      } finally {
        setIsProcessing(false);
      }
    };
    
    onboardUser();
  }, [isLoaded, isSignedIn, user, userProfile, getOrCreateUser, createOrganization, isProcessing, isOnboardingComplete]);
  
  return {
    isOnboardingComplete,
    isProcessing,
    userProfile,
  };
}