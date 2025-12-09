# Marcatempo

> Marcatempo per piccole aziende

*Read this in other languages: [English](README.EN.md).*

# Indice

- [Descrizione](#descrizione)
- [Come iniziare](#come-iniziare)
- [Funzionamento](#funzionamento)

# Descrizione
Sistema studiato per la gestione delle timbrature dei dipendenti.

Il sistema prevede:
- Ingresso
- Uscita
- Inizio pausa
- Fine pausa
- Ingresso straordinario
- Uscita straordinario
- Auto check-out dei dipendenti che hanno dimenticato di timbrare l'uscita alle 23:59
- Portale utente per la modifica degli orari precedenti la giornata corrente
- Portale admin per la modifica giornaliera di tutti gli orari dei dipendenti
- Portale admin per la modifica degli orari dopo la fine del mese
- Invio del CSV generato durante il mese, il 1° del mese successivo alle 9:00

# Come iniziare

## Dipendenze

- Node.js
- npm

## Installare le dipendenze

```
sudo apt update
sudo apt install nodejs -y
sudo apt install npm -y
sudo apt install nginx -y
```

## Verifica

```
node -v
npm -v
```

## Stuttura delle cartelle

```
/var/www/marcatempo
 ├── package.json
 ├── server.js
 ├── timbrature (verrà creata alla prima timbratura creata)
 └── public
      ├── index.html
      ├── edit-timbrature.html
      ├── admin-timbrature.html
      ├── calcoloore.html

/etc/nginx/site-available/
 └──marcatempo

/etc/systemd/system/
 └──marcatempo.service

```

# Installazione

```
mkdir  /var/www/marcatempo
chown -R www-data:root /var/www/marcatempo/
chmod -R 755 /var/www/marcatempo/
cd  /var/www/marcatempo
npm install
ln -s /etc/nginx/sites-available/marcatempo /etc/nginx/sites-enabled/
systemctl enable nginx
systemctl start nginx
mv marcatempo.sevice /etc/systemd/system/
systemctl daemon-reload
systemctl enable marcatempo
systemctl start marcatempo
```

## Modifica dei file

*server.js*

```
user: 'sendermail@gmail.com',
pass: 'PasswordApp' (per GMAIL occorre generare una password APP)
```

```
const RECIPIENT_EMAIL = 'receiver@gmail.com';
```

```
riga 506-525
funzione per l'invio del file giornalmente o una volta al mese, attualmente una volta al mese alle 9:00 (l'invio giornaliero è commentato)
```

*index.html*

```
const API_URL = 'http://IP_SERVER:3000/api';
```

```
\\ definizione degli utenti e relativo PIN
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
const API_URL = 'http://IP_SERVER:3000/api';
```

```
\\ è sufficiente ricopiarlo da index.html
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
const API_URL = 'http://IP_SERVER:3000/api';
const ADMIN_PIN = '1234';
```


## Funzionamento 

*index.html*

L'utente seleziona il proprio nominativo e viene richiesto il proprio PIN personale

![alt text](https://github.com/incrys/Time-Recorder/blob/main/marcatempoIMG/1.png?raw=true)
![alt text](https://github.com/incrys/Time-Recorder/blob/main/marcatempoIMG/2.png?raw=true)

Se l'utente risulta "inattivo", richiede se timbrare l'ingresso ordinario o spuntare la casella straordinario e successivamente il check-in (il pop-up scomparirà dopo 1 secondo dalla timbratura)

![alt text](https://github.com/incrys/Time-Recorder/blob/main/marcatempoIMG/3.png?raw=true)

Una volta che l'utente ha effettuato un check-in, la sua riga cambierà colore e selezionando il suo nome chiederà nuovamente il PIN

![alt text](https://github.com/incrys/Time-Recorder/blob/main/marcatempoIMG/4.png?raw=true)

A questo punto sarà possibile effettuare o il check-out oppure l'inizio della pausa

![alt text](https://github.com/incrys/Time-Recorder/blob/main/marcatempoIMG/5.png?raw=true)

*edit-timbrature.html*

Collegandosi al portale di edit sarà possibile inserire il proprio pin personale e accedere alle proprie timbrature.
Ci sarà da selezionare il mese interessato, verranno listati tutti i campi editabili e in grigio quelli non editabili (timbrature già effettuate). Qualora esista una timbratura alla data corrente, la riga diverrà non editabile (sarà disponibile il giorno successivo)

![alt text](https://github.com/incrys/Time-Recorder/blob/main/marcatempoIMG/6.png?raw=true)
![alt text](https://github.com/incrys/Time-Recorder/blob/main/marcatempoIMG/7.png?raw=true)
![alt text](https://github.com/incrys/Time-Recorder/blob/main/marcatempoIMG/8.png?raw=true)

*admin-timbrature.html*

Collegandosi al portale admin, verrà richiesto il PIN dell'amministratore.
Qui sarà possibile editare tutti gli orari dei dipendenti indifferentemente, selezionando solo mese e nome dipendente

![alt text](https://github.com/incrys/Time-Recorder/blob/main/marcatempoIMG/9.png?raw=true)
![alt text](https://github.com/incrys/Time-Recorder/blob/main/marcatempoIMG/10.png?raw=true)

*calcoloore.html*

Qui è possibile importare il CSV ed avere il calcolo immediato delle ore effettuate. Sarà inoltre possibile modificare direttamente qui gli orari "errati" ed esportare un nuovo CSV con le modifiche effettuate.
N.B. l'orario per essere aggiornato correttamente, occorre che venga inserito come HH:MM:SS

![alt text](https://github.com/incrys/Time-Recorder/blob/main/marcatempoIMG/11.png?raw=true)
