"use client";

import * as React from "react";
import { Plus, Loader2 } from "lucide-react";

import { useT } from "@/lib/i18n/client";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EnvVarUpsertInput } from "@/features/env-vars/hooks/use-env-vars-store";

interface AddEnvVarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: EnvVarUpsertInput) => Promise<void> | void;
  isSaving?: boolean;
}

export function AddEnvVarDialog({
  open,
  onOpenChange,
  onSave,
  isSaving = false,
}: AddEnvVarDialogProps) {
  const { t } = useT("translation");
  const [key, setKey] = React.useState("");
  const [value, setValue] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [isSecret, setIsSecret] = React.useState(true);
  const [scope, setScope] = React.useState<"global" | "user">("user");

  // Auto-detect if key should be secret based on name
  React.useEffect(() => {
    if (key) {
      const shouldBeSecret = /(api|key|token|secret|password)/i.test(key);
      setIsSecret(shouldBeSecret);
    }
  }, [key]);

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      setKey("");
      setValue("");
      setDescription("");
      setIsSecret(true);
      setScope("user");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedKey = key.trim();
    const trimmedValue = value.trim();

    if (!trimmedKey || !trimmedValue) return;

    await onSave({
      key: trimmedKey,
      value: trimmedValue,
      isSecret,
      description: description.trim() || undefined,
      scope,
    });

    onOpenChange(false);
  };

  const isValid = key.trim() && value.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("library.envVars.addTitle")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Key */}
            <div className="space-y-2">
              <Label htmlFor="env-key">{t("library.envVars.keyLabel")}</Label>
              <Input
                id="env-key"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="OPENAI_API_KEY"
                autoCapitalize="characters"
                disabled={isSaving}
              />
            </div>

            {/* Value */}
            <div className="space-y-2">
              <Label htmlFor="env-value">
                {t("library.envVars.valueLabel")}
              </Label>
              <Input
                id="env-value"
                type={isSecret ? "password" : "text"}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={t("library.envVars.valuePlaceholder")}
                disabled={isSaving}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="env-description">
                {t("library.envVars.descriptionLabel")}
              </Label>
              <Input
                id="env-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("library.envVars.descriptionPlaceholder")}
                disabled={isSaving}
              />
            </div>

            {/* Scope */}
            <div className="space-y-2">
              <Label htmlFor="env-scope">
                {t("library.envVars.scopeLabel")}
              </Label>
              <Select
                value={scope}
                onValueChange={(value) => setScope(value as "global" | "user")}
                disabled={isSaving}
              >
                <SelectTrigger id="env-scope">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">
                    {t("library.envVars.scope.user")}
                  </SelectItem>
                  <SelectItem value="global">
                    {t("library.envVars.scope.system")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={!isValid || isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {t("library.envVars.saving")}
                </>
              ) : (
                <>
                  <Plus className="mr-2 size-4" />
                  {t("library.envVars.addButton")}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
