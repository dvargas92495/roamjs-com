import React, { useState } from "react";
import ReactDOM from "react-dom";
import Helmet from "react-helmet";

const Extension = ({
  title,
  description,
  src,
  inProgress,
  children,
}: {
  title: string;
  description: string;
  src: string;
  children: React.ReactNode;
  inProgress: boolean;
}) => {
  const [value, setValue] = useState("master");
  return (
    <div style={{ display: "flex", border: "1px dashed black" }}>
      <div style={{ padding: 16, width: "50%" }}>
        <h2>{title}</h2>
        {inProgress && (
          <h5>
            <i>This extension is still under development</i>
          </h5>
        )}
        <p>{description}</p>
      </div>
      <div style={{ padding: 16, width: "50%" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-evenly",
          }}
        >
          <h4>Demo Branch:</h4>
          <input
            placeholder="Branch"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            style={{ height: 20 }}
          />
        </div>
        <div
          style={{
            width: "100% - 32px",
            border: "1px solid black",
            padding: 16,
          }}
        >
          <Helmet>
            <script
              src={`https://roam.davidvargas.me/${value}/${src}.js`}
              type="text/javascript"
              async={true}
            />
          </Helmet>
          {children}
        </div>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <>
      <header style={{ padding: "0 16px" }}>
        <h1>Roam JS Extensions</h1>
      </header>
      <article>
        <Extension
          title="Google Calendar Integration"
          description="The Google Calendar extension allows users to import the list of events on a given day into their daily notes page."
          src="google-calendar"
          inProgress
        >
          <button>Import Google Calendar</button>
        </Extension>
      </article>
    </>
  );
};

ReactDOM.render(<App />, document.getElementById("root"));
