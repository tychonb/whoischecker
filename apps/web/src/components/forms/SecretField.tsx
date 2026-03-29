import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import { Button } from "../feedback/Button";
import { Input, type InputProps } from "./Input";

export function SecretField(props: InputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input {...props} className="pr-12" type={visible ? "text" : "password"} />
      <Button
        className="absolute right-1 top-1"
        onClick={() => setVisible((current) => !current)}
        size="sm"
        type="button"
        variant="ghost"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
    </div>
  );
}
