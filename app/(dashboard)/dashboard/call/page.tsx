import { Phone } from "lucide-react";
import ComingSoon from "@/components/ComingSoon";
import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";
import CallHistoryItem from "@/components/CallHistoryItem";

export default async function CallHistoryPage() {
    const calls = await fetchAuthQuery(api.calls.listMine, {});

    if (!calls || calls.length === 0) {
        return <ComingSoon icon={<Phone size={32} />} title="No calls yet" message="Your past calls will show up here." />;
    }

    return (
        <div className="pt-2">
            <h1 className="px-4 py-3 text-lg font-semibold">Call history</h1>
            <ul className="divide-y divide-[var(--card-border)]">
                {calls.map((c) => (
                    <li key={c._id}>
                        <CallHistoryItem call={c} />
                    </li>
                ))}
            </ul>
        </div>
    );
}
