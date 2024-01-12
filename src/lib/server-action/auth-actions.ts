"use server";

import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { z } from "zod";
import { FormSchema } from "../types";
import { cookies } from "next/headers";

export const actionLoginUser = async ({
  email,
  password,
}: z.infer<typeof FormSchema>) => {
  const supabase = createRouteHandlerClient({ cookies });
  const response = await supabase.auth.signInWithPassword({ email, password });
  return response;
};

export const actionSignUpUser = async ({
  email,
  password,
}: z.infer<typeof FormSchema>) => {
  const supabase = createRouteHandlerClient({ cookies });
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", email);
  if (data?.length) return { error: { message: "User already exist", data } };
  const response = supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`,
    },
  });
  return response;
};
