"use client";
import { useState } from "react";

// Example venue photo (Unsplash). If it fails to load, the gradient underneath stays.
export default function PartyPhoto({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [ok, setOk] = useState(true);
  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br from-brand/50 via-panel to-night ${className}`}
    >
      {ok && (
        <img
          src={src}
          alt={alt}
          onError={() => setOk(false)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  );
}
