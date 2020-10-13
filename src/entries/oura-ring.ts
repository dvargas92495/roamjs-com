import format from "date-fns/format";
import {
  asyncType,
  genericError,
  getConfigFromPage,
  parseRoamDate,
  pushBullets,
} from "roam-client";
import { addButtonListener } from "../entry-helpers";
import axios from "axios";
import subDays from "date-fns/subDays";

const OURA_COMMAND = "Import Oura Ring";

const importGoogleCalendar = async (
  _: any,
  blockUid: string,
  parentUid: string
) => {
  const config = getConfigFromPage("roam/js/oura-ring");
  const pageTitle = document.getElementsByClassName(
    "rm-title-display"
  )[0] as HTMLHeadingElement;
  const dateFromPage = parseRoamDate(pageTitle.innerText);
  const token = config["Token"]?.trim();
  if (!token) {
    await asyncType(
      `Error: Could not find the required "Token" attribute configured in the [[roam/js/oura-ring]] page.`
    );
    return;
  }
  const dateToUse = isNaN(dateFromPage.valueOf()) ? new Date() : dateFromPage;
  const formattedDate = format(subDays(dateToUse, 1), "yyyy-MM-dd");
  axios
    .get(
      `https://api.ouraring.com/v1/sleep?start=${formattedDate}&end=${formattedDate}&access_token=${token}`
    )
    .then(async (r) => {
      const sleep = r.data.sleep[0];
      if (!sleep) {
        await asyncType(
          `There is no sleep data available for ${formattedDate}`
        );
        return;
      }
      const { bedtime_start, bedtime_end } = sleep;
      const formattedStart = format(new Date(bedtime_start), "hh:mm");
      const formattedEnd = format(new Date(bedtime_end), "hh:mm");
      const bullets = [
          `Bedtime Start:: ${formattedStart}`,
          `Bedtime End:: ${formattedEnd}`,
      ];
      await pushBullets(bullets);
    })
    .catch(genericError);
};

addButtonListener(OURA_COMMAND, importGoogleCalendar);
