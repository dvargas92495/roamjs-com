import axios from "axios";
import { GetStaticProps } from "next";
import { API_URL } from "./constants";

export type ServicePageProps = {
  description: string;
  price: number;
  image: string;
};

export const findById = (id: string) => ({ name }: { name: string }): boolean =>
  name.toLowerCase() === `roamjs ${id.split("-").slice(-1)}`;

export const getStaticPropsForPage: (
  id: string
) => GetStaticProps<ServicePageProps> = (id: string) => () =>
  axios
    .get(`${API_URL}/products`)
    .then((r) => r.data.products.find(findById(id)))
    .then((p) => ({
      props: {
        description: p.description,
        price: p.prices[0].price / 100,
        image: p.image || `/thumbnails/${id}.png`,
      },
    }))
    .catch(() => ({
      props: { description: "Failed to load description", price: 0, image: "" },
    }));
