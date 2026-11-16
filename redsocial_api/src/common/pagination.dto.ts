// los query params llegan como texto, PaginationPipe los pasa a número
export class PaginationDto {
  offset?: string;
  limit?: string;
}
