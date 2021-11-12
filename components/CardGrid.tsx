import Grid, { GridSize } from "@material-ui/core/Grid";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import CardMedia from "@material-ui/core/CardMedia";
import Typography from "@material-ui/core/Typography";
import Link from "@material-ui/core/Link";
import Fade from "@material-ui/core/Fade";

const Preview: React.FunctionComponent<{
  image: string;
  title: string;
  description: string;
}> = ({ image, title, description }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showDescription, setShowDescription] = useState(false);
  const onMouseEnter = useCallback(
    () => setShowDescription(true),
    [setShowDescription]
  );
  const onMouseLeave = useCallback(
    () => setShowDescription(false),
    [setShowDescription]
  );
  const [height, setHeight] = useState(140);
  useEffect(() => {
    const dummyImage = new Image();
    dummyImage.src = image;
    dummyImage.style.visibility = "hidden";
    dummyImage.onload = () => {
      document.body.appendChild(dummyImage);
      const { clientWidth, clientHeight } = dummyImage;
      dummyImage.remove();
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth - 16;
        const containerHeight = containerRef.current.clientHeight - 16;
        if (clientWidth / clientHeight < containerWidth / containerHeight) {
          setHeight(containerHeight);
        } else {
          setHeight((containerWidth * clientHeight) / clientWidth);
        }
      }
    };
  }, [containerRef, image]);
  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      ref={containerRef}
      style={{
        padding: 8,
        position: "relative",
        flexGrow: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <CardMedia
        image={image}
        title={title}
        style={{ height, borderRadius: 4 }}
      />
      <Fade in={showDescription} timeout={750}>
        <div
          style={{
            backgroundColor: "rgba(255,255,255,0.95)",
            color: "#888888",
            justifyContent: "center",
            left: 0,
            padding: 10,
            textAlign: "center",
            top: 0,
            position: "absolute",
            width: "100%",
            height: "100%",
            alignItems: "center",
            display: "flex",
            fontSize: 12,
          }}
        >
          {description}
        </div>
      </Fade>
    </div>
  );
};

const CardGrid: React.FunctionComponent<{
  items: { image: string; title: string; description: string; href: string }[];
  width: GridSize;
}> = ({ items, width }) => {
  return (
    <Grid container spacing={2}>
      {items.map(({ image, title, description, href }) => (
        <Grid item xs={width} key={title}>
          <Card
            style={{
              maxWidth: 345,
              height: "100%",
            }}
          >
            <Link
              href={href}
              style={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
              }}
            >
              <Preview title={title} description={description} image={image} />
              <CardContent style={{ padding: 8 }}>
                <Typography
                  variant="h6"
                  style={{ fontSize: 16, margin: 0, textAlign: "center" }}
                >
                  {title}
                </Typography>
              </CardContent>
            </Link>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default CardGrid;
