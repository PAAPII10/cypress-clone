import { SubscriptionModalProvider } from "@/lib/providers/subscription-modal-provider";
import { getActiveProductWithPrice } from "@/lib/supabase/queries";
import { ReactNode } from "react";

interface ILayout {
  children: ReactNode;
  params: any;
}

const layout = async ({ children, params }: ILayout) => {
  const { data: products, error } = await getActiveProductWithPrice();
  if (error) throw new Error();

  return (
    <main className="flex over-hidden h-screen">
      <SubscriptionModalProvider products={products}>
        {children}
      </SubscriptionModalProvider>
    </main>
  );
};

export default layout;
