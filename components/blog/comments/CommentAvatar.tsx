// components/blog/comments/CommentAvatar.tsx
"use client";

import React, { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";

interface CommentAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

export default function CommentAvatar({
  name,
  avatarUrl,
  size = "md",
  className,
}: CommentAvatarProps) {
  const [imageError, setImageError] = useState(false);

  const initial = (name ? name.trim().charAt(0) : "U").toUpperCase();
  const hasValidImage = Boolean(avatarUrl && !imageError);

  return (
    <div
      className={cn(
        "relative shrink-0 rounded-full select-none overflow-hidden transition-all duration-200",
        sizeClasses[size],
        hasValidImage
          ? "ring-1 ring-border/80 shadow-xs bg-muted"
          : "flex items-center justify-center font-bold tracking-tight bg-gradient-to-br from-teal-500/20 via-teal-600/15 to-teal-700/25 text-teal-600 dark:text-teal-300 ring-1 ring-teal-500/30 shadow-xs",
        className
      )}
      title={name}
      aria-label={`${name}'s avatar`}
    >
      {hasValidImage ? (
        <Image
          src={avatarUrl!}
          alt={name || "User avatar"}
          fill
          unoptimized
          sizes="48px"
          className="object-cover"
          onError={() => setImageError(true)}
        />
      ) : initial ? (
        <span>{initial}</span>
      ) : (
        <User className="h-4 w-4 text-teal-500" />
      )}
    </div>
  );
}
