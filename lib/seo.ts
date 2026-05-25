import { Metadata } from "next";
import { appConfig } from "./config";

type MetaTagProps = {
    title: string,
    description?: string,
    url?: string
    opengraph?: {
        title: string,
        description: string,
        url: string,
        siteName: string,
        locale?: string,
        type?: "website" | "article" | "book" | "profile" | "video.movie" | "video.episode" | "video.other" | "music.song" | "music.album" | "music.playlist" | "music.radio_station",
    }
    canonicalUrlRelative: string,
}

export const getMetaTags = ({ title, description, url, opengraph, canonicalUrlRelative }: MetaTagProps): Metadata => {
    return {
        title: title || appConfig.name,
        description: description || appConfig.description,
        openGraph: {
            title: opengraph?.title || appConfig.name,
            description: opengraph?.description || appConfig.description,
            url: opengraph?.url || url,
            type: opengraph?.type || "website",
            siteName: opengraph?.siteName || appConfig.name,
            locale: opengraph?.locale || "en_US",
        },
        twitter: {
            title: opengraph?.title || appConfig.name,
            description: opengraph?.description || appConfig.description,
            card: "summary_large_image",
        },
        ...(canonicalUrlRelative && {
            alternates: {
                canonical: canonicalUrlRelative,
            },
        }),
    }
} 
