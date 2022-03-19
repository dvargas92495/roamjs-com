import { Button, Dialog, DialogTitle, DialogContent } from "@dvargas92495/ui";
import React, { useCallback, useEffect, useState } from "react";
import SponsorCard from "./SponsorCard";

const SponsorDialog = ({ id }: { id: string }): React.ReactElement => {
  const [open, setOpen] = useState(false);
  const handleOpen = useCallback(() => setOpen(true), [setOpen]);
  const handleClose = useCallback(() => setOpen(false), [setOpen]);
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    setOpen(query.get("sponsor") === "true");
  }, [setOpen]);
  return (
    <>
      <Button color={"primary"} variant="contained" onClick={handleOpen}>
        Sponsor
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Sponsor RoamJS</DialogTitle>
        <DialogContent>
          <SponsorCard source={id} />
          <Button
            onClick={handleClose}
            color="secondary"
            style={{ marginBottom: -16, right: -320, bottom: 36 }}
          >
            Cancel
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SponsorDialog;
