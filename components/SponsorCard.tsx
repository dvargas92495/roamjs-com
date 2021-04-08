import {
  Grid,
  Radio,
  Button,
  H6,
  Switch,
  FormControl,
  FormLabel,
  RadioGroup,
  NumberField,
  Loading,
} from "@dvargas92495/ui";
import axios from "axios";
import React, { useCallback, useMemo, useState } from "react";
import { FLOSS_API_URL, stripe } from "./constants";

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

const SponsorCard = ({ source }: { source: string }): React.ReactElement => {
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
        source,
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
    <div>
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
  );
};

export default SponsorCard;
