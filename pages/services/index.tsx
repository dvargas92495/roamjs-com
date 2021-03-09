import { Body, H4, H6, Items, Tooltip } from "@dvargas92495/ui";
import React from "react";
import StandardLayout from "../../components/StandardLayout";
import { _importMeta as metadata } from "./!(index.tsx)";
import axios from "axios";
import { API_URL } from "../../components/constants";
import Link from "next/link";
import { GetStaticProps } from "next";
import { findById } from "../../components/ServicePageCommon";

type PricesProp = { prices: { name: string; price: number }[] };

const Title = React.forwardRef<
  HTMLHeadingElement,
  { title: string; href: string }
>(({ title, href, ...props }, ref) => (
  <Link href={href}>
    <H6
      style={{
        margin: 0,
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        overflow: "hidden",
      }}
      innerRef={ref}
      {...props}
    >
      {title}
    </H6>
  </Link>
));

const ServicesPage: React.FC<PricesProp> = ({ prices }) => {
  const items = metadata
    .filter(({ importedPath }) => !importedPath.endsWith("index.mdx"))
    .map(({ importedPath }) => {
      const id = /\\(.*)\.tsx$/.exec(importedPath)[1];
      const title = id
        .split("-")
        .map((s) => `${s.substring(0, 1).toUpperCase()}${s.substring(1)}`)
        .join(" ");
      const href = `/services/${id}`;
      const { price } = prices.find(findById(id)) || { price: 0 };
      return {
        primary: (
          <Tooltip title={title}>
            <span>
              <Title title={title} href={href} />
            </span>
          </Tooltip>
        ),
        avatar: (
          <>
            <span
              style={{
                display: "inline-block",
                verticalAlign: "middle",
                height: "100%",
              }}
            />
            <img
              src={`/thumbnails/${id}.png`}
              width={32}
              height={32}
              style={{ verticalAlign: "middle" }}
            />
          </>
        ),
        action: <H6 color={"primary"}>${price}</H6>,
        key: id,
      };
    });
  return (
    <StandardLayout>
      <H4 style={{ textAlign: "center" }}>All Services</H4>
      <Body>
        All RoamJS Services below are listed with their <b>per month</b>{" "}
        subscription price.
      </Body>
      <Items
        items={items}
        listClassName={"roamjs-services-list"}
        itemClassName={"roamjs-services-item"}
      />
    </StandardLayout>
  );
};

export const getStaticProps: GetStaticProps<PricesProp> = async () =>
  axios
    .get(`${API_URL}/products`)
    .then((r) => ({
      props: {
        prices: r.data.products.map((p) => ({
          name: p.name,
          price: p.prices[0].price / 100,
        })),
      },
    }))
    .catch(() => ({ props: { prices: [] } }));

export default ServicesPage;
