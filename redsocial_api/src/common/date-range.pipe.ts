import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

export interface DateRangeQuery {
  from?: string;
  to?: string;
}

export interface DateRange {
  from: Date;
  to: Date;
}

// Verifica que las fechas sean validas y les añade hora
@Injectable()
export class DateRangePipe implements PipeTransform<DateRangeQuery, DateRange> {
  transform(query: DateRangeQuery): DateRange {
    const from = this.toDate(query.from, '00:00:00');
    const to = this.toDate(query.to, '23:59:59');
    if (from > to) {
      throw new BadRequestException('La fecha desde no puede ser posterior a la fecha hasta');
    }
    return { from, to };
  }

  private toDate(value: string | undefined, time: string): Date {
    //convierte a GMT-3 
    const date = new Date(`${value}T${time}-03:00`);
    if (!value || isNaN(date.getTime())) {
      throw new BadRequestException('Las fechas desde y hasta son obligatorias');
    }
    return date;
  }
}
