import { SignedIn, SignedOut } from "@clerk/clerk-react";
import {
  Grid,
  Radio,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  NumberField,
  Loading,
} from "@dvargas92495/ui";
import axios from "axios";
import { useRouter } from "next/router";
import React, { useCallback, useMemo, useState } from "react";
import { API_URL, getStripe } from "./constants";
import { useAuthenticatedAxiosPost } from "./hooks";

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

const LoggedInButton = ({
  isLoading,
  setLoading,
  value,
  isMonthly,
  source,
}: {
  isLoading: boolean;
  setLoading: (b: boolean) => void;
  value: number;
  isMonthly: boolean;
  source: string;
}) => {
  const post = useAuthenticatedAxiosPost();
  const router = useRouter();
  const onClick = useCallback(() => {
    setLoading(true);
    return post("sponsorships", {
      value,
      isMonthly,
      source,
    })
      .then((r) =>
        r.data.active
          ? router.push("/checkout?thankyou=true")
          : getStripe().then(
              (s) =>
                s &&
                s
                  .redirectToCheckout({
                    sessionId: r.data.id,
                  })
                  .then(() => true)
            )
      )
      .catch(() => {
        setLoading(false);
      });
  }, [value, isMonthly, setLoading]);
  return (
    <Button
      onClick={onClick}
      variant={"contained"}
      color={"primary"}
      disabled={value <= 0 || isLoading}
      style={{ marginLeft: 16 }}
    >
      <Loading loading={isLoading} size={16} />
      {!isLoading && "Sponsor"}
    </Button>
  );
};

const SponsorCard = ({ source }: { source: string }): React.ReactElement => {
  const [loading, setLoading] = useState(false);
  const [sponsorValue, setSponsorValue] = useState<string>("0");
  const [otherValue, setOtherValue] = useState<string>("0");
  const onRadioGroupChange = useCallback(
    (_, value) => setSponsorValue(value),
    [setSponsorValue]
  );
  const isMonthly = false;
  const onSetOtherValue = useCallback(
    (v: number) => setOtherValue(`${v}`),
    [setOtherValue]
  );
  const onOtherFocus = useCallback(
    () => setSponsorValue("other"),
    [setSponsorValue]
  );
  const value = useMemo(
    () => parseInt(sponsorValue === "other" ? otherValue : sponsorValue),
    [otherValue, sponsorValue]
  );
  const onClick = useCallback(() => {
    setLoading(true);
    return axios
      .post(`${API_URL}/sponsor-card`, {
        value,
        isMonthly,
        source,
      })
      .then((r) =>
        getStripe().then(
          (s) =>
            s &&
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
    <div>
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
        <SignedIn>
          <LoggedInButton
            value={value}
            setLoading={setLoading}
            isMonthly={isMonthly}
            source={source}
            isLoading={loading}
          />
        </SignedIn>
        <SignedOut>
          <Button
            onClick={onClick}
            variant={"contained"}
            color={"primary"}
            disabled={value <= 0}
            style={{ marginLeft: 16 }}
          >
            <Loading loading={loading} size={16} />
            {!loading && "Sponsor"}
          </Button>
        </SignedOut>
      </div>
    </div>
  );
};

export default SponsorCard;
