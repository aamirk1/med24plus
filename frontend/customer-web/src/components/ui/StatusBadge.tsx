import React from "react";
import { Badge } from "./Badge";
import { CheckCircle2, Clock, XCircle, Truck, Package, ShieldCheck } from "lucide-react";

export interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const normalized = status.toLowerCase();

  if (normalized.includes("approved") || normalized.includes("verified") || normalized.includes("delivered")) {
    return (
      <Badge variant="success" size="sm" className="gap-1">
        <CheckCircle2 className="w-3 h-3" />
        <span>{status}</span>
      </Badge>
    );
  }

  if (normalized.includes("pending") || normalized.includes("review") || normalized.includes("placed")) {
    return (
      <Badge variant="warning" size="sm" className="gap-1">
        <Clock className="w-3 h-3" />
        <span>{status}</span>
      </Badge>
    );
  }

  if (normalized.includes("out for delivery") || normalized.includes("dispatched")) {
    return (
      <Badge variant="secondary" size="sm" className="gap-1">
        <Truck className="w-3 h-3" />
        <span>{status}</span>
      </Badge>
    );
  }

  if (normalized.includes("packed")) {
    return (
      <Badge variant="primary" size="sm" className="gap-1">
        <Package className="w-3 h-3" />
        <span>{status}</span>
      </Badge>
    );
  }

  if (normalized.includes("rejected") || normalized.includes("cancelled")) {
    return (
      <Badge variant="danger" size="sm" className="gap-1">
        <XCircle className="w-3 h-3" />
        <span>{status}</span>
      </Badge>
    );
  }

  return (
    <Badge variant="neutral" size="sm">
      {status}
    </Badge>
  );
};

