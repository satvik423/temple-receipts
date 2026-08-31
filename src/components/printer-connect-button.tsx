"use client";

import * as React from "react";
import { Usb } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  getAuthorizedPrinter,
  isWebUsbSupported,
  requestPrinter,
} from "@/lib/thermal-printer";

export function PrinterConnectButton({
  className,
  onConnected,
}: {
  className?: string;
  onConnected?: () => void;
}) {
  const [deviceName, setDeviceName] = React.useState<string | null>(null);
  const [checked, setChecked] = React.useState(false);

  React.useEffect(() => {
    getAuthorizedPrinter().then((device) => {
      setDeviceName(device ? (device.productName ?? "USB printer") : null);
      setChecked(true);
    });
  }, []);

  async function handleConnect() {
    try {
      const device = await requestPrinter();
      setDeviceName(device.productName ?? "USB printer");
      toast.success("Printer connected");
      onConnected?.();
    } catch {
      // user cancelled the device picker, or no device was available; nothing to report
    }
  }

  if (!checked) return null;

  if (!isWebUsbSupported()) {
    return (
      <p className={`text-sm text-muted-foreground ${className ?? ""}`}>
        This browser doesn&apos;t support connecting to a USB printer directly.
      </p>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <Button type="button" variant="outline" onClick={handleConnect}>
        <Usb className="size-4" />
        {deviceName ? "Reconnect Printer" : "Connect Printer"}
      </Button>
      <span className="text-sm text-muted-foreground">
        {deviceName ? `Connected: ${deviceName}` : "No printer connected"}
      </span>
    </div>
  );
}
