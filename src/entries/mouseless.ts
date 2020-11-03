import { renderMouselessModal } from "../components/MouselessModal";

const container = document.createElement("div");
document.body.appendChild(container);
renderMouselessModal(container as HTMLDivElement);
