import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'airport.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

export type AirportRow = {
  id: string;
  code: string;
  name: string;
  city: string;
  country: string;
};

export type GateRow = {
  id: string;
  airportId: string;
  name: string;
  terminal: string;
  status: string;
};

export type FlightRow = {
  id: string;
  flightNumber: string;
  airline: string;
  originAirportId: string;
  destinationAirportId: string;
  scheduledDeparture: string;
  scheduledArrival: string;
  status: string;
  gateId: string | null;
  aircraftType: string;
  terminal: string;
};

export function createDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS airports (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      city TEXT,
      country TEXT
    );

    CREATE TABLE IF NOT EXISTS gates (
      id TEXT PRIMARY KEY,
      airport_id TEXT NOT NULL,
      name TEXT NOT NULL,
      terminal TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'AVAILABLE',
      FOREIGN KEY (airport_id) REFERENCES airports(id)
    );

    CREATE TABLE IF NOT EXISTS flights (
      id TEXT PRIMARY KEY,
      flight_number TEXT NOT NULL,
      airline TEXT NOT NULL,
      origin_airport_id TEXT NOT NULL,
      destination_airport_id TEXT NOT NULL,
      scheduled_departure TEXT NOT NULL,
      scheduled_arrival TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'SCHEDULED',
      gate_id TEXT,
      aircraft_type TEXT NOT NULL,
      terminal TEXT NOT NULL,
      FOREIGN KEY (origin_airport_id) REFERENCES airports(id),
      FOREIGN KEY (destination_airport_id) REFERENCES airports(id),
      FOREIGN KEY (gate_id) REFERENCES gates(id)
    );
  `);
}

export function seedDatabase() {
  const airportsCount = db.prepare('SELECT COUNT(*) as count FROM airports').get() as { count: number };
  if (airportsCount.count > 0) {
    return;
  }

  const airports = [
    { id: 'a1', code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'USA' },
    { id: 'a2', code: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'UAE' },
    { id: 'a3', code: 'LHR', name: 'Heathrow Airport', city: 'London', country: 'UK' }
  ];

  const insertAirport = db.prepare(
    'INSERT INTO airports (id, code, name, city, country) VALUES (@id, @code, @name, @city, @country)'
  );

  for (const airport of airports) {
    insertAirport.run(airport);
  }

  const gates = [
    { id: 'g1', airportId: 'a1', name: 'A1', terminal: 'Terminal 1', status: 'AVAILABLE' },
    { id: 'g2', airportId: 'a1', name: 'A2', terminal: 'Terminal 1', status: 'ASSIGNED' },
    { id: 'g3', airportId: 'a2', name: 'B5', terminal: 'Terminal 2', status: 'AVAILABLE' },
    { id: 'g4', airportId: 'a3', name: 'C12', terminal: 'Terminal 3', status: 'AVAILABLE' }
  ];

  const insertGate = db.prepare(
    'INSERT INTO gates (id, airport_id, name, terminal, status) VALUES (@id, @airportId, @name, @terminal, @status)'
  );

  for (const gate of gates) {
    insertGate.run(gate);
  }

  const flights = [
    {
      id: 'f1',
      flightNumber: 'BA-287',
      airline: 'British Airways',
      originAirportId: 'a3',
      destinationAirportId: 'a1',
      scheduledDeparture: '2026-10-13T09:00:00.000Z',
      scheduledArrival: '2026-10-13T12:30:00.000Z',
      status: 'ON_TIME',
      gateId: 'g2',
      aircraftType: 'Airbus A320',
      terminal: 'T1'
    },
    {
      id: 'f2',
      flightNumber: 'EK-211',
      airline: 'Emirates',
      originAirportId: 'a2',
      destinationAirportId: 'a1',
      scheduledDeparture: '2026-10-13T11:15:00.000Z',
      scheduledArrival: '2026-10-13T16:00:00.000Z',
      status: 'DELAYED',
      gateId: null,
      aircraftType: 'Boeing 777',
      terminal: 'T2'
    },
    {
      id: 'f3',
      flightNumber: 'AA-412',
      airline: 'American Airlines',
      originAirportId: 'a1',
      destinationAirportId: 'a3',
      scheduledDeparture: '2026-10-13T14:40:00.000Z',
      scheduledArrival: '2026-10-13T21:20:00.000Z',
      status: 'SCHEDULED',
      gateId: null,
      aircraftType: 'Boeing 787',
      terminal: 'T4'
    }
  ];

  const insertFlight = db.prepare(
    'INSERT INTO flights (id, flight_number, airline, origin_airport_id, destination_airport_id, scheduled_departure, scheduled_arrival, status, gate_id, aircraft_type, terminal) VALUES (@id, @flightNumber, @airline, @originAirportId, @destinationAirportId, @scheduledDeparture, @scheduledArrival, @status, @gateId, @aircraftType, @terminal)'
  );

  for (const flight of flights) {
    insertFlight.run(flight);
  }
}

export function listAirports() {
  return db.prepare('SELECT * FROM airports ORDER BY code ASC').all() as AirportRow[];
}

export function listGates() {
  return db.prepare('SELECT * FROM gates ORDER BY airport_id, terminal, name ASC').all() as GateRow[];
}

export function listFlights() {
  const rows = db
    .prepare(
      `
      SELECT f.*, a1.code as origin_code, a2.code as destination_code, g.name as gate_name
      FROM flights f
      LEFT JOIN airports a1 ON a1.id = f.origin_airport_id
      LEFT JOIN airports a2 ON a2.id = f.destination_airport_id
      LEFT JOIN gates g ON g.id = f.gate_id
      ORDER BY f.scheduled_departure ASC
      `
    )
    .all() as Array<FlightRow & { origin_code: string; destination_code: string; gate_name: string | null }>;

  return rows.map((row) => ({
    id: row.id,
    flightNumber: row.flight_number,
    airline: row.airline,
    origin: row.origin_code,
    destination: row.destination_code,
    scheduledDeparture: row.scheduled_departure,
    scheduledArrival: row.scheduled_arrival,
    status: row.status,
    gate: row.gate_name,
    aircraftType: row.aircraft_type,
    terminal: row.terminal
  }));
}

export function createFlight(input: {
  id: string;
  flightNumber: string;
  airline: string;
  originAirportId: string;
  destinationAirportId: string;
  scheduledDeparture: string;
  scheduledArrival: string;
  status: string;
  gateId: string | null;
  aircraftType: string;
  terminal: string;
}) {
  const stmt = db.prepare(
    `INSERT INTO flights (id, flight_number, airline, origin_airport_id, destination_airport_id, scheduled_departure, scheduled_arrival, status, gate_id, aircraft_type, terminal)
     VALUES (@id, @flightNumber, @airline, @originAirportId, @destinationAirportId, @scheduledDeparture, @scheduledArrival, @status, @gateId, @aircraftType, @terminal)`
  );

  stmt.run(input);
  return listFlights().find((flight) => flight.id === input.id) ?? input;
}

export function createAirport(input: { id: string; code: string; name: string; city: string; country: string }) {
  const stmt = db.prepare(
    'INSERT INTO airports (id, code, name, city, country) VALUES (@id, @code, @name, @city, @country)'
  );
  stmt.run(input);
  return input;
}

export function createGate(input: { id: string; airportId: string; name: string; terminal: string; status: string }) {
  const stmt = db.prepare(
    'INSERT INTO gates (id, airport_id, name, terminal, status) VALUES (@id, @airportId, @name, @terminal, @status)'
  );
  stmt.run(input);
  return input;
}

export function assignGate(flightId: string, gateId: string) {
  const flight = db.prepare('SELECT * FROM flights WHERE id = ?').get(flightId) as FlightRow | undefined;
  if (!flight) return null;

  db.prepare('UPDATE flights SET gate_id = ? WHERE id = ?').run(gateId, flightId);
  return listFlights().find((f) => f.id === flightId) ?? null;
}

export function loginUser(username: string, password: string) {
  const knownUsername = 'ops.admin';
  const knownPassword = 'airport123';

  if (username === knownUsername && password === knownPassword) {
    return { id: 'u1', name: 'Operations Admin', username, role: 'ADMIN' };
  }

  return null;
}

export function getDashboardData() {
  const flights = listFlights();
  const airports = listAirports();
  const gates = listGates();

  const summary = {
    totalFlights: flights.length,
    onTime: flights.filter((flight) => flight.status === 'ON_TIME').length,
    delayed: flights.filter((flight) => flight.status === 'DELAYED').length,
    assignedGates: flights.filter((flight) => flight.gate).length
  };

  return {
    flights,
    airports,
    gates,
    summary
  };
}
