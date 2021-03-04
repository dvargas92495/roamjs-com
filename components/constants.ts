import { loadStripe } from "@stripe/stripe-js";

export const FLOSS_API_URL = process.env.NEXT_PUBLIC_FLOSS_API_URL;
export const API_URL = process.env.NEXT_PUBLIC_REST_API_URL;
export const stripe = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || ""
);
export type QueueItemResponse = {
  total: number;
  name: string;
  description: string;
  htmlUrl: string;
  label: string;
};
