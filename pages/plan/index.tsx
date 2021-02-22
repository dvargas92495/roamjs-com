import { SignedIn } from "@clerk/clerk-react";
import { H2, Body, ExternalLink, NumberField, Button } from "@dvargas92495/ui";
import React, { useCallback, useState } from "react";
import RedirectToLogin from "../../components/RedirectToLogin";
import StandardLayout from "../../components/StandardLayout";

const PlanPage: React.FunctionComponent = () => {
  const [sponsorship, setSponsorship] = useState(20);
  const onClick = useCallback(() => {
    console.log(`Call RoamJS with a $${sponsorship} sponsorship!`);
  }, [sponsorship]);
  return (
    <StandardLayout>
      <SignedIn>
        <H2>Welcome to RoamJS!</H2>
        <Body>
          Choose an amount to contribute to RoamJS as part of your monthly
          subscription. This is the best way to support the development of
          extensions hosted by this site.
        </Body>
        <Body>
          As a thank you for your support, you will receive 125% of your monthly
          sponsorship as RoamJS credit which you could then use to prioritize
          projects on the <ExternalLink href="/queue">Queue</ExternalLink>. You
          will also be added to the Thank You section in the{" "}
          <ExternalLink href="/contribute">Contribute</ExternalLink> page.
        </Body>
        <Body>
          You may choose to not include any sponsorship in your subscription.
          Extensions are free to download for all Roam users.
        </Body>
        <div
          style={{
            padding: "32px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
          }}
        >
          <NumberField
            value={sponsorship}
            setValue={setSponsorship}
            variant="filled"
            label="Sponsorship"
            dimension="money"
          />
          <Button variant={"contained"} color={"primary"} onClick={onClick}>
            SUBSCRIBE
          </Button>
        </div>
        <Body>
          This ${sponsorship} subscription will give you ${sponsorship * 1.25}{" "}
          in RoamJS credit each month!
        </Body>
      </SignedIn>
      <RedirectToLogin />
    </StandardLayout>
  );
};

export default PlanPage;
