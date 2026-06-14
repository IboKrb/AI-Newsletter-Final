import { trpc } from "@/providers/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Clock,
  ExternalLink,
  User,
} from "lucide-react";
import { staticReads } from "@/data/staticData";

interface ReadType {
  id: number;
  title: string;
  author: string;
  description: string;
  url: string;
  source: string;
  readTime: string | null;
  imageUrl: string | null;
}

export default function ReadSection() {
  const { data: issue } = trpc.newsletter.getLatest.useQuery();
  const { data: content } = trpc.newsletter.getIssueContent.useQuery(
    { issueId: issue?.id || 0 },
    { enabled: !!issue?.id }
  );

  const apiReads: ReadType[] = (content?.reads as unknown as ReadType[]) || [];
  const reads = apiReads.length > 0 ? apiReads : staticReads as unknown as ReadType[];

  return (
    <section id="reads" className="border-t border-border bg-background py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500">
            <BookOpen className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">
              Read of the Week
            </h2>
            <p className="text-sm text-muted-foreground">
              Die wichtigsten Artikel, Papers und Essays – kuratiert für dich
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reads.map((read: ReadType) => (
            <a
              key={read.id}
              href={read.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <Card className="h-full border-border bg-card transition-all hover:border-border hover:bg-muted">
                <div className="relative h-40 overflow-hidden rounded-t-lg">
                  <img
                    src={read.imageUrl || "/assets/read-mit.jpg"}
                    alt={read.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent" />
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">
                      {read.source}
                    </Badge>
                    <Badge variant="outline" className="border-border text-muted-foreground text-[10px]">
                      <Clock className="mr-1 h-2.5 w-2.5" />
                      {read.readTime}
                    </Badge>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-amber-600 transition-colors">
                    {read.title}
                  </h3>
                  <p className="mt-1 text-xs text-foreground0 flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {read.author}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                    {read.description}
                  </p>
                  <div className="mt-3 flex items-center gap-1 text-xs text-amber-600 group-hover:text-amber-700">
                    <ExternalLink className="h-3 w-3" />
                    Artikel lesen
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
