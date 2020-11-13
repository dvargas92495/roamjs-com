import { APIGatewayProxyEvent } from "aws-lambda";
import axios from "axios";

const API_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3001/dev"
    : `https://${process.env.FLOSS_API_ID}.execute-api.us-east-1.amazonaws.com/production`;

export const handler = (event: APIGatewayProxyEvent) => {
    const { funding, due, name, email, card } = JSON.parse(event.body);
    return axios.post(`${API_URL}/stripe-setup-intent`);
}