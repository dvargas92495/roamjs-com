import { renderMouselessModal } from "../components/MouselessModal";

const container = document.createElement("div");
container.id = "roamjs-mouseless-root";
document.body.appendChild(container);
renderMouselessModal(container as HTMLDivElement);
