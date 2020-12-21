import { Button, Drawer, H4, H6, Position, Spinner } from "@blueprintjs/core";
import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import ReactDOM from "react-dom";

const DrawerContent = () => {
  const [extensions, setExtensions] = useState<
    {
      id: number;
      name: string;
      src: string;
      featured: boolean;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    axios
      .get(
        "https://api.steinhq.com/v1/storages/5fde3ce0f62b6004b3eb63f6/AllExtensions"
      )
      .then((r) =>
        setExtensions(
          r.data.map(
            (d: {
              Id: string;
              Name: string;
              "Script Path": string;
              Featured: string;
            }) => ({
              id: parseInt(d.Id),
              name: d.Name,
              src: d["Script Path"],
              featured: d.Featured === "TRUE",
            })
          )
        )
      )
      .finally(() => setLoading(false));
  }, [setExtensions, setLoading]);
  return (
    <div>
      {loading ? (
        <Spinner />
      ) : (
        extensions.map((e) => (
          <div key={e.id}>
            <H4>{e.name}</H4>
            <H6>Source: {e.src}</H6>
            <hr />
          </div>
        ))
      )}
    </div>
  );
};

const Marketplace: React.FunctionComponent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), [setIsOpen]);
  const onClose = useCallback(() => setIsOpen(false), [setIsOpen]);
  return (
    <>
      <Button icon={"exchange"} minimal onClick={open} />
      <Drawer
        title={"Roam Extension Marketplace"}
        position={Position.LEFT}
        onClose={onClose}
        isOpen={isOpen}
        style={{ zIndex: 1000 }}
      >
        <DrawerContent />
      </Drawer>
    </>
  );
};

export const render = (s: HTMLSpanElement): void =>
  ReactDOM.render(<Marketplace />, s);

export default Marketplace;
