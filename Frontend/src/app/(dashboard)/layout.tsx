import type { ReactNode } from "react";
import { DashboardGate } from "@/components/dashboard/dashboard-gate";
import { AuthProvider } from "@/lib/auth/auth-context";
import { SocketProvider } from "@/lib/socket/socket-provider";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <SocketProvider>
        <DashboardGate>{children}</DashboardGate>
      </SocketProvider>
    </AuthProvider>
  );
}
