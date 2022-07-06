import React, { useCallback, useState } from "react";
import {
  Body,
  H4,
  Landing,
  SplashLanding,
  StatsLanding,
  ShowcaseLanding,
  Button,
  Subtitle,
} from "@dvargas92495/ui";
import Layout from "../components/Layout";
import LandingUndraw from "../components/svg/LandingUndraw.svg";
import FreelancerUndraw from "../components/svg/Freelancer.svg";
import dynamic from "next/dynamic";
import TweetEmbed from "react-tweet-embed";

const ConvertKitComponent = dynamic(() => import("../components/ConvertKit"), {
  ssr: false,
});

const tweetIds = [
  "1350883724301398017",
  "1350886347318435840",
  "1350902409304784896",
  "1342872009886363649",
  "1342501199044481024",
];

const Carousel = () => {
  const [index, setIndex] = useState(
    Math.floor(Math.random() * tweetIds.length)
  );
  const [altIndex, setAltIndex] = useState(index - 1);
  const [loaded, setLoaded] = useState(true);
  const [showAlt, setShowAlt] = useState(false);
  const onTweetSuccess = useCallback(() => {
    setShowAlt(false);
    setTimeout(() => {
      setAltIndex(altIndex + 2);
      setShowAlt(true);
    }, 10000);
  }, [setAltIndex, setShowAlt, altIndex, setLoaded]);
  const onAltTweetSuccess = useCallback(() => {
    setLoaded(false);
    setTimeout(() => {
      setLoaded(true);
      setIndex(index + 2);
    }, 10000);
  }, [setIndex, setShowAlt, index]);
  return (
    <>
      <div style={{ display: loaded ? "block" : "none" }}>
        <TweetEmbed
          id={tweetIds[index % tweetIds.length]}
          options={{
            cards: "hidden",
            width: 280,
            conversation: "none",
          }}
          onTweetLoadSuccess={onTweetSuccess}
        />
      </div>
      <div style={{ display: showAlt ? "block" : "none" }}>
        <TweetEmbed
          id={tweetIds[altIndex % tweetIds.length]}
          options={{
            cards: "hidden",
            width: 280,
            conversation: "none",
          }}
          onTweetLoadSuccess={onAltTweetSuccess}
        />
      </div>
    </>
  );
};

const HomePage = (): JSX.Element => (
  <Layout>
    <Landing>
      <SplashLanding
        Logo={LandingUndraw}
        title={"Become A Roam Power User"}
        subtitle={
          "Install RoamJS plugins to your Roam DB to fully customize and empower your Roam Experience"
        }
        primaryHref={"docs"}
        secondaryHref={"services"}
      />
      <ShowcaseLanding
        header={"RoamJS adds the features you need natively to Roam"}
        showCards={[
          {
            title: "New UI Components",
            description:
              "Overlay components to help navigate your Roam database, consistent with Roam's UI.",
            image: "images/landingUI.png",
          },
          {
            title: "Third-Party Integrations",
            description:
              "Integrate the data from the rest of the services you use directly into your second brain.",
            image: "images/landingThirdParty.png",
          },
          {
            title: "Automated Workflows",
            description:
              "Add new keyboard shortcuts and menu options to speed up your most common workflows.",
            image: "images/landingAutomated.png",
          },
        ]}
      />
      <StatsLanding
        statHeader={"The Most Expansive Roam Plugin Library Available"}
        statSubheader={
          "With so many different plugins free to install, there's something that could help every type of Roam user."
        }
        stats={[
          {
            value: "49",
            label: "Extensions",
          },
          {
            value: "10,000+",
            label: "Daily Downloads",
          },
          {
            value: "850+",
            label: "Subscribers",
          },
        ]}
      />
      <div className={"flex"}>
        <div className="px-16 flex flex-col justify-content-around">
          <H4>We Offer Consulting</H4>
          <Subtitle>
            Need help using an extension? We offer paid consulting services at
            $200/hour, and just $100 for monthly sponsors. If you're interested,
            sign up for one by clicking the link below!
          </Subtitle>
          <a
            href={"https://calendly.com/dvargas92495/roamjs"}
            className={"mt-4 rounded-lg py-2 px-8 border border-sky-500"}
          >
            Sign Up
          </a>
        </div>
        <div
          className="px-15"
          style={{
            minWidth: 480,
          }}
        >
          <FreelancerUndraw width={360} height={230} />
        </div>
      </div>
      <div style={{ display: "flex" }}>
        <div style={{ padding: "0 120px" }}>
          <img src={"/images/github.png"} width={240} height={240} />
        </div>
        <div style={{ padding: "0 60px", alignSelf: "center" }}>
          <H4>
            100% <b>Open Source</b>
          </H4>
          <Body>
            Downloading scripts to your Roam database could be dangerous if from
            an anonymous source. Every extension's source code is accessible on
            GitHub so you know <b>exactly</b> what's being installed to your
            Roam database!
          </Body>
          <Button
            variant={"contained"}
            color={"primary"}
            href={"https://github.com/dvargas92495/roam-js-extensions"}
          >
            Check out the Project!
          </Button>
        </div>
      </div>
      <div style={{ display: "flex" }}>
        <div
          style={{
            padding: "0 100px",
            minWidth: 480,
            minHeight: 300,
            display: "flex",
            alignItems: "center",
          }}
        >
          <Carousel />
        </div>
        <div style={{ padding: "0 60px", alignSelf: "center" }}>
          <H4>Made For Roam Users. Supported By Roam Users.</H4>
          <Body>
            Visit our Contribute page to see how you could help keep this
            project going!
          </Body>
          <Button variant={"contained"} color={"primary"} href={"/contribute"}>
            Contribute
          </Button>
        </div>
      </div>
      <div style={{ display: "flex" }}>
        <div style={{ padding: "0 60px", alignSelf: "center" }}>
          <H4>Join us on Slack!</H4>
          <Body>
            Join the <b>#roam-js</b> channel on Roam's official slack
            organization for immediate support and sneak peaks at upcoming
            RoamJS extensions!
          </Body>
          <Button
            variant={"contained"}
            color={"secondary"}
            href={"http://roamresearch.slack.com/messages/roam-js"}
          >
            Join us
          </Button>
        </div>
        <div style={{ padding: "0 120px" }}>
          <img src={"/images/slack.png"} width={240} height={240} />
        </div>
      </div>
      <div style={{ width: "fit-content", display: "inline-block" }}>
        <H4>ROAMJS DIGEST</H4>
        <Body>
          Add your email below to stay up to date on all RoamJS features, fixes,
          and news!
        </Body>
        <ConvertKitComponent />
      </div>
    </Landing>
  </Layout>
);

export default HomePage;
