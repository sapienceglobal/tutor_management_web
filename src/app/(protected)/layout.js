'use client';

import { ConfirmProvider } from "@/components/providers/ConfirmProvider";
import { TenantProvider } from "@/components/providers/TenantProvider";
import { SettingsProvider } from "@/components/providers/SettingsProvider";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ImpersonationBar from "@/components/layout/ImpersonationBar";
import SuspensionBanner from "@/components/layout/SuspensionBanner";
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';

export default function ProtectedLayout({ children }) {
  return (
    <SubscriptionProvider>
      <TenantProvider>
        <SettingsProvider>
          <ThemeProvider>
            <ConfirmProvider>
              <ImpersonationBar />
              <SuspensionBanner />
              {children}
            </ConfirmProvider>
          </ThemeProvider>
        </SettingsProvider>
      </TenantProvider>
    </SubscriptionProvider>
  );
}