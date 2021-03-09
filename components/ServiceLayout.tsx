import { Body, Breadcrumbs, Button, H1, H4, Subtitle } from "@dvargas92495/ui";
import React, { useCallback, useState } from "react";
import StandardLayout from "./StandardLayout";
import { ServicePageProps } from "./ServicePageCommon";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import marked from "roam-marked";

const ServiceLayout: React.FunctionComponent<
  {
    development?: boolean;
    overview: string;
  } & ServicePageProps
> = ({ children, development, description, price, image, overview, id }) => {
  const title = id.replace(/-/g, " ");
  const [started, setStarted] = useState(false);
  const start = useCallback(() => setStarted(true), [setStarted]);
  return (
    <StandardLayout>
      <Breadcrumbs
        page={`${title.toUpperCase()}${
          development ? " (UNDER DEVELOPMENT)" : ""
        }`}
        links={[
          {
            text: "SERVICES",
            href: "/services",
          },
        ]}
      />
      {started ? (
        <SignedIn>
          <div style={{ marginTop: 32 }}>{children}</div>
        </SignedIn>
      ) : (
        <>
          <div style={{ display: "flex" }}>
            <div style={{ width: "50%" }}>
              <H1>
                {title
                  .split(" ")
                  .map(
                    (s) => `${s.substring(0, 1).toUpperCase()}${s.substring(1)}`
                  )
                  .join(" ")}
              </H1>
              <Subtitle>{description}</Subtitle>
              <div style={{ marginBottom: 16 }} />
              <b>${price}/month</b>
              <div>
                <SignedIn>
                  <Button
                    color={"primary"}
                    variant={"contained"}
                    onClick={start}
                  >
                    Start Now
                  </Button>
                </SignedIn>
                <SignedOut>
                  <Button
                    color={"primary"}
                    variant={"contained"}
                    href={"/login"}
                  >
                    Start Now
                  </Button>
                </SignedOut>
              </div>
            </div>
            <div style={{ width: "50%", padding: "0 32px" }}>
              <span
                style={{
                  display: "inline-block",
                  verticalAlign: "middle",
                  height: "100%",
                }}
              />
              <img
                src={image}
                style={{
                  verticalAlign: "middle",
                  width: "100%",
                  boxShadow: "0px 3px 14px #00000040",
                  borderRadius: 8,
                }}
              />
            </div>
          </div>
          <hr style={{ margin: "32px 0" }} />
          <H4>Overview</H4>
          <Body>
            <div dangerouslySetInnerHTML={{ __html: marked(overview) }} />
          </Body>
        </>
      )}
    </StandardLayout>
  );
};

export default ServiceLayout;
