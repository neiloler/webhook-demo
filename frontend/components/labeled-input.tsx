import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LabeledInputProps = {
  label: string;
} & Omit<ComponentProps<typeof Input>, "id"> & {
    id: string;
  };

const LabeledInput = ({ label, id, ...inputProps }: LabeledInputProps) => {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} {...inputProps} />
    </div>
  );
};

export { LabeledInput };
