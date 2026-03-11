import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "lost" | "found" | "pending" | "approved" | "rejected" | "active" | "resolved" | "expired";
}

const Badge = ({ className, variant = "active", children, ...props }: BadgeProps) => {
  const variants = {
    lost: "bg-red-100 text-red-800 border-red-200",
    found: "bg-green-100 text-green-800 border-green-200",
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    approved: "bg-green-100 text-green-800 border-green-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
    active: "bg-blue-100 text-blue-800 border-blue-200",
    resolved: "bg-gray-100 text-gray-800 border-gray-200",
    expired: "bg-gray-100 text-gray-500 border-gray-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-xs font-semibold border",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export { Badge };
export type { BadgeProps };
