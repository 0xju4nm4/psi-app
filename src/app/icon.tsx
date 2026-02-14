import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 14,
          background: "#F8F8F8",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#1C1C1E",
          borderRadius: "20%",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          border: "1px solid #EFEFEF",
        }}
      >
        PSI
      </div>
    ),
    {
      ...size,
    }
  );
}
