import { runService } from "../components/ServiceCommonComponents";
import Dashboard from "../components/SocialDashboard";
import { addStyle } from "../entry-helpers";

addStyle(`.roamjs-datepicker {
  background: transparent;
  align-self: center;
}`);

runService({
  id: "social",
  Dashboard,
});
