import { CloudFrontRequestHandler } from "aws-lambda";

// In the future, move this to the roamjs static site generator
const LEGACY_REDIRECTS: Record<string, string> = {
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
  "/extensions/sidebar": "https://github.com/mlava/workspaces",
  "/extensions/iframely": "/extensions",
  "/extensions/image-tagging": "/extensions/workbench/image_ocr",
  "/extensions/mobile-todos":
    "https://roamresearch.com/#/app/help/page/KnvM2AMyC",
  "/extensions/mindmap": "/extensions/workbench/mindmap",
  "/extensions/postman": "/extensions/developer",
  "/extensions/serendipity":
    "/extensions/smartblocks/command_reference#Md9KfcSaH",
  "/extensions/sparql": "/extensions/developer",
  "/extensions/tally": "/extensions/workbench/tally",
  "/extensions/workbench/multi_select":
    "https://roamresearch.com/#/app/help/page/rQOT9lVIP",
  "/extensions/tag-cycle": "/extensions/workbench/tag_cycle",
  "/extensions/wysiwyg-mode": "/extensions",
  "/extensions/wiki-data": "https://github.com/mlava/wikipedia",
  "/extensions/filter-embeds": "/extensions",
  "/extensions/video": "/extensions",
  "/extensions/marketplace": "/extensions",
  "/contribute": "/extensions",
  "/subscribe": "https://roamjs.com",
  "/queue": "https://roamjs.com",
  "/projects": "https://roamjs.com",
  "/extensions/roam42/smartblocks": "/extensions/smartblocks",
  "/extensions/roam42/smartblocks:_trigger":
    "/extensions/smartblocks/trigger_your_workflow",
  "/extensions/roam42/smartblocks:_understand":
    "/extensions/smartblocks/understanding_commands",
  "/extensions/roam42/smartblocks:_using_predefined_workflows":
    "/extensions/smartblocks/using_pre-defined_workflows",
  "/extensions/roam42/smartblocks:_make_your_own_workflows":
    "/extensions/smartblocks/make_your_own_workflows",
  "/extensions/roam42/smartblocks:_command_reference_by_category":
    "/extensions/smartblocks/command_reference",
  "/extensions/roam42/smartblocks:_command_processing_order":
    "/extensions/smartblocks/command_reference",
  "/extensions/roam42/smartblocks:_alternative_methods":
    "/extensions/smartblocks/alternative_methods",
  "/extensions/roam42/smartblocks:_customization": "/extensions/smartblocks",
  "/extensions/roam42/smartblocks:_developer_docs":
    "/extensions/smartblocks/developer_docs",
  "/extensions": "/",
  "/privacy-policy": "https://samepage.network/privacy-policy",
  "/terms-of-use": "https://samepage.network/terms-of-use",
};

export const handler: CloudFrontRequestHandler = (event, _, callback) => {
  const request = event.Records[0].cf.request;
  const olduri = request.uri;
  if (olduri === "/oauth") {
    return callback(null, request);
  }
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
  const legacyUri = /^\/docs(\/extensions)?/.test(olduri)
    ? olduri.replace(/^\/docs(\/extensions)?/, "/extensions")
    : /^\/services\/social(\/)?/.test(olduri)
    ? "/extensions/twitter"
    : /^\/services(.*)$/.test(olduri)
    ? olduri.replace(/^\/services(.*)$/, "/extensions$1")
    : LEGACY_REDIRECTS[olduri] && olduri;

  const extensionPath =
    /^\/extensions\/(.*)(?:\/.*)?$/.exec(legacyUri)?.[1] || "";
  const newUri = extensionPath
    ? `https://github.com/RoamJS/${extensionPath}`
    : "https://github.com/RoamJS";
  return redirect(newUri);
};
