import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Rahvana — U.S. Immigration Made Simple";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "60px 80px",
          background: "linear-gradient(135deg, #094749 0%, #0d5f63 50%, #15744f 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top bar: Brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "26px",
              fontWeight: 800,
              color: "#094749",
            }}
          >
            R
          </div>
          <span
            style={{
              fontSize: "32px",
              fontWeight: 700,
              letterSpacing: "-0.5px",
            }}
          >
            Rahvana
          </span>
        </div>

        {/* Middle: Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            maxWidth: "960px",
          }}
        >
          <div
            style={{
              fontSize: "56px",
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: "-1.5px",
            }}
          >
            U.S. Immigration Made Simple
          </div>
          <div
            style={{
              fontSize: "24px",
              color: "#d1fae5",
              lineHeight: 1.4,
            }}
          >
            Step-by-step roadmaps, smart document tools, and expert guidance for IR-1, IR-5, and family visa petitions.
          </div>
        </div>

        {/* Bottom bar: Badges */}
        <div
          style={{
            display: "flex",
            gap: "20px",
          }}
        >
          <div
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              borderRadius: "999px",
              padding: "10px 24px",
              fontSize: "18px",
              fontWeight: 600,
            }}
          >
            IR-1 / CR-1 Spouse Visa
          </div>
          <div
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              borderRadius: "999px",
              padding: "10px 24px",
              fontSize: "18px",
              fontWeight: 600,
            }}
          >
            IR-5 Parent Visa
          </div>
          <div
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              borderRadius: "999px",
              padding: "10px 24px",
              fontSize: "18px",
              fontWeight: 600,
            }}
          >
            USCIS & NVC Guidance
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
