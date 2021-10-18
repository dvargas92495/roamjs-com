import { runService } from "roamjs-components";
import Dashboard from "../components/SocialDashboard";
import { addStyle } from "../entry-helpers";

addStyle(`.roamjs-datepicker {
  background: transparent;
  align-self: center;
}

textarea:focus {
  outline: none;
  outline-offset: 0;
}

div:focus {
  outline: none;
  outline-offset: 0;
}`);

runService({
  id: "social",
  Dashboard,
});
