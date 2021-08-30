import React from "react";
import StandardLayout from "../../components/StandardLayout";
import { Body, H1, H2, H6, Outlined, ThankYou } from "@dvargas92495/ui";
import SponsorCard from "../../components/SponsorCard";
import { defaultLayoutProps } from "../../components/Layout";
import { GetStaticProps } from "next";
import fs from "fs";

type Props = {
  recurring: { title: string; imgSrc: string; url: string }[];
  oneTime: { title: string; imgSrc: string; url: string }[];
};

const ContributePage = ({ recurring, oneTime }: Props): React.ReactElement => {
  return (
    <StandardLayout
      title={"Sponsor RoamJS"}
      description={"Become a RoamJS contributor and be highlighted below!"}
      img={defaultLayoutProps.img}
    >
      <H1>Sponsor</H1>
      <Body>
        Sponsorships support the development and maintenance of free to use
        extensions on RoamJS.
      </Body>
      <Outlined style={{ padding: "16px 32px" }}>
        <SponsorCard source={"RoamJS Contribute"} />
      </Outlined>
      <H2>Thank You!</H2>
      <H6>
        A huge thank you to RoamJS' recurring sponsors. Click on their link to
        see what they're up to!
      </H6>
      <ThankYou sponsors={recurring} defaultImgSrc={"sponsors/default.jpg"} />
      <H6>
        A big thank you to RoamJS' individual sponsors. Click on their link to
        see what they're up to!
      </H6>
      <ThankYou sponsors={oneTime} defaultImgSrc={"sponsors/default.jpg"} />
    </StandardLayout>
  );
};

const RECURRING = [
  "Scott Block",
  "Conor White-Sullivan",
  "Tom Kirkendall",
  "Alexander Young",
  "Keenan Payne",
  "Salem Al-Mansoori",
  "Erik Bjäreholt",
  "Kurt Harriger",
  "Rodrigo Franco",
  "Carlos Lepesqueur",
  "Abhay Prasanna",
  "Lisa-Marie Cabrelli",
  "Michael Colacino",
  "Norman Chella",
  "Rick Wilkes",
  "David Hislop",
  "Patrick Stoeckmann",
  "Zach Phillips",
  "Brent Hueth",
  "Bruno Santos",
  "Manel Punti Sarda",
  "Kathryn E. Foy",
  "Mark Lavercombe",
  "Justin Mather",
  "Michael Brockbals",
  "Jason Kleinberg",
  "Tsun Kuo Kuo",
  "Lance Tracey",
  "Francis Miller",
  "Matthew Mckinlay",
  "George Silverman",
  "Daniel McNichol",
  "Guo Miin Fang",
  "Allen Tyson"
];

const ONE_TIME = [
  "David Eaton",
  "Matt Brockwell",
  "David Mehlman",
  "Shawn Murphy",
  "Joe Ocampo",
  "Dharam Kapila",
  "Tracy Winchell",
  "Tomáš Baránek",
  "Zach Holmquist",
  "David Rangel",
  "Andrey Kumanov",
  "Chris Pavese",
  "Chris Hubbard",
  "SJ Klein",
  "Sai Satish Kandukuri",
  "Daniel D Ostlund",
  "Parham Shafti",
  "Simon Nazer",
  "Elizabeth Beese",
  "Halem Jan Kirgil",
  "Kacper Baranski",
  "Zak Weston",
  "Erick Aparicio",
  "Rodrigo Faerman",
  "David Plummer",
  "Denise Todd",
  "Nadir Samji",
  "Tobias Harmes",
  "Weston Wagner",
  "Adam Rogers",
  "Nate Stell",
  "Violeta Kristof",
  "Bala Chandrasekhar Manda",
  "Jason Phillips",
  "Dun Jack Fu",
  "Zahid A Ali",
  "Franz Wiesbauer",
  "Henry Harboe",
  "George Roukas",
  "Thomas C Eaves",
  "Constance M Yowell",
  "Essam Fakieh",
  "Margaret Appleton",
  "Jeremy Georges-Filteau",
  "Camilo Vera",
];

export const getStaticProps: GetStaticProps<Props> = () => {
  const { contributors } = JSON.parse(
    fs.readFileSync("./thankyou.json").toString()
  );
  return Promise.resolve({
    props: {
      recurring: RECURRING.map((title) => ({ ...contributors[title], title })),
      oneTime: ONE_TIME.map((title) => ({ ...contributors[title], title })),
    },
  });
};

export default ContributePage;
