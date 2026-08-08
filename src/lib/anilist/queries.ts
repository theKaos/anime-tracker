export const MEDIA_FIELDS = `
  id
  title { romaji english native }
  coverImage { large }
  bannerImage
  format
  episodes
  duration
  seasonYear
  season
  genres
  averageScore
  popularity
  status
  studios(isMain: true) { nodes { name } }
`

export const SEARCH_ANIME_QUERY = `
  query (
    $page: Int
    $perPage: Int
    $search: String
    $seasonYear: Int
    $season: MediaSeason
    $format: MediaFormat
    $genres: [String]
    $sort: [MediaSort]
  ) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { hasNextPage }
      media(
        type: ANIME
        search: $search
        seasonYear: $seasonYear
        season: $season
        format: $format
        genre_in: $genres
        sort: $sort
      ) {
        ${MEDIA_FIELDS}
      }
    }
  }
`

export const ANIME_BY_ID_QUERY = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      ${MEDIA_FIELDS}
      description(asHtml: true)
      relations {
        edges {
          relationType
          node { ${MEDIA_FIELDS} }
        }
      }
    }
  }
`
