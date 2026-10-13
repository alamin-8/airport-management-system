import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { createDB, seedDatabase, listAirports, listGates, listFlights, createFlight, assignGate, createAirport, createGate, getDashboardData, loginUser } from './db';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(cors());
app.use(express.json());

createDB();
seedDatabase();

const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6)
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'airport-management-system', time: new Date().toISOString() });
});

app.post('/api/auth/login', (req, res) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid credentials format.' });
  }

  const result = loginUser(parsed.data.username, parsed.data.password);
  if (!result) {
    return res.status(401).json({ message: 'Invalid username or password.' });
  }

  res.json({ token: 'demo-jwt-token', user: result });
});

app.get('/api/airports', (_req, res) => {
  res.json(listAirports());
});

app.post('/api/airports', (req, res) => {
  const airport = createAirport({
    id: randomUUID(),
    code: req.body.code,
    name: req.body.name,
    city: req.body.city,
    country: req.body.country
  });

  res.status(201).json(airport);
});

app.get('/api/gates', (_req, res) => {
  res.json(listGates());
});

app.post('/api/gates', (req, res) => {
  const gate = createGate({
    id: randomUUID(),
    airportId: req.body.airportId,
    name: req.body.name,
    terminal: req.body.terminal,
    status: req.body.status ?? 'AVAILABLE'
  });

  res.status(201).json(gate);
});

app.get('/api/flights', (_req, res) => {
  res.json(listFlights());
});

app.post('/api/flights', (req, res) => {
  const flight = createFlight({
    id: randomUUID(),
    flightNumber: req.body.flightNumber,
    airline: req.body.airline,
    originAirportId: req.body.originAirportId,
    destinationAirportId: req.body.destinationAirportId,
    scheduledDeparture: req.body.scheduledDeparture,
    scheduledArrival: req.body.scheduledArrival,
    status: req.body.status ?? 'SCHEDULED',
    gateId: req.body.gateId ?? null,
    aircraftType: req.body.aircraftType ?? 'Unknown',
    terminal: req.body.terminal ?? 'T1'
  });

  res.status(201).json(flight);
});

app.post('/api/flights/:id/assign-gate', (req, res) => {
  const flight = assignGate(req.params.id, req.body.gateId);
  if (!flight) {
    return res.status(404).json({ message: 'Flight not found.' });
  }

  res.json(flight);
});

app.get('/api/dashboard', (_req, res) => {
  const data = getDashboardData();
  res.json(data);
});

app.listen(port, () => {
  console.log(`Airport management API listening on http://localhost:${port}`);
});
