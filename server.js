const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const nodemailer = require('nodemailer');
const cron = require('node-cron');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configurazione email
const EMAIL_CONFIG = {
    service: 'gmail',
    auth: {
        user: 'sendermail@gmail.com',
        pass: 'PasswordApp'
    }
};

const RECIPIENT_EMAIL = 'receiver@gmail.com';

// Crea directory per i CSV se non esiste
const CSV_DIR = path.join(__dirname, 'timbrature');

// Store per le sessioni attive degli utenti (in memoria)
const activeSessions = new Map();

async function ensureDirectoryExists() {
    try {
        await fs.access(CSV_DIR);
    } catch {
        await fs.mkdir(CSV_DIR, { recursive: true });
        console.log('&#x1F4C1; Directory timbrature creata');
    }
}

function getCSVFileName(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `timbrature_${year}_${month}.csv`;
}

function getCSVFilePath(date = new Date()) {
    return path.join(CSV_DIR, getCSVFileName(date));
}

function formatDate(date) {
    return new Intl.DateTimeFormat('it-IT', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).format(date);
}

function formatDuration(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getDateOnly(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDateForDisplay(date) {
    return new Intl.DateTimeFormat('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(date);
}

function getTimeOnly(date) {
    return new Intl.DateTimeFormat('it-IT', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).format(date);
}

async function readCSV(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf8');
        const lines = content.trim().split('\n');
        
        if (lines.length === 0) return { header: '', rows: [] };
        
        const header = lines[0];
        const rows = lines.slice(1).map(line => {
            const matches = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g);
            return matches ? matches.map(field => field.replace(/^"|"$/g, '')) : [];
        });
        
        return { header, rows };
    } catch (error) {
        return { header: '', rows: [] };
    }
}

async function writeCSV(filePath, header, rows) {
    try {
        let content = header + '\n';
        rows.forEach(row => {
            const csvLine = row.map(field => `"${field}"`).join(',') + '\n';
            content += csvLine;
        });
        await fs.writeFile(filePath, content, 'utf8');
        return true;
    } catch (error) {
        console.error('Errore scrittura CSV:', error);
        return false;
    }
}

async function appendToCSV(data) {
    const filePath = getCSVFilePath();
    const currentDate = new Date(data.timestamp);
    const dateOnly = getDateOnly(currentDate);
    const dateDisplay = formatDateForDisplay(currentDate);
    const timeOnly = getTimeOnly(currentDate);
    
    const header = 'Data,Nome Utente,Entry,Ingresso Ordinario,Uscita Ordinaria,Ingresso Straordinario,Uscita Straordinaria,Inizio Pausa,Fine Pausa,Tempo Lavoro Totale,Tempo Pausa Totale,Tipo';
    
    try {
        let { header: existingHeader, rows } = await readCSV(filePath);
        
        if (!existingHeader) {
            existingHeader = header;
            rows = [];
            console.log(`&#x1F4C4; Nuovo file CSV creato: ${getCSVFileName()}`);
        }
        
        const entryNumber = data.entryNumber || 1;
        const entryLabel = `#${entryNumber}`;
        
        const rowIndex = rows.findIndex(row => 
            row[0] === dateDisplay && row[1] === data.userName && row[2] === entryLabel
        );
        
        let row;
        if (rowIndex >= 0) {
            row = rows[rowIndex];
        } else {
            row = [
                dateDisplay, data.userName, entryLabel,
                '', '', '', '', '', '', '', '', ''
            ];
        }
        
        const isOvertime = data.isOvertime || false;
        
        switch(data.action) {
            case 'checkin':
                row[3] = timeOnly;
                row[11] = 'Ordinario';
                break;
                
            case 'checkout':
                row[4] = timeOnly;
                row[9] = formatDuration(data.totalWork || 0);
                row[10] = formatDuration(data.totalBreak || 0);
                break;
                
            case 'checkin_overtime':
                row[5] = timeOnly;
                row[11] = 'Straordinario';
                break;
                
            case 'checkout_overtime':
                row[6] = timeOnly;
                row[9] = formatDuration(data.totalWork || 0);
                row[10] = formatDuration(data.totalBreak || 0);
                break;
                
            case 'break_start':
                if (row[7]) {
                    row[7] += ` | ${timeOnly}`;
                } else {
                    row[7] = timeOnly;
                }
                break;
                
            case 'break_end':
                if (row[8]) {
                    row[8] += ` | ${timeOnly}`;
                } else {
                    row[8] = timeOnly;
                }
                row[10] = formatDuration(data.totalBreakAccumulated || data.breakDuration || 0);
                break;
        }
        
        if (rowIndex >= 0) {
            rows[rowIndex] = row;
        } else {
            rows.push(row);
        }
        
        rows.sort((a, b) => {
            const dateCompare = a[0].localeCompare(b[0]);
            if (dateCompare !== 0) return dateCompare;
            const nameCompare = a[1].localeCompare(b[1]);
            if (nameCompare !== 0) return nameCompare;
            return a[2].localeCompare(b[2]);
        });
        
        const success = await writeCSV(filePath, existingHeader, rows);
        
        if (success) {
            const actionNames = {
                'checkin': 'Ingresso',
                'checkout': 'Uscita',
                'checkin_overtime': 'Ingresso Straordinario',
                'checkout_overtime': 'Uscita Straordinario',
                'break_start': 'Inizio Pausa',
                'break_end': 'Fine Pausa'
            };
            console.log(`✔ Timbratura aggiornata: ${data.userName} - ${actionNames[data.action]} (Entry ${entryLabel}) alle ${timeOnly}`);
        }
        
        return success;
    } catch (error) {
        console.error('Errore aggiornamento CSV:', error);
        return false;
    }
}

// Funzione per auto check-out alle 23:59
async function performAutoCheckout() {
    console.log('&#x1F504; Esecuzione auto check-out per utenti ancora attivi...');
    
    const checkoutTime = new Date();
    checkoutTime.setHours(23, 59, 59);
    
    for (const [userId, session] of activeSessions.entries()) {
        console.log(`&#x23F0; Auto check-out per ${session.userName}`);
        
        const workDuration = Math.floor((checkoutTime - new Date(session.checkinTime)) / 1000) - session.totalBreakTime;
        const action = session.isOvertime ? 'checkout_overtime' : 'checkout';
        
        await appendToCSV({
            userId: session.userId,
            userName: session.userName,
            action: action,
            timestamp: checkoutTime.toISOString(),
            totalWork: workDuration,
            totalBreak: session.totalBreakTime,
            isOvertime: session.isOvertime,
            entryNumber: session.entryNumber
        });
        
        activeSessions.delete(userId);
    }
    
    console.log('&#x2705; Auto check-out completato');
}

async function sendDailyReport(requestedMonth = null) {
    try {
        const today = requestedMonth || new Date();
        const filePath = getCSVFilePath(today);
        
        try {
            await fs.access(filePath);
        } catch {
            console.log('&#x26A0; Nessun file CSV da inviare per il periodo richiesto');
            return { success: false, message: 'File non trovato' };
        }

        const transporter = nodemailer.createTransport(EMAIL_CONFIG);

        const fileName = getCSVFileName(today);
        const mailOptions = {
            from: EMAIL_CONFIG.auth.user,
            to: RECIPIENT_EMAIL,
            subject: `Report Timbrature - ${today.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}`,
            text: `In allegato il report delle timbrature del mese.\n\nFile: ${fileName}`,
            attachments: [
                {
                    filename: fileName,
                    path: filePath
                }
            ]
        };

        await transporter.sendMail(mailOptions);
        console.log(`&#x1F4E7; Email inviata con successo a ${RECIPIENT_EMAIL}`);
        return { success: true, message: 'Email inviata con successo' };
    } catch (error) {
        console.error('&#x274C; Errore invio email:', error);
        return { success: false, message: error.message };
    }
}

// API Routes

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/session/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    const session = activeSessions.get(userId);
    
    if (session) {
        res.json({ 
            active: true, 
            session: {
                ...session,
                checkinTime: session.checkinTime.toISOString(),
                breakStartTime: session.breakStartTime ? session.breakStartTime.toISOString() : null
            }
        });
    } else {
        res.json({ active: false });
    }
});

app.post('/api/timbratura', async (req, res) => {
    try {
        const { userId, userName, action } = req.body;
        
        switch (action) {
            case 'checkin':
            case 'checkin_overtime':
                const dateDisplay = formatDateForDisplay(new Date());
                const { rows } = await readCSV(getCSVFilePath());
                const entryCount = rows.filter(row => row[0] === dateDisplay && row[1] === userName).length;
                const nextEntryNumber = entryCount + 1;
                
                activeSessions.set(userId, {
                    userId,
                    userName,
                    checkinTime: new Date(),
                    breakStartTime: null,
                    totalBreakTime: 0,
                    isOnBreak: false,
                    isOvertime: action === 'checkin_overtime',
                    entryNumber: nextEntryNumber
                });
                
                req.body.entryNumber = nextEntryNumber;
                break;
                
            case 'checkout':
            case 'checkout_overtime':
                const session = activeSessions.get(userId);
                if (session) {
                    req.body.entryNumber = session.entryNumber;
                }
                activeSessions.delete(userId);
                break;
                
            case 'break_start':
                const sessionBreakStart = activeSessions.get(userId);
                if (sessionBreakStart) {
                    sessionBreakStart.breakStartTime = new Date();
                    sessionBreakStart.isOnBreak = true;
                    req.body.entryNumber = sessionBreakStart.entryNumber;
                }
                break;
                
            case 'break_end':
                const sessionBreakEnd = activeSessions.get(userId);
                if (sessionBreakEnd && sessionBreakEnd.breakStartTime) {
                    const breakDuration = Math.floor((new Date() - sessionBreakEnd.breakStartTime) / 1000);
                    sessionBreakEnd.totalBreakTime += breakDuration;
                    sessionBreakEnd.breakStartTime = null;
                    sessionBreakEnd.isOnBreak = false;
                    req.body.entryNumber = sessionBreakEnd.entryNumber;
                }
                break;
        }
        
        const success = await appendToCSV(req.body);
        if (success) {
            res.json({ success: true, message: 'Timbratura registrata' });
        } else {
            res.status(500).json({ success: false, message: 'Errore nel salvataggio' });
        }
    } catch (error) {
        console.error('Errore API timbratura:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/active-users', (req, res) => {
    const activeUsers = Array.from(activeSessions.values()).map(session => ({
        userId: session.userId,
        userName: session.userName,
        checkinTime: session.checkinTime.toISOString(),
        isOnBreak: session.isOnBreak,
        isOvertime: session.isOvertime || false
    }));
    
    res.json({ activeUsers });
});

app.get('/api/report/:year/:month', async (req, res) => {
    try {
        const { year, month } = req.params;
        const date = new Date(year, month - 1);
        const filePath = getCSVFilePath(date);
        
        const data = await fs.readFile(filePath, 'utf8');
        res.type('text/csv');
        res.send(data);
    } catch (error) {
        res.status(404).json({ error: 'File non trovato' });
    }
});

app.post('/api/send-report', async (req, res) => {
    try {
        const result = await sendDailyReport();
        if (result.success) {
            res.json({ success: true, message: result.message });
        } else {
            res.status(500).json({ success: false, message: result.message });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/update-timbrature', async (req, res) => {
    try {
        const { year, month, data, userId, userName, isAdmin } = req.body;
        
        // Se non è admin, verifica che stia modificando solo le proprie righe
        if (!isAdmin) {
            const userRows = data.filter(row => row['Nome Utente'] === userName);
            if (userRows.length === 0) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Non hai permessi per modificare queste timbrature' 
                });
            }
        }

        const date = new Date(year, month - 1);
        const filePath = getCSVFilePath(date);
        
        const header = 'Data,Nome Utente,Entry,Ingresso Ordinario,Uscita Ordinaria,Ingresso Straordinario,Uscita Straordinaria,Inizio Pausa,Fine Pausa,Tempo Lavoro Totale,Tempo Pausa Totale,Tipo';
        
        const rows = data.map(row => [
            row['Data'],
            row['Nome Utente'],
            row['Entry'],
            row['Ingresso Ordinario'],
            row['Uscita Ordinaria'],
            row['Ingresso Straordinario'],
            row['Uscita Straordinaria'],
            row['Inizio Pausa'],
            row['Fine Pausa'],
            row['Tempo Lavoro Totale'],
            row['Tempo Pausa Totale'],
            row['Tipo']
        ]);
        
        const success = await writeCSV(filePath, header, rows);
        
        if (success) {
            const userType = isAdmin ? 'ADMIN' : userName;
            console.log(`&#x270F; Timbrature aggiornate da ${userType} (User ID: ${userId}) per ${month}/${year}`);
            res.json({ 
                success: true, 
                message: 'Timbrature aggiornate con successo' 
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: 'Errore nel salvataggio del file' 
            });
        }
    } catch (error) {
        console.error('Errore aggiornamento timbrature:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// Auto check-out alle 23:59
cron.schedule('59 23 * * *', () => {
    console.log('&#x1F55A; 23:59 - Esecuzione auto check-out...');
    performAutoCheckout();
}, {
    timezone: "Europe/Rome"
});

//Invio email il primo giorno del mese alle 9:00

cron.schedule('0 9 1 * *', () => {
    console.log('&#x1F55A; 9:00 - Invio report mensile...');
    
    // Calcola il mese precedente
    const now = new Date();
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    sendDailyReport(previousMonth);
}, {
    timezone: "Europe/Rome"
});

// Invio email alle 23:00
//cron.schedule('0 23 * * *', () => {
//    console.log('&#x1F55A; 23:00 - Invio report giornaliero...');
//    sendDailyReport();
//}, {
//    timezone: "Europe/Rome"
//});

// Log delle sessioni attive ogni 5 minuti
setInterval(() => {
    if (activeSessions.size > 0) {
        console.log(`&#x1F4CA; Utenti attualmente in servizio: ${activeSessions.size}`);
        activeSessions.forEach((session, userId) => {
            const elapsed = Math.floor((new Date() - session.checkinTime) / 1000);
            const status = session.isOnBreak ? '☕ In pausa' : '✓ Attivo';
            const mode = session.isOvertime ? ' (Straordinario)' : '';
            console.log(`   - ${session.userName}: ${status} Entry #${session.entryNumber}${mode} (${Math.floor(elapsed/60)}min)`);
        });
    }
}, 5 * 60 * 1000);

async function startServer() {
    await ensureDirectoryExists();
    
    app.listen(PORT, () => {
        console.log('╔═════════════════════════════════════════════════╗');
        console.log('║       🚀 Server Tibrature v5 ULTIMATE!          ║');
        console.log('╠═════════════════════════════════════════════════╣');
        console.log(`║   &#x1F310; URL: http://localhost:${PORT}              ║`);
        console.log(`║   &#x1F4C1; CSV salvati in: ${CSV_DIR.padEnd(20)}      ║`);
        console.log('║   &#x1F4E7; Email programmata: 9:00 il 1° del mese       ║');
        console.log('║   &#x23F0; Auto check-out: 23:59 ogni giorno          ║');
        console.log(`║   &#x1F4EC; Destinatario: ${RECIPIENT_EMAIL.padEnd(24)}║`);
        console.log('║   &#x1F465; Multi-utente + Multi-entry                 ║');
        console.log('║   &#x23F0; Supporto straordinari attivo               ║');
        console.log('║   &#x1F510; Portale Admin disponibile                  ║');
        console.log('╚═════════════════════════════════════════════════╝');
    });
}

startServer();
