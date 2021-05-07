import React from "react";
import StandardLayout from "../../components/StandardLayout";
import { Body, H1, H2, H6, Outlined, ThankYou } from "@dvargas92495/ui";
import SponsorCard from "../../components/SponsorCard";
import { defaultLayoutProps } from "../../components/Layout";

const ContributePage = (): React.ReactElement => {
  return (
    <StandardLayout
      title={"Sponsor RoamJS"}
      description={"Become a RoamJS contributor and be highlighted below!"}
      img={defaultLayoutProps.img}
    >
      <H1>Sponsor</H1>
      <Body>
        Sponsorships support the development and maintenance of free to use
        extensions on RoamJS. Monthly sponsors will receive 125% RoamJS credit
        that could be allocated towards RoamJS Queue projects.
      </Body>
      <Outlined style={{ padding: "16px 32px" }}>
        <SponsorCard source={"RoamJS Contribute"} />
      </Outlined>
      <H2>Thank You!</H2>
      <H6>
        A huge thank you to RoamJS' recurring sponsors. Click on their link to
        see what they're up to!
      </H6>
      <ThankYou
        sponsors={[
          {
            title: "Scott Block",
            imgSrc: "sponsors/scottblock.jpg",
            url: "https://twitter.com/insidetheblock",
          },
          {
            title: "Conor White-Sullivan",
            imgSrc: "sponsors/conaws.jpg",
            url: "https://twitter.com/Conaw",
          },
          {
            title: "Tom Kirkendall",
            imgSrc: "sponsors/kir.jpeg",
            url: "https://www.kir.com/",
          },
          {
            title: "Alexander Young",
            imgSrc: "sponsors/default.jpg",
            url: "",
          },
          {
            title: "Keenan Payne",
            imgSrc: "sponsors/keenan.jpg",
            url: "https://keenanpayne.com/",
          },
          {
            title: "Salem Al-Mansoori",
            imgSrc: "sponsors/salem.png",
            url: "https://twitter.com/uncomposition",
          },
          {
            title: "Erik Bjäreholt",
            imgSrc: "sponsors/bjareholt.jfif",
            url: "https://erik.bjareholt.com/",
          },
          {
            title: "Kurt Harriger",
            imgSrc: "sponsors/kurt.jfif",
            url: "https://www.linkedin.com/in/kurtharriger/",
          },
          {
            title: "Rodrigo Franco",
            imgSrc: "sponsors/franco.png",
            url: "https://www.rodrigofranco.com/",
          },
          {
            title: "Carlos Lepesqueur",
            imgSrc: "sponsors/calepes.jpg",
            url: "https://www.calepes.com/",
          },
          {
            title: "Abhay Prasanna",
            imgSrc: "sponsors/abhayprasanna.jpg",
            url: "https://twitter.com/AbhayPrasanna",
          },
          {
            title: "Lisa-Marie Cabrelli",
            imgSrc: "sponsors/lisa.jpg",
            url: "https://www.roamforresults.com/",
          },
          {
            title: "Michael Colacino",
            imgSrc: "sponsors/default.jpg",
            url: "",
          },
          {
            title: "Norman Chella",
            imgSrc: "sponsors/chella.jpg",
            url: "https://thatsthenorm.com/start/",
          },
          {
            title: 'Rick Wilkes',
            imgSrc: "sponsors/default.jpg",
            url: "",
          }
        ]}
      />
      <H6>
        A big thank you to RoamJS' individual sponsors. Click on their link to
        see what they're up to!
      </H6>
      <ThankYou
        sponsors={[
          {
            title: "David Eaton",
            imgSrc: "sponsors/davideaton.jpg",
            url: "https://twitter.com/gottalead",
          },
          {
            title: "Matt Brockwell",
            imgSrc: "sponsors/mattbrockwell.jpg",
            url: "https://twitter.com/jeanvaljean689",
          },
          {
            title: "David Mehlman",
            imgSrc: "sponsors/mehlman.jpg",
            url: "https://twitter.com/DMehlo",
          },
          {
            title: "Shawn Murphy",
            imgSrc: "sponsors/murf.jpg",
            url: "https://twitter.com/shawnpmurphy8",
          },
          {
            title: "Joe Ocampo",
            imgSrc: "sponsors/ocampo.jpg",
            url: "https://twitter.com/joe_ocampo",
          },
          {
            title: "Dharam Kapila",
            imgSrc: "sponsors/dharam.jpg",
            url: "https://twitter.com/DharamKapila",
          },
          {
            title: "Tracy Winchell",
            imgSrc: "sponsors/tracy.jpg",
            url: "https://twitter.com/tracyplaces",
          },
          {
            title: "Tomáš Baránek",
            imgSrc: "sponsors/barys.jpg",
            url: "https://barys.me",
          },
          {
            title: "Zach Holmquist",
            imgSrc: "sponsors/holmquist.jpg",
            url: "https://twitter.com/zholmquist",
          },
          {
            title: "David Rangel",
            imgSrc: "sponsors/rangel.png",
            url: "https://davidrangel.com",
          },
          {
            title: "Andrey Kumanov",
            imgSrc: "sponsors/andrey.jpg",
            url: "https://twitter.com/andreynocap",
          },
          {
            title: "Chris Pavese",
            imgSrc: "sponsors/pavese.jpg",
            url: "https://twitter.com/ChrisPavese",
          },
          {
            title: "Chris Hubbard",
            imgSrc: "sponsors/default.jpg",
            url: "",
          },
          {
            title: "SJ Klein",
            imgSrc: "sponsors/default.jpg",
            url: "https://underlay.mit.edu/",
          },
          {
            title: "Sai Satish Kandukuri",
            imgSrc: "sponsors/sai.jpg",
            url: "https://twitter.com/saisatik",
          },
          {
            title: "Daniel D Ostlund",
            imgSrc: "sponsors/dostlund.jfif",
            url: "https://twitter.com/dostlund",
          },
          {
            title: "Parham Shafti",
            imgSrc: "sponsors/parham.jfif",
            url: "https://www.forthisworld.org",
          },
          {
            title: "Kathryn E. Foy",
            imgSrc: "sponsors/katefoy.jpg",
            url: "https://about.me/Dramagirl",
          },
          {
            title: "Simon Nazer",
            imgSrc: "sponsors/nazer.jpg",
            url: "https://www.wordimagedesign.com/",
          },
          {
            title: "Elizabeth Beese",
            imgSrc: "sponsors/beese.jpg",
            url: "https://elizabethbeese.com",
          },
          {
            title: "Halem Jan Kirgil",
            imgSrc: "sponsors/halem.jpg",
            url: "https://twitter.com/tj_allemaal",
          },
          {
            title: "Kacper Baranski",
            imgSrc: "sponsors/kacper.jfif",
            url: "https://www.linkedin.com/in/kacper-baranski-69a37184/",
          },
          {
            title: "Zak Weston",
            imgSrc: "sponsors/weston.jpg",
            url: "https://twitter.com/zakweston",
          },
          {
            title: "Erick Aparicio",
            imgSrc: "sponsors/default.jpg",
            url: "https://www.linkedin.com/in/erick-aparicio-3301",
          },
          {
            title: "Rodrigo Faerman",
            imgSrc: "sponsors/faerman.jpg",
            url: "https://rodrigofaerman.com",
          },
          {
            title: "David Plummer",
            imgSrc: "sponsors/default.jpg",
            url: "",
          },
          {
            title: "Denise Todd",
            imgSrc: "sponsors/denise.jfif",
            url: "https://denisetodd.com",
          },
          {
            title: 'Nadir Samji',
            imgSrc: "sponsors/samji.png",
            url: "https://twitter.com/_nadir",
          }
        ]}
      />
    </StandardLayout>
  );
};

export default ContributePage;
