/* eslint-disable react/prop-types */
// QR chung (SVG) từ chuỗi bất kỳ. Nền trắng để quét tốt.
import { useMemo } from "react";
import qrcode from "qrcode-generator";

export default function QrSvg({ value, size = 160 }) {
  const svg = useMemo(() => {
    if (!value) return null;
    try {
      const qr = qrcode(0, "M");
      qr.addData(String(value));
      qr.make();
      const n = qr.getModuleCount();
      const cell = size / (n + 8); // quiet zone 4 ô mỗi bên
      const pad = cell * 4;
      let d = "";
      for (let r = 0; r < n; r += 1) {
        for (let c = 0; c < n; c += 1) {
          if (qr.isDark(r, c)) {
            d += `M${(pad + c * cell).toFixed(2)} ${(pad + r * cell).toFixed(2)}h${cell.toFixed(2)}v${cell.toFixed(2)}h-${cell.toFixed(2)}z`;
          }
        }
      }
      return { d, size };
    } catch {
      return null;
    }
  }, [value, size]);

  if (!svg) return null;
  return (
    <svg
      width={svg.size}
      height={svg.size}
      viewBox={`0 0 ${svg.size} ${svg.size}`}
      shapeRendering="crispEdges"
      style={{ display: "block", background: "#fff", borderRadius: 10, padding: 4 }}
    >
      <path d={svg.d} fill="#000" />
    </svg>
  );
}
