import { TZDate } from '@date-fns/tz';
import { set, getHours, getMinutes, getSeconds, formatDate } from 'date-fns';

const TIMEZONE = 'Asia/Manila';

export function initializeHourTimeZone(date: Date, timeZone = TIMEZONE): Date {
    return set(new TZDate(new Date(), timeZone), {
        hours: getHours(date),
        minutes: getMinutes(date),
        seconds: getSeconds(date),
    });
}

export function initializeDateTimeZone(date: Date, timeZone = TIMEZONE): Date {
    const newDate = new TZDate(date, "Asia/Manila");

    return set(new TZDate(new Date(), timeZone), {
        year: newDate.getFullYear(),
        month: newDate.getMonth(),
        date: newDate.getDate(),
        hours: getHours(date),
        minutes: getMinutes(date),
        seconds: getSeconds(date),
    })
}

export function printDate(date: Date) {
    return formatDate(date, 'MMMM d, yyyy hh:mm:ss a');
}

export function returnFormatDate(date: Date) {
    return formatDate(date, 'MMMM d, yyyy hh:mm:ss a');
}