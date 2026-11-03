import {
  MediaFormatOrNullSchema,
  MediaSeasonOrNullSchema,
  type Anime,
  type AnimeDetail,
} from '@/types/anime'
import type { AniListMedia } from '@/types/anilist'

export function mapMediaToAnime(media: AniListMedia): Anime {
  return {
    id: media.id,
    title: {
      romaji: media.title.romaji ?? media.title.native ?? '',
      english: media.title.english,
      native: media.title.native ?? '',
    },
    coverImage: media.coverImage.large ?? '/placeholder-cover.svg',
    bannerImage: media.bannerImage,
    format: MediaFormatOrNullSchema.parse(media.format),
    episodes: media.episodes,
    duration: media.duration,
    seasonYear: media.seasonYear,
    season: MediaSeasonOrNullSchema.parse(media.season),
    genres: media.genres,
    averageScore: media.averageScore,
    popularity: media.popularity,
    status: media.status,
    studios: media.studios.nodes.map((studio) => studio.name),
    description: media.description ?? null,
  }
}

export function mapMediaToAnimeDetail(media: AniListMedia): AnimeDetail {
  return {
    ...mapMediaToAnime(media),
    relations: (media.relations?.edges ?? []).map((edge) => mapMediaToAnime(edge.node)),
  }
}
