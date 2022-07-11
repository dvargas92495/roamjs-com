import { loadStripe, Stripe } from "@stripe/stripe-js";

export const API_URL = process.env.NEXT_PUBLIC_REST_API_URL;
export const getStripe = (): Promise<Stripe | null> =>
  loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || "");
