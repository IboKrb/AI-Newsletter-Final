import { trpc } from "@/providers/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Headphones,
  Clock,
  Music,
  Apple,
  Youtube,
} from "lucide-react";
import { staticPodcasts } from "@/data/staticData";

interface PodcastType {
  id: number;
  title: string;
  host: string;
  description: string;
  episodeTitle: string | null;
  duration: string | null;
  spotifyUrl: string | null;
  appleUrl: string | null;
  youtubeUrl: string | null;
  imageUrl: string | null;
}

export default function PodcastSection() {
  const { data: issue } = trpc.newsletter.getLatest.useQuery();
  const { data: content } = trpc.newsletter.getIssueContent.useQuery(
    { issueId: issue?.id || 0 },
    { enabled: !!issue?.id }
  );

  const apiPodcasts: PodcastType[] = (content?.podcasts as unknown as PodcastType[]) || [];
  const podcasts = apiPodcasts.length > 0 ? apiPodcasts : staticPodcasts as unknown as PodcastType[];

  return (
    <section id="podcasts" className="border-t border-border bg-background py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500">
            <Headphones className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">
              Podcast of the Week
            </h2>
            <p className="text-sm text-muted-foreground">
              Die besten AI-Podcasts für deinen Commute – kuratiert und bewertet
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {podcasts.map((podcast: PodcastType) => (
            <Card
              key={podcast.id}
              className="overflow-hidden border-border bg-card transition-all hover:border-border"
            >
              <div className="relative h-48">
                <img
                  src={podcast.imageUrl || "/assets/podcast-latent-space.jpg"}
                  alt={podcast.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <Badge variant="outline" className="border-border text-muted-foreground text-[10px]">
                    <Clock className="mr-1 h-2.5 w-2.5" />
                    {podcast.duration}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-5">
                <h3 className="text-lg font-bold text-foreground">
                  {podcast.title}
                </h3>
                <p className="text-xs text-foreground0 mt-1">
                  Host: {podcast.host}
                </p>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                  {podcast.description}
                </p>
                {podcast.episodeTitle && (
                  <div className="mt-3 rounded-lg bg-background border border-border p-3">
                    <span className="text-[10px] font-medium text-foreground0 uppercase tracking-wider">
                      Empfohlene Episode
                    </span>
                    <p className="mt-1 text-sm font-medium text-muted-foreground">
                      {podcast.episodeTitle}
                    </p>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {podcast.spotifyUrl && (
                    <a
                      href={podcast.spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 border-border text-muted-foreground hover:bg-muted hover:text-foreground text-xs"
                      >
                        <Music className="mr-1 h-3 w-3" /> Spotify
                      </Button>
                    </a>
                  )}
                  {podcast.appleUrl && (
                    <a
                      href={podcast.appleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 border-border text-muted-foreground hover:bg-muted hover:text-foreground text-xs"
                      >
                        <Apple className="mr-1 h-3 w-3" /> Apple
                      </Button>
                    </a>
                  )}
                  {podcast.youtubeUrl && (
                    <a
                      href={podcast.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 border-border text-muted-foreground hover:bg-muted hover:text-foreground text-xs"
                      >
                        <Youtube className="mr-1 h-3 w-3" /> YouTube
                      </Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
