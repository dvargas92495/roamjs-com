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
  renderWindowAlert();
  const storage = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (storage) {
    const { alerts, nextId } = JSON.parse(storage) as {
      alerts: AlertContent[];
      nextId: number;
    };
    const validAlerts = alerts.filter((a) => {
      const timeout = differenceInMilliseconds(new Date(a.when), new Date());
      if (timeout > 0) {
        schedule({
          message: a.message,
          id: a.id,
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
        nextId,
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
