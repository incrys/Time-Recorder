# Time Recorder

> Time clock for small businesses

*Read this in other languages: [Italian](README.md).*

# Index

- [Description](#description)
- [Getting Started](#getting-started)
- [How It Works](#how-it-works)

# Description
System designed for managing employee clock-ins.

The system includes:
- Clock-in
- Clock-out
- Break start
- Break end
- Overtime clock-in
- Overtime clock-out
- Auto check-out for employees who forgot to clock out at 11:59 PM
- User portal for modifying times prior to the current day
- Admin portal for modifying all employee times
- Sending of the CSV generated during the month, on the 1st of the following month at 9:00 AM

# Getting Started

## Dependencies

- Node.js
- npm

## Installing Dependencies

```
sudo apt update
sudo apt install -y curl
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs
```

## Verification

```
node -v
npm -v
```

## Folder Structure

```
/var/www/timeclock
 ├── package.json
 ├── server.js
 ├── timbrature (will be created at the first clock-in)
 └── public
      ├── index.html
      ├── edit-timbrature.html
      ├── admin-timbrature.html

```

## File Modifications

*server.js*

```
user: 'sendermail@gmail.com',
pass: 'PasswordApp' (for GMAIL, an APP password needs to be generated)
```

```
const RECIPIENT_EMAIL = 'receiver@gmail.com';
```

```
lines 506-525
function for sending the file daily or once a month, currently once a month at 9:00 AM (daily sending is commented out)
```

*index.html*

```
const API_URL = 'http://SERVER_IP:3000/api';
```

```
\\ user definition and respective PIN
        const users = [
            { id: 1, name: 'User1', initials: 'U1', color: '#4169E1', pin: '1234' },
            { id: 2, name: 'User2', initials: 'U2', color: '#6f42c1', pin: '1234' },
            { id: 3, name: 'User3', initials: 'U3', color: '#82c91e', pin: '1234' },
            { id: 4, name: 'User4', initials: 'U4', color: '#1e88e5', pin: '1234' },
            { id: 5, name: 'User5', initials: 'U5', color: '#2e7d32', pin: '1234' },
            { id: 6, name: 'User6', initials: 'U6', color: '#ff9800', pin: '1234' },
            { id: 7, name: 'User7', initials: 'U7', color: '#1976d2', pin: '1234' },
            { id: 8, name: 'User8', initials: 'U8', color: '#00897b', pin: '1234' }
        ];
```

*edit-timbrature.html*

```
const API_URL = 'http://SERVER_IP:3000/api';
```

```
\\ it's sufficient to copy it from index.html
        const users = [
            { id: 1, name: 'User1', initials: 'U1', color: '#4169E1', pin: '1234' },
            { id: 2, name: 'User2', initials: 'U2', color: '#6f42c1', pin: '1234' },
            { id: 3, name: 'User3', initials: 'U3', color: '#82c91e', pin: '1234' },
            { id: 4, name: 'User4', initials: 'U4', color: '#1e88e5', pin: '1234' },
            { id: 5, name: 'User5', initials: 'U5', color: '#2e7d32', pin: '1234' },
            { id: 6, name: 'User6', initials: 'U6', color: '#ff9800', pin: '1234' },
            { id: 7, name: 'User7', initials: 'U7', color: '#1976d2', pin: '1234' },
            { id: 8, name: 'User8', initials: 'U8', color: '#00897b', pin: '1234' }
        ];
```

```
const API_URL = 'http://SERVER_IP:3000/api';
const ADMIN_PIN = '1234';
```


## How It Works

*index.html*

The user selects their name and is asked for their personal PIN

[img]

If the user is "inactive", it asks whether to clock in for regular hours or check the overtime box and then check-in (the pop-up will disappear 1 second after clocking in)

[img]

Once the user has checked in, their row will change color and selecting their name will again ask for the PIN

[img]

At this point it will be possible to either check-out or start a break

[img]

*edit-timbrature.html*

By connecting to the edit portal, it will be possible to enter your personal PIN and access your clock-ins.
You'll need to select the month of interest, all editable fields will be listed and those not editable (already made clock-ins) will be shown in gray. If a clock-in exists for the current date, the row will become non-editable (it will be available the next day)

[img]

*admin-timbrature.html*

By connecting to the admin portal, the administrator PIN will be requested.
Here it will be possible to edit all employee times regardless, by only selecting the month and employee name

[img]
