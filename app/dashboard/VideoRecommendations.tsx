// app/dashboard/VideoRecommendations.tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

interface VideoRecommendationsProps {
  topics: string[];
}

interface Video {
  topic: string;
  videoId: string;
  title: string;
  thumbnail: string;
}

export default function VideoRecommendations({
  topics,
}: VideoRecommendationsProps) {
  const supabase = createClient();
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (topics.length === 0) {
      setIsLoading(false);
      return;
    }

    const fetchRecommendations = async () => {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke(
        "youtube-recommender",
        {
          body: JSON.stringify({ topics }),
        }
      );

      if (data?.recommendations) {
        setVideos(data.recommendations);
      }
      if (error) {
        console.error("Failed to fetch video recommendations:", error);
      }
      setIsLoading(false);
    };

    fetchRecommendations();
  }, [topics, supabase]);

  if (isLoading) {
    return <p>Loading video recommendations...</p>;
  }

  if (videos.length === 0) {
    return <p>No video recommendations available for these topics.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {videos.map((video) => (
        <a
          key={video.videoId}
          href={`https://www.youtube.com/watch?v=${video.videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group"
        >
          <Card className="h-full overflow-hidden transition-all group-hover:border-primary">
            <div className="relative aspect-video">
              <Image
                src={video.thumbnail}
                alt={video.title}
                layout="fill"
                objectFit="cover"
              />
            </div>
            <CardHeader>
              <CardTitle className="text-sm font-medium leading-tight group-hover:text-primary">
                {video.title}
              </CardTitle>
            </CardHeader>
          </Card>
        </a>
      ))}
    </div>
  );
}
