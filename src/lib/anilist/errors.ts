export class AniListError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'AniListError'
    this.status = status
  }
}
