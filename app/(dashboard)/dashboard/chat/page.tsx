import { MessageSquare } from "lucide-react";
import ComingSoon from "@/components/ComingSoon";

export default function ChatPage() {
    return <ComingSoon icon={<MessageSquare size={32} />} title="Chat" message="Chat with counsellors is coming soon." />;
}
