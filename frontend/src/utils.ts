import { TimeEntry } from './store';

export function getTicketId(timeEntry: TimeEntry): number {
    return parseInt(timeEntry._links.workPackage.href.split('/').slice(-1)[0], 10);
}

export function uniqueByPropertyValue(array: any[], property: string) {
    const seen: any[] = [];
    const result: any[] = [];
    array.forEach((item) => {
        if (seen.indexOf(item[property]) === -1) {
            seen.push(item[property]);
            result.push(item);
        }
    });
    return result;
}

export function ptStringToNumber(ptString: string): number {
    if (!ptString) { return 0; }
    const regex = /[0-9]+[A-Z]/g;
    const matches = regex.exec(ptString);
    let numeric = 0;
    if (matches) {
        matches.forEach((match) => {
            if (match.endsWith('H')) {
                numeric += parseInt(match.replace('H', ''), 10);
            } else if (match.endsWith('M')) {
                numeric += parseInt(match.replace('M', ''), 10) / 60;
            }
        });
    }
    return numeric;
}

export function numberToPtString(ptNumber: number): string {
    return `PT${Math.floor(ptNumber)}H${Math.floor((ptNumber % 1) * 60)}M`;
}
