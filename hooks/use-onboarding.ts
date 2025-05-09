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
          // Ensure we have required user data before making the API call
          const userName = user?.fullName;
          const userEmail = user?.primaryEmailAddress?.emailAddress;

          if (!userName || !userEmail) {
            console.warn("Missing user data for onboarding:", { userName, userEmail });
            // Wait for user data to be available
            return;
          }

          await getOrCreateUser({
            name: userName,
            email: userEmail,
          });
          // Return early and wait for the userProfile to load
          return;
        }
        
        // If user doesn't have an organization, create one
        if (userProfile && !userProfile.organizationId) {
          try {
            // First attempt to get org name from Clerk
            let orgName = "My Organization";

            if (user?.organizationMemberships &&
                user.organizationMemberships.length > 0 &&
                user.organizationMemberships[0]?.organization?.name) {
              orgName = user.organizationMemberships[0].organization.name;
            }

            await createOrganization({
              name: orgName,
            });
            // Return early and wait for the userProfile to refresh with org info
            return;
          } catch (orgError) {
            console.error("Error creating organization:", orgError);
            // Continue with onboarding even if organization creation fails
            // The user can create an organization later
          }
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