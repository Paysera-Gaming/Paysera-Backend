import { set, getHours, getMinutes } from 'date-fns';
import { toZonedTime } from "date-fns-tz";

const TIMEZONE = 'Asia/Manila';

export function initializeDateTimeZone(date: Date, timeZone = TIMEZONE): Date {
    return set(toZonedTime(new Date(), timeZone), {
        hours: getHours(date),
        minutes: getMinutes(date),
        seconds: 0,
        milliseconds: 0,
    });
}

export function createDateZoneFromHours(hours: number, timeZone = TIMEZONE): Date {
    return set(toZonedTime(new Date(), timeZone), {
        hours,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
    });
}