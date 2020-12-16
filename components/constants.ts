export const FLOSS_API_URL = process.env.NEXT_PUBLIC_FLOSS_API_URL;
export const API_URL = `https://${process.env.NEXT_PUBLIC_REST_API_ID}.execute-api.us-east-1.amazonaws.com/production`;
export const AUTH0_DOMAIN = "vargas-arts.us.auth0.com";
export const AUTH0_AUDIENCE = `https://${AUTH0_DOMAIN}/api/v2/`;
export type QueueItemResponse = {
  total: number;
  name: string;
  description: string;
  htmlUrl: string;
};
