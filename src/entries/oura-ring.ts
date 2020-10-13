import format from "date-fns/format";
import { asyncType, genericError, getConfigFromPage, parseRoamDate } from "roam-client";
import { addButtonListener } from "../entry-helpers";
import axios from "axios";

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
  const formattedDate = format(dateToUse, "yyyy-MM-dd");
  axios
    .get(
      `https://api.ouraring.com/v1/sleep?start=${formattedDate}&end=${formattedDate}&access_token=${token}`
    )
    .then((r) => console.log(r.data))
    .catch(genericError);
};

addButtonListener(OURA_COMMAND, importGoogleCalendar);
