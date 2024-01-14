"use client";

import { Fragment, useState } from "react";
import { useSubscriptionModal } from "@/lib/providers/subscription-modal-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { useSupabaseUser } from "@/lib/providers/supabase-user-provider";
import { formatPrice, postData } from "@/lib/utils";
import { Button } from "../ui/button";
import Loader from "./Loader";
import { Price, ProductWithPrice } from "@/lib/supabase/supabase.types";
import { useToast } from "../ui/use-toast";
import { getStripe } from "@/lib/stripe/stripeClient";

interface ISubscriptionModalProps {
  products: ProductWithPrice[];
}

const SubscriptionModal = ({ products }: ISubscriptionModalProps) => {
  const { open, setOpen } = useSubscriptionModal();
  const { toast } = useToast();
  const { user, subscription } = useSupabaseUser();
  const [isLoading, setIsLoading] = useState(false);

  const onClickUpgrade = async (price: Price) => {
    try {
      if (!user) {
        toast({ title: "You must be logged in" });
        return;
      }
      if (subscription) {
        toast({ title: "Already on a paid plan" });
        return;
      }
      setIsLoading(true);
      const { sessionId } = await postData({
        url: "/api/create-checkout-session",
        data: { price },
      });
      console.log("Getting checkout for stripe");
      const stripe = await getStripe();
      stripe?.redirectToCheckout({ sessionId });
    } catch (error) {
      toast({ title: "Oops something went wrong.", variant: "destructive" });
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {subscription?.status === "active" ? (
        <DialogContent>Already on a paid plan!</DialogContent>
      ) : (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade to a Pro Plan</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            To access Pro feature you need to have a paid plan.
          </DialogDescription>
          {products.length
            ? products.map((product) => (
                <div
                  className="flex justify-between items-center"
                  key={product.id}
                >
                  {product.prices?.map((price) => (
                    <Fragment key={price.id}>
                      <b className="text-3xl text-muted-foreground">
                        {formatPrice(price)} / <small>{price.interval}</small>
                      </b>
                      <Button
                        disabled={isLoading}
                        onClick={() => onClickUpgrade(price)}
                      >
                        {isLoading ? <Loader /> : "Upgrade"}
                      </Button>
                    </Fragment>
                  ))}
                </div>
              ))
            : "No Product Available"}
        </DialogContent>
      )}
    </Dialog>
  );
};

export default SubscriptionModal;
