import { runService } from "../components/ServiceCommonComponents";
import Dashboard from "../components/DeveloperDashboard";
import { addStyle } from "roam-client";

addStyle(`.roamjs-developer-path:hover {
  background-color: #dddddd;
}`)

runService({
  id: "developer",
  Dashboard,
});
