import React, { useCallback, useMemo, useState } from "react";
import StandardLayout from "../../components/StandardLayout";
import {
  Body,
  H1,
  H2,
  H6,
  Outlined,
  ThankYou,
  Switch,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  Grid,
  Button,
  NumberField,
  Loading,
} from "@dvargas92495/ui";
import axios from "axios";
import { FLOSS_API_URL, stripe } from "../../components/constants";

const Amount = ({ amount }: { amount: number }) => {
  return (
    <Grid item xs={6}>
      <Radio
        icon={
          <Button
            variant={"outlined"}
            color={"primary"}
            fullWidth
            style={{ height: 56 }}
          >
            ${amount}
          </Button>
        }
        checkedIcon={
          <Button
            variant={"contained"}
            color={"primary"}
            style={{ color: "white", height: 56 }}
            fullWidth
          >
            ${amount}
          </Button>
        }
        value={`${amount}`}
        color={"primary"}
        style={{ width: "100%", borderRadius: "5%" }}
      />
    </Grid>
  );
};

const SponsorCard = () => {
  const [loading, setLoading] = useState(false);
  const [sponsorValue, setSponsorValue] = useState<string>("0");
  const [otherValue, setOtherValue] = useState<string>("0");
  const onRadioGroupChange = useCallback((_, value) => setSponsorValue(value), [
    setSponsorValue,
  ]);
  const [isMonthly, setIsMonthly] = useState(true);
  const onSwitchChange = useCallback((_, checked) => setIsMonthly(checked), [
    setIsMonthly,
  ]);
  const onSetOtherValue = useCallback((v: number) => setOtherValue(`${v}`), [
    setOtherValue,
  ]);
  const onOtherFocus = useCallback(() => setSponsorValue("other"), [
    setSponsorValue,
  ]);
  const value = useMemo(
    () => parseInt(sponsorValue === "other" ? otherValue : sponsorValue),
    [otherValue, sponsorValue]
  );
  const onClick = useCallback(() => {
    setLoading(true);
    return axios
      .post(`${FLOSS_API_URL}/stripe-session`, {
        value,
        isMonthly,
        name: "RoamJS Sponsor",
        cancelPath: "contribute",
        successPath: "checkout?thankyou=true",
      })
      .then((r) =>
        stripe.then((s) =>
          s.redirectToCheckout({
            sessionId: r.data.id,
          })
        )
      )
      .catch(() => {
        setLoading(false);
      });
  }, [value, isMonthly, setLoading]);
  return (
    <Outlined>
      <div style={{ padding: "16px 32px" }}>
        <Grid component="label" container alignItems="center" spacing={1}>
          <Grid item>
            <H6>One-Time</H6>
          </Grid>
          <Grid item>
            <Switch
              checked={isMonthly}
              onChange={onSwitchChange}
              name="isMonthly"
              color={"primary"}
            />
          </Grid>
          <Grid item>
            <H6>Monthly</H6>
          </Grid>
        </Grid>
        <FormControl component="fieldset" style={{ width: "100%" }}>
          <FormLabel component="legend">Amount</FormLabel>
          <RadioGroup
            name="sponsorValue"
            value={sponsorValue}
            onChange={onRadioGroupChange}
          >
            <Grid container alignItems="center" spacing={1}>
              <Amount amount={10} />
              <Amount amount={25} />
              <Amount amount={50} />
              <Grid item xs={6}>
                <span
                  style={{ padding: 9, display: "inline-flex", width: "100%" }}
                >
                  <NumberField
                    label={"Other"}
                    value={parseInt(otherValue)}
                    setValue={onSetOtherValue}
                    onFocus={onOtherFocus}
                    fullWidth
                    color={"primary"}
                    variant={"outlined"}
                  />
                </span>
              </Grid>
            </Grid>
          </RadioGroup>
        </FormControl>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            width: "100%",
            alignItems: "center",
          }}
        >
          <Loading loading={loading} size={16} />
          <Button
            onClick={onClick}
            variant={"contained"}
            color={"primary"}
            disabled={value <= 0}
            style={{ marginLeft: 16 }}
          >
            Sponsor
          </Button>
        </div>
      </div>
    </Outlined>
  );
};

const ContributePage = (): React.ReactElement => {
  return (
    <StandardLayout>
      <H1>Sponsor</H1>
      <Body>
        Sponsorships support the development and maintenance of free to use
        extensions on RoamJS.
      </Body>
      <SponsorCard />
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
            title: "Abhay Prasanna",
            imgSrc: "sponsors/abhayprasanna.jpg",
            url: "https://twitter.com/AbhayPrasanna",
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
            imgSrc: "sponsors/sai.jpg",
            url: "https://twitter.com/saisatik",
          },
        ]}
      />
    </StandardLayout>
  );
};

export default ContributePage;
