"use client";

import { useMemo } from "react";
import qrcode from "qrcode-generator";

// A QR code made in the browser: nothing is sent to any service.
export default function QrCode({ value, label, size = 176 }: { value: string; label: string; size?: number }) {
  const svg = useMemo(() => {
    const qr = qrcode(0, "M");
    qr.addData(value);
    qr.make();
    return qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
  }, [value]);

  return (
    <div
      role="img"
      aria-label={label}
      className="qr shrink-0 rounded-[4px] bg-white p-1 [&_svg]:block [&_svg]:size-full"
      style={{ width: size, height: size }}
      // The markup comes from the library and contains only paths made from `value`.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
