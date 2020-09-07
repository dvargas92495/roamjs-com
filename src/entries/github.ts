import { addButtonListener } from "../entry-helpers";

const importGithubIssues = () => {
  fetch(
    `https://12cnhscxfe.execute-api.us-east-1.amazonaws.com/production/github-cards`
  );
};

addButtonListener("Import Github Cards", () => {});
addButtonListener("Import Github Issues", importGithubIssues);
addButtonListener("Import Github Projects", () => {});
addButtonListener("Import Github Repositories", () => {});
