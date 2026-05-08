"use client";

import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ActionButtonProps = Omit<ComponentProps<typeof Button>, "children"> & {
  icon: IconSvgElement;
  label: string;
  children?: ReactNode;
};

const ActionButton = ({
  children,
  className,
  icon,
  label,
  size = children ? "sm" : "icon-sm",
  type = "button",
  variant = "outline",
  ...buttonProps
}: ActionButtonProps) => {
  return (
    <Button
      aria-label={children ? undefined : label}
      className={cn(children ? "gap-2" : "shrink-0", className)}
      size={size}
      title={label}
      type={type}
      variant={variant}
      {...buttonProps}
    >
      <HugeiconsIcon aria-hidden icon={icon} size={16} strokeWidth={1.7} />
      {children ? <span>{children}</span> : null}
    </Button>
  );
};

export { ActionButton };
