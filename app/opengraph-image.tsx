import { ImageResponse } from "next/og";

// Static OG image generated at build time, served from /opengraph-image
// (and referenced from metadata via openGraph.images by default).
export const alt = "Masst Docs — System Design Tutorial, HLD & LLD Guide";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px",
          background:
            "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
          color: "white",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "32px",
            opacity: 0.9,
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              fontWeight: 700,
            }}
          >
            M
          </div>
          <div style={{ fontSize: "28px", fontWeight: 600 }}>Masst Docs</div>
        </div>

        <div
          style={{
            fontSize: "72px",
            fontWeight: 800,
            lineHeight: 1.1,
            background: "linear-gradient(135deg, #f1f5f9, #94a3b8)",
            backgroundClip: "text",
            color: "transparent",
            marginBottom: "24px",
          }}
        >
          System Design Tutorial
        </div>

        <div
          style={{
            fontSize: "32px",
            color: "#94a3b8",
            lineHeight: 1.4,
            maxWidth: "900px",
          }}
        >
          Free HLD &amp; LLD guide. Netflix, Uber, WhatsApp architecture.
          22 design patterns. 24 machine-coding case studies.
        </div>

        <div
          style={{
            display: "flex",
            gap: "16px",
            marginTop: "48px",
          }}
        >
          {["HLD", "LLD", "Patterns", "Case Studies"].map((tag) => (
            <div
              key={tag}
              style={{
                padding: "10px 24px",
                borderRadius: "999px",
                background: "rgba(59, 130, 246, 0.15)",
                border: "1px solid rgba(59, 130, 246, 0.4)",
                color: "#93c5fd",
                fontSize: "20px",
                fontWeight: 500,
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
