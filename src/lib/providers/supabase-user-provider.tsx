"use client";

import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { AuthUser } from "@supabase/supabase-js";
import { Subscription } from "../supabase/supabase.types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { getUserSubscriptionStatus } from "../supabase/queries";
import { useToast } from "@/components/ui/use-toast";

type ISupabaseUserContextType = {
  user: AuthUser | null;
  subscription: Subscription | null;
};

const SupabaseUserContext = createContext<ISupabaseUserContextType>({
  user: null,
  subscription: null,
});

export const useSupabaseUser = () => {
  return useContext(SupabaseUserContext);
};

interface ISupabaseUserProviderProps {
  children: ReactNode;
}

export const SupabaseUserProvider = ({
  children,
}: ISupabaseUserProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const { toast } = useToast();

  const supabase = createClientComponentClient();

  useEffect(() => {
    const getUser = async () => {
      //Fetch user details
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUser(user);

        //Subscription
        const { data: subscriptionData, error } =
          await getUserSubscriptionStatus(user.id);
        if (subscriptionData) {
          setSubscription(subscriptionData);
        }
        if (error) {
          toast({
            title: "Unexpected Error",
            description:
              "Oopsi! An unexpected error happened. Try again later.",
          });
        }
      }
    };
    getUser();
  }, [supabase, toast]);

  return (
    <SupabaseUserContext.Provider value={{ user, subscription }}>
      {children}
    </SupabaseUserContext.Provider>
  );
};
