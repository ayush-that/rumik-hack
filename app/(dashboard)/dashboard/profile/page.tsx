import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";
import ProfileForm from "@/components/ProfileForm";

export default async function ProfilePage() {
    const [user, profile] = await Promise.all([
        fetchAuthQuery(api.auth.getCurrentUser),
        fetchAuthQuery(api.user.getProfile),
    ]);

    return (
        <ProfileForm
            email={user?.email ?? ""}
            initial={{
                displayName: profile?.displayName ?? user?.name ?? "",
                gender: profile?.gender ?? null,
                birthDate: profile?.birthDate ?? null,
                birthTime: profile?.birthTime ?? null,
                birthTimeUnknown: profile?.birthTimeUnknown ?? false,
                birthPlace: profile?.birthPlace ?? null,
            }}
        />
    );
}
