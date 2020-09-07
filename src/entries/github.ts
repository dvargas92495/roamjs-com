import { addButtonListener, asyncType, pushBullets } from "../entry-helpers";

const importGithubIssues = () => {
  fetch(
    `https://12cnhscxfe.execute-api.us-east-1.amazonaws.com/production/github-issues`
  ).then((r) => {
    if (!r.ok) {
      return r
        .text()
        .then((errorMessage) =>
          asyncType(`Error fetching issues: ${errorMessage}`)
        );
    }
    return r.json().then(async (issues) => {
      if (issues.length === 0) {
        await asyncType("No issues assigned to you!");
        return;
      }
      const bullets = issues.map((i: any) => `[${i.title}](${i.html_url})`);
      await pushBullets(bullets);
    });
  });
};

addButtonListener("Import Github Cards", () => {});
addButtonListener("Import Github Issues", importGithubIssues);
addButtonListener("Import Github Projects", () => {});
addButtonListener("Import Github Repositories", () => {});
