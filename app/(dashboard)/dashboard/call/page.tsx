import { Phone } from "lucide-react";
import ComingSoon from "@/components/ComingSoon";

export default function CallIndexPage() {
    return <ComingSoon icon={<Phone size={32} />} title="Call History" message="Your past calls will show up here." />;
}
