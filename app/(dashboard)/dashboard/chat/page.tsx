import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";
import ChatGate from "@/components/ChatGate";
import { type ChatCounsellor } from "@/components/AiChatClient";

type SP = { counsellor?: string };

export default async function ChatPage({ searchParams }: { searchParams: Promise<SP> }) {
    const sp = await searchParams;
    const counsellors = await fetchAuthQuery(api.counsellors.list, {});
    const chatCounsellors: ChatCounsellor[] = counsellors.map((c) => ({
        slug: c.slug,
        name: c.name,
        portrait: c.portrait,
        specialties: c.specialties,
        languages: c.languages,
        experienceYears: c.experienceYears,
    }));

    return <ChatGate counsellors={chatCounsellors} initialSlug={sp.counsellor} />;
}
