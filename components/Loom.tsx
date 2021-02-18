import React from "react";

const Loom: React.FunctionComponent<{ id: string }> = ({ id }) => {
  return (
    <div
      style={{
        position: "relative",
        paddingBottom: "66.66666666666666%",
        height: 0,
      }}
    >
      <iframe
        src={`https://www.loom.com/embed/${id}`}
        allowFullScreen
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
};

export default Loom;
