"use client";

import React from "react";

interface TutorialVideoProps {
  src: string;
  poster?: string;
  alt?: string;
  className?: string;
}

/**
 * Shared video component for tutorial content.
 *
 * Features:
 * - Autoplay with muted audio (required for autoplay policies in modern browsers)
 * - Continuous loop for seamless playback
 * - Preload="metadata" for faster initial load
 * - Poster image shown before video starts
 * - playsInline for mobile Safari support
 * - controlsList="nodownload" to prevent downloads
 *
 */
export const TutorialVideo: React.FC<TutorialVideoProps> = ({
  src,
  poster,
  alt,
  className = "",
}) => {
  return (
    <video
      key={src}
      className={`w-full h-full object-cover ${className}`}
      autoPlay
      muted
      loop
      preload="metadata"
      poster={poster}
      controls={false}
      playsInline
      controlsList="nodownload"
    >
      <source src={src} type="video/mp4" />
      {alt && <p>{alt}</p>}
    </video>
  );
};

export default TutorialVideo;
