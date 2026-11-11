// los query params llegan como texto, PaginationPipe los pasa a número
export class PaginationDto {
  offset?: string;
  limit?: string;
  // formato "campo:asc|desc" separado por comas, ej: "likesCount:desc,createdAt:desc"
  sort?: string;
}
