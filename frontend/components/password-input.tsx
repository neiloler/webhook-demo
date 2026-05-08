"use client";

import { ViewIcon, ViewOffIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState, type ComponentProps } from "react";
import { LabeledInput } from "@/components/labeled-input";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<
  ComponentProps<typeof LabeledInput>,
  "trailingIcon" | "type"
>;

const PasswordInput = ({ className, ...inputProps }: PasswordInputProps) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const label = isPasswordVisible ? "Hide password" : "Show password";

  return (
    <div className="w-full max-w-[18rem]">
      <LabeledInput
        className={cn(className)}
        type={isPasswordVisible ? "text" : "password"}
        trailingIcon={
          <button
            aria-label={label}
            aria-pressed={isPasswordVisible}
            className="inline-flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
            onClick={() => setIsPasswordVisible((current) => !current)}
            onMouseDown={(event) => event.preventDefault()}
            title={label}
            type="button"
          >
            <HugeiconsIcon
              aria-hidden
              icon={isPasswordVisible ? ViewIcon : ViewOffIcon}
              size={16}
              strokeWidth={1.7}
            />
          </button>
        }
        {...inputProps}
      />
    </div>
  );
};

export { PasswordInput };
