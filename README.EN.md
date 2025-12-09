# Time Recorder

> Time tracking system for small companies

# Index

-   [Description](#description)
-   [Getting Started](#getting-started)
-   [How It Works](#how-it-works)

# Description

System designed to manage employee time punches.

The system includes: - Clock-in - Clock-out - Start break - End break -
Overtime clock-in - Overtime clock-out - Automatic check-out at 23:59
for employees who forgot to punch out - User portal for editing
timestamps prior to the current day - Admin portal for daily editing of
all employee timestamps - Admin portal for editing timestamps after the
end of the month - Automatic sending of the CSV generated during the
month at 9:00 AM on the 1st of the following month

# Getting Started

## Dependencies

-   Node.js\
-   npm

## Install dependencies

    sudo apt update
    sudo apt install nodejs -y
    sudo apt install npm -y
    sudo apt install nginx -y

## Verification

    node -v
    npm -v

## Folder Structure

    /var/www/marcatempo
     ├── package.json
     ├── server.js
     ├── timbrature (created after the first punch)
     └── public
          ├── index.html
          ├── edit-timbrature.html
          ├── admin-timbrature.html
          ├── calcoloore.html

    /etc/nginx/site-available/
     └── marcatempo

    /etc/systemd/system/
     └── marcatempo.service

# Installation

    mkdir /var/www/marcatempo
    chown -R www-data:root /var/www/marcatempo/
    chmod -R 755 /var/www/marcatempo/
    cd /var/www/marcatempo
    npm install
    ln -s /etc/nginx/sites-available/marcatempo /etc/nginx/sites-enabled/
    systemctl enable nginx
    systemctl start nginx
    mv marcatempo.sevice /etc/systemd/system/
    systemctl daemon-reload
    systemctl enable marcatempo
    systemctl start marcatempo

## File Modifications

### server.js

    user: 'sendermail@gmail.com',
    pass: 'AppPassword' (for GMAIL you must generate an App Password)

    const RECIPIENT_EMAIL = 'receiver@gmail.com';

    line 506–525:
    Function for sending the file daily or monthly, currently set to monthly at 9:00 AM (daily sending is commented out)

### index.html

    const API_URL = 'http://SERVER_IP:3000/api';

    \ definition of users and associated PIN
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

### edit-timbrature.html

    const API_URL = 'http://SERVER_IP:3000/api';

    \ copy the list from index.html
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

    const ADMIN_PIN = '1234';

# How It Works

### index.html

The user selects their name and is prompted to enter their personal PIN.

If the user is "inactive", they are asked whether to register a normal
clock-in or select the overtime checkbox, then clock-in (the pop-up
disappears 1 second after punching).

Once the user checks in, their row changes color. Selecting their name
again will prompt for the PIN.

At this point, they may clock out or start a break.

### edit-timbrature.html

By accessing the edit portal, the user can enter their personal PIN and
view their timestamps.\
The desired month must be selected; all editable fields will be shown,
while grey fields are non-editable (already punched timestamps).\
If a timestamp exists for the current day, that row becomes non-editable
(it will be available the following day).

### admin-timbrature.html

Accessing the admin portal requires the admin PIN.\
Here, the administrator can edit all employee timestamps by selecting
only the month and the employee's name.

### calcoloore.html

Here you can upload the CSV file and immediately get the calculated work
hours.\
It is also possible to directly correct incorrect timestamps here.
