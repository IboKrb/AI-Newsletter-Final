import { trpc } from "@/providers/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Clock,
  Youtube,
  ExternalLink,
} from "lucide-react";
import { staticVideos } from "@/data/staticData";

interface VideoType {
  id: number;
  title: string;
  creator: string;
  description: string;
  youtubeUrl: string;
  thumbnailUrl: string | null;
  duration: string | null;
}

export default function VideoSection() {
  const { data: issue } = trpc.newsletter.getLatest.useQuery();
  const { data: content } = trpc.newsletter.getIssueContent.useQuery(
    { issueId: issue?.id || 0 },
    { enabled: !!issue?.id }
  );

  const apiVideos: VideoType[] = (content?.videos as unknown as VideoType[]) || [];
  const videos = apiVideos.length > 0 ? apiVideos : staticVideos as unknown as VideoType[];

  return (
    <section id="videos" className="border-t border-border py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-orange-500">
            <Play className="h-5 w-5 text-foreground fill-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">
              Video of the Week
            </h2>
            <p className="text-sm text-muted-foreground">
              Die besten AI-Video-Tutorials und Deep Dives – kuratiert von YouTube
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {videos.map((video: VideoType) => (
            <Card
              key={video.id}
              className="overflow-hidden border-border bg-card transition-all hover:border-border"
            >
              <a
                href={video.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="relative block aspect-video group"
              >
                <img
                  src={video.thumbnailUrl || "/assets/video-claude-projects.jpg"}
                  alt={video.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-card transition-colors group-hover:bg-card" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600/90 text-foreground shadow-lg transition-transform group-hover:scale-110">
                    <Play className="h-6 w-6 fill-white" />
                  </div>
                </div>
                <div className="absolute bottom-3 right-3">
                  <Badge className="bg-background text-foreground text-[10px] backdrop-blur-sm">
                    <Clock className="mr-1 h-2.5 w-2.5" />
                    {video.duration}
                  </Badge>
                </div>
              </a>

              <CardContent className="p-5">
                <h3 className="text-base font-bold text-foreground line-clamp-2">
                  {video.title}
                </h3>
                <p className="mt-1 text-xs text-foreground0">
                  Creator: {video.creator}
                </p>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                  {video.description}
                </p>
                <a
                  href={video.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                >
                  <Youtube className="h-4 w-4" />
                  Auf YouTube ansehen
                  <ExternalLink className="h-3 w-3" />
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
