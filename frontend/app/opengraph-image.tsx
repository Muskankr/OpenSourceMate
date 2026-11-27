import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "OpenSourceMate – Find open-source issues that fit your skills";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#05070d",
        backgroundImage:
          "radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.05) 2%, transparent 0%), radial-gradient(circle at 75px 75px, rgba(147, 51, 234, 0.15) 2%, transparent 0%)",
        backgroundSize: "100px 100px",
        color: "white",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "60px 80px",
        position: "relative",
      }}
    >
      {/* Glow Effects */}
      <div
        style={{
          position: "absolute",
          top: "-100px",
          right: "-100px",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(147, 51, 234, 0.35) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-100px",
          left: "-100px",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Content Box */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          maxWidth: "960px",
          zIndex: 10,
        }}
      >
        {/* Logo Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "10px 24px",
            borderRadius: "9999px",
            backgroundColor: "rgba(147, 51, 234, 0.15)",
            border: "1px solid rgba(147, 51, 234, 0.3)",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              backgroundColor: "#a855f7",
            }}
          />
          <span
            style={{
              fontSize: "20px",
              fontWeight: 600,
              color: "#d8b4fe",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            OpenSourceMate
          </span>
        </div>

        {/* Heading */}
        <h1
          style={{
            fontSize: "64px",
            fontWeight: 800,
            lineHeight: 1.15,
            margin: 0,
            marginBottom: "24px",
            background: "linear-gradient(to right, #ffffff, #e2e8f0, #c084fc)",
            backgroundClip: "text",
            color: "transparent",
            textAlign: "center",
          }}
        >
          Find Open-Source Issues That Fit Your Skills
        </h1>

        {/* Tagline */}
        <p
          style={{
            fontSize: "26px",
            lineHeight: 1.4,
            color: "#94a3b8",
            margin: 0,
            marginBottom: "40px",
            textAlign: "center",
          }}
        >
          Analyze your GitHub profile, uncover your programming strengths, and discover curated
          contribution opportunities.
        </p>

        {/* Feature Pills */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {["Developer Analysis", "Issue Matcher", "Profile Comparison"].map((pill) => (
            <div
              key={pill}
              style={{
                padding: "8px 20px",
                borderRadius: "12px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                fontSize: "18px",
                color: "#cbd5e1",
                fontWeight: 500,
              }}
            >
              {pill}
            </div>
          ))}
        </div>
      </div>
    </div>,
    {
      ...size,
    }
  );
}
