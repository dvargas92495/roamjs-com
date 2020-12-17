import { createButtonObserver, runExtension } from "../entry-helpers";
import {
  AlertContent,
  LOCAL_STORAGE_KEY,
  render,
  renderWindowAlert,
  schedule,
} from "../components/AlertButton";
import differenceInMilliseconds from "date-fns/differenceInMilliseconds";

runExtension("alert", () => {
  window.roamjs.extension.alert = {
    open: undefined,
  };
  renderWindowAlert();
  const storage = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (storage) {
    const { alerts } = JSON.parse(storage) as {
      alerts: AlertContent[];
    };
    const validAlerts = alerts.filter((a) => {
      const timeout = differenceInMilliseconds(new Date(a.when), new Date());
      if (timeout > 0) {
        schedule({
          message: a.message,
          timeout,
          allowNotification: a.allowNotification,
        });
        return true;
      }
      return false;
    });
    localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({
        alerts: validAlerts,
      })
    );
  }
  createButtonObserver({
    shortcut: "alert",
    attribute: "alert-button",
    render,
  });
});
