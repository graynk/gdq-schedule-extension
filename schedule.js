const MONTHS = {
    'January': 0,
    'February': 1,
    'March': 2,
    'April': 3,
    'May': 4,
    'June': 5,
    'July': 6,
    'August': 7,
    'September': 8,
    'October': 9,
    'November': 10,
    'December': 11,
};

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const HIDE_FINISHED = 'hideFinished';
const DAY_SPLIT = 'day-split';
const START_TIME = 'start-time';

class Duration {
    constructor(duration) {
        const split = duration.split(':');
        if (split.length < 3) {
            return null;
        }
        const hours = Number(split[0]);
        const minutes = Number(split[1]);
        const seconds = Number(split[2]);
        if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
            return null;
        }
        this.hours = hours * HOUR;
        this.minutes = minutes *  MINUTE;
        this.seconds = seconds * SECOND;
    }
}

function parseDate(dateStr) {
    const split = dateStr.split(' ')
    if (split.length < 3) {
        return null;
    }

    const day = parseInt(split[2]);
    if (isNaN(day) || day < 1 || day > 31) {
        return null;
    }

    const month = MONTHS[split[1]];
    if (month === undefined) {
        return null;
    }

    const date = new Date();
    date.setMonth(month, day);

    return date;
}

function parseTime(date, time) {
    const split = time.split(' ');
    if (split.length < 2) {
        return null;
    }

    const hoursMinutes = split[0].split(':');
    if (hoursMinutes.length < 2) {
        return null;
    }

    let hours = Number(hoursMinutes[0]);
    const minutes = Number(hoursMinutes[1]);
    if (isNaN(hours) || isNaN(minutes)) {
        return null;
    }

    if (split[1] === 'PM' && hours !== 12) {
        hours += 12;
    }

    date.setHours(hours, minutes);
    return date;
}

function addDuration(datetime, duration) {
    return new Date(datetime.getTime() + duration.hours + duration.minutes + duration.seconds);
}

async function main() {
    if (window.hasRun) {
        return;
    }
    window.hasRun = true;

    const table = document.getElementById('runTable');
    if (table === null) {
        return;
    }
    const header = table.querySelector('thead');
    const body = table.querySelector('tbody');

    if (header === null || body === null) {
        return;
    }

    const headerNameCell = header.querySelector('tr').children[1];
    if (headerNameCell === null) {
        return;
    }

    const switcher = document.createElement('input');
    switcher.name = 'Hide done';
    switcher.type = 'checkbox';
    switcher.checked = localStorage.getItem(HIDE_FINISHED) !== 'false';

    function switchListener() {
        localStorage.setItem(HIDE_FINISHED, switcher.checked.toString())
        const isVisible = !switcher.checked;
        let currentDateTime = null;
        const now = new Date();
        const nowDate = new Date();
        nowDate.setHours(0, 0, 0, 0);
        for (const row of body.children) {
            if (row.className === DAY_SPLIT) {
                currentDateTime = parseDate(row.textContent);
                continue;
            }
            if (currentDateTime === null) {
                // shouldn't happen
                break;
            }
            if (currentDateTime < nowDate) {
                const nextHeader = row.nextElementSibling;
                const nextBottom = row.nextElementSibling.nextElementSibling;
                const isLastRunOfheDay = nextHeader.className === DAY_SPLIT || nextBottom.className === DAY_SPLIT;
                if (!isLastRunOfheDay) {
                    row.style.visibility = isVisible ? 'visible' : 'collapse';
                    continue;
                }
            }
            if (row.children[0].classList[0] === START_TIME) {
                currentDateTime = parseTime(currentDateTime, row.children[0].textContent);
                const duration = new Duration(row.nextElementSibling.children[0].textContent);
                if (currentDateTime === null || duration === null) {
                    // shouldn't happen
                    break;
                }
                currentDateTime = addDuration(currentDateTime, duration);
            }
            if (currentDateTime < now) {
                row.style.visibility = isVisible ? 'visible' : 'collapse';
                continue
            }
            break;
        }
    }

    switcher.addEventListener('change', switchListener);
    headerNameCell.textContent += ' | Hide finished runs: ';
    headerNameCell.appendChild(switcher);
    let count = 0;
    while (body.firstElementChild.className !== DAY_SPLIT) {
        if (count > 100) {
            // give up
            return;
        }
        await new Promise(resolve => setTimeout(resolve, 10));
        count++;
    }
    switchListener();
}

main();