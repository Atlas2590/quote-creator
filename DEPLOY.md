# Guida Deploy - Sistema 54 Preventivi

## Requisiti Server (Debian 12)

```bash
# Installa Docker e Docker Compose
apt update && apt install -y docker.io docker-compose git curl
systemctl enable docker
systemctl start docker
```

## 1. Clone del Repository

```bash
cd /opt
git clone <URL_REPOSITORY> sistema-54-preventivi
cd sistema-54-preventivi
```

## 2. Configurazione Environment

Crea il file `.env` nella root del progetto:

```bash
cp .env.mongodb.example .env
nano .env
```

**Contenuto del file `.env`:**

```env
# MongoDB - CAMBIA QUESTE PASSWORD!
MONGO_USER=admin
MONGO_PASSWORD=TuaPasswordSicura123!

# Mongo Express UI (opzionale, per gestire MongoDB via web)
MONGO_EXPRESS_USER=admin
MONGO_EXPRESS_PASSWORD=TuaPasswordExpress456!

# URL API per il frontend
# IMPORTANTE: Cambia con l'IP o dominio del tuo server
API_URL=http://TUO_IP_SERVER:3001/api
```

### Esempio con IP reale:
```env
MONGO_USER=admin
MONGO_PASSWORD=MySecurePass2024!
MONGO_EXPRESS_USER=admin
MONGO_EXPRESS_PASSWORD=ExpressPass2024!
API_URL=http://192.168.1.100:3001/api
```

## 3. Avvio dei Container

```bash
# Build e avvio di tutti i servizi
docker-compose -f docker-compose.mongodb.yml up -d --build

# Verifica che tutti i container siano running
docker-compose -f docker-compose.mongodb.yml ps
```

Dovresti vedere 4 container:
- `preventivi-mongo` - Database MongoDB
- `preventivi-mongo-ui` - Interfaccia web MongoDB (opzionale)
- `preventivi-backend` - API Express.js
- `preventivi-app` - Frontend React

## 4. Verifica Funzionamento

```bash
# Test health del backend
curl http://localhost:3001/api/health

# Dovrebbe restituire:
# {"status":"ok","timestamp":"2024-..."}

# Test connessione MongoDB
docker exec preventivi-mongo mongosh --eval "db.adminCommand('ping')" -u admin -p TuaPasswordSicura123! --authenticationDatabase admin
```

## 5. Porte e Accessi

| Servizio | Porta | URL |
|----------|-------|-----|
| Frontend | 3000 | http://TUO_IP:3000 |
| Backend API | 3001 | http://TUO_IP:3001/api |
| Mongo Express | 8081 | http://TUO_IP:8081 |
| MongoDB | 27017 | mongodb://TUO_IP:27017 |

## 6. Upload Template Word (Opzionale)

Se hai un template Word per l'export dei preventivi:

```bash
curl -X POST http://localhost:3001/api/templates \
  -F "file=@/percorso/al/tuo/preventivo_template.docx" \
  -F "name=preventivo_template"
```

## Troubleshooting

### Il frontend non si connette al backend

1. **Verifica che API_URL sia corretto nel `.env`**
   - Deve essere raggiungibile dal browser dell'utente
   - NON usare `localhost` se accedi da un'altra macchina

2. **Rebuild dopo modifiche al `.env`:**
   ```bash
   docker-compose -f docker-compose.mongodb.yml down
   docker-compose -f docker-compose.mongodb.yml up -d --build
   ```

### MongoDB non parte

1. **Controlla i log:**
   ```bash
   docker-compose -f docker-compose.mongodb.yml logs mongo
   ```

2. **Verifica permessi volume:**
   ```bash
   docker volume ls
   docker volume inspect sistema-54-preventivi_mongo_data
   ```

### Backend errore connessione MongoDB

1. **Controlla i log del backend:**
   ```bash
   docker-compose -f docker-compose.mongodb.yml logs backend
   ```

2. **Verifica che MongoDB sia healthy:**
   ```bash
   docker-compose -f docker-compose.mongodb.yml ps
   ```
   Lo stato deve essere `healthy`, non `starting`.

### Reset completo (cancella tutti i dati!)

```bash
docker-compose -f docker-compose.mongodb.yml down -v
docker-compose -f docker-compose.mongodb.yml up -d --build
```

## Comandi Utili

```bash
# Ferma tutti i servizi
docker-compose -f docker-compose.mongodb.yml down

# Riavvia un singolo servizio
docker-compose -f docker-compose.mongodb.yml restart backend

# Vedi log in tempo reale
docker-compose -f docker-compose.mongodb.yml logs -f

# Vedi log solo del backend
docker-compose -f docker-compose.mongodb.yml logs -f backend

# Accedi alla shell MongoDB
docker exec -it preventivi-mongo mongosh -u admin -p TuaPasswordSicura123! --authenticationDatabase admin

# Backup database
docker exec preventivi-mongo mongodump --uri="mongodb://admin:TuaPasswordSicura123!@localhost:27017/preventivi?authSource=admin" --archive > backup_$(date +%Y%m%d).archive

# Restore database
cat backup_YYYYMMDD.archive | docker exec -i preventivi-mongo mongorestore --uri="mongodb://admin:TuaPasswordSicura123!@localhost:27017/preventivi?authSource=admin" --archive
```

## Struttura Docker Compose

```
┌─────────────────────────────────────────────────────┐
│                    Docker Network                    │
├─────────────┬─────────────┬─────────────┬───────────┤
│   Frontend  │   Backend   │   MongoDB   │ Mongo UI  │
│   (nginx)   │  (express)  │   (mongo)   │ (express) │
│   :3000     │   :3001     │   :27017    │  :8081    │
└─────────────┴──────┬──────┴──────┬──────┴───────────┘
                     │             │
                     └─────────────┘
                    Backend → MongoDB
```
