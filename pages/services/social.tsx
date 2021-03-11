import { Body } from "@dvargas92495/ui";
import React from "react";
import ServiceLayout from "../../components/ServiceLayout";
import {
  getStaticPropsForPage,
  ServicePageProps,
} from "../../components/ServicePageCommon";

const SocialPage: React.FC<ServicePageProps> = (props) => {
  return (
    <ServiceLayout development {...props}>
      <Body>
        RoamJS already supports various extensions to post to sites like Twitter
        directly from Roam. But each of these posts are immediate. It's often
        useful to create a bunch of content in one sitting, and schedule them to
        be sent at a later date! This allows the inconsistent cadence of your
        creativity to align with a consistent cadence of publishing. This RoamJS
        Service works with other RoamJS extensions to allow you to schedule
        publishable content. You can draft, schedule, and view pending requests
        all from within Roam!
      </Body>
      {/*
      <H4>Setup</H4>
      <Body>
        **In your Roam database, create
        a `[[roam/js/social]]` page and a block that says `Token`. As a child of
        that block, paste in your RoamJS token: ![](/images/social-config.png)
      </Body>
      <H4>Usage</H4>
      <Body>
        Now that we're all set up, using RoamJS Social will vary based on the
        extension we are using.
      </Body>
      <H5>Twitter</H5>
      <Body>
        First, be sure to install the [twitter](/docs/extensions/twitter)
        extension to your Roam Graph and set it up to **send tweets.** Now when
        you draft a Tweet and click the Twitter icon, you should see a new
        button that says `Schedule Tweet`. ![](/images/schedule-tweet.png)
        Clicking the button will bring you to a datepicker where you could
        decide when the tweet should be published.
        ![](/images/schedule-tweet-submit.png) Hitting "Schedule" will queue the
        tweet to be executed. When you log into your Twitter account after
        specified time, you should see the Roam block on your Twitter feed! You
        can view all of the tweets you've scheduled by typing{" "}
        {"`{{twitter dashboard}}`"} into a block in any page in your database.
      </Body>
      */}
    </ServiceLayout>
  );
};

export const getStaticProps = getStaticPropsForPage("social");

export default SocialPage;
