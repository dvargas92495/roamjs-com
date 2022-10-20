import { CloudFrontRequestHandler } from "aws-lambda";

// In the future, move this to the roamjs static site generator
const REDIRECTS: Record<string, string> = {
  "/extensions/query-tools": "/extensions/query-builder",
  "/extensions/roam42": "/extensions/workbench",
  "/extensions/roam42/workbench": "/extensions/workbench/command_palette_plus",
  "/extensions/roam42/live_preview": "/extensions/workbench/live_preview",
  "/extensions/roam42/daily_note_popup":
    "/extensions/workbench/daily_note_popup",
  "/extensions/roam42/jump_navigation": "/extensions/workbench/hot_keys",
  "/extensions/roam42/deep_nav": "/extensions/workbench/deep_nav",
  "/extensions/roam42/privacy_mode": "/extensions/workbench/privacy_mode",
  "/extensions/roam42/dictionary": "/extensions/workbench/dictionary",
  "/extensions/roam42/strikeout-text-shortcut": "/extensions/workbench",
  "/extensions/roam42/update_log": "/extensions/workbench",
  "/extensions/roam42/date_nlp": "/extensions/workbench/daily_note_popup",
  "/extensions/charts": "/extensions/query-builder",
  "/extensions/timeline": "/extensions/query-builder",
  "/extensions/attr-tables": "/extensions/query-builder",
  "/extensions/google-calendar": "/extensions/google",
  "/extensions/google-drive": "/extensions/google",
  "/extensions/github": "/extensions/developer",
  "/extensions/repl": "/extensions/developer",
  "/extensions/alert": "/extensions/workbench/alert",
  "/extensions/mouseless": "/extensions/workbench/hot_keys",
  "/extensions/multi-select":
    "https://roamresearch.com/#/app/help/page/rQOT9lVIP",
  "/extensions/pull-references": "/extensions/workbench/command_palette_plus",
  "/extensions/calculate": "/extensions/query-builder",
  "/extensions/article": "/extensions/workbench/article",
  "/extensions/sort-references": "/extensions/query-builder",
  "/extensions/emojis": "/extensions/workbench",
  "/extensions/todont": "/extensions/todo-trigger",
  "/extensions/weekly-notes": "/extensions/workbench/weekly-notes",
};

export const handler: CloudFrontRequestHandler = (event, _, callback) => {
  const request = event.Records[0].cf.request;
  const olduri = request.uri;
  const redirect = (newUri: string) => {
    const response = {
      status: "301",
      statusDescription: "Moved Permanently",
      headers: {
        location: [
          {
            key: "Location",
            value: newUri.startsWith("https")
              ? newUri
              : `https://roamjs.com${newUri}`,
          },
        ],
      },
    };
    return callback(null, response);
  };
  if (/^\/docs(\/extensions)?/.test(olduri)) {
    const newUri = olduri.replace(/^\/docs(\/extensions)?/, "/extensions");
    return redirect(newUri);
  } else if (/^\/services\/social(\/)?/.test(olduri)) {
    const newUri = "/extensions/twitter";
    return redirect(newUri);
  } else if (/^\/services(.*)$/.test(olduri)) {
    const newUri = olduri.replace(/^\/services(.*)$/, "/extensions$1");
    return redirect(newUri);
  } else if (REDIRECTS[olduri]) {
    return redirect(REDIRECTS[olduri]);
  }
  return callback(null, request);
};
