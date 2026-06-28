import { AccountShell } from "@/components/account/account-shell";
import { ProfileCard } from "@/components/account/profile-card";
import { StylePreferences } from "@/components/account/style-preferences";

export default function AccountProfilePage() {
  return (
    <AccountShell
      eyebrow="Profile"
      title="Edit demo profile."
      description="Tune buyer profile and style preference fields for the account foundation. This stays local until real authentication and account persistence are connected."
      aside={<StylePreferences />}
    >
      <ProfileCard />
    </AccountShell>
  );
}
