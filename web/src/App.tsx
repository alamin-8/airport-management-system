import { useEffect, useMemo, useState } from 'react';

type Flight = {
  id: string;
  flightNumber: string;
  airline: string;
  origin: string;
  destination: string;
  scheduledDeparture: string;
  scheduledArrival: string;
  status: string;
  gate: string | null;
  aircraftType: string;
  terminal: string;
};

type DashboardData = {
  flights: Flight[];
  airports: Array<{ id: string; code: string; name: string; city: string; country: string }>;
  gates: Array<{ id: string; airportId: string; name: string; terminal: string; status: string }>;
  summary: {
    totalFlights: number;
    onTime: number;
    delayed: number;
    assignedGates: number;
  };
};

const initialLogin = { username: 'ops.admin', password: 'airport123' };

export default function App() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [login, setLogin] = useState(initialLogin);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [user, setUser] = useState('Operations Admin');
  const [flightForm, setFlightForm] = useState({
    flightNumber: 'AI-204',
    airline: 'Air India',
    originId: '',
    destinationId: '',
    scheduledDeparture: '2026-10-13T08:30',
    scheduledArrival: '2026-10-13T12:10',
    aircraftType: 'Boeing 787',
    terminal: 'T1',
    status: 'SCHEDULED'
  });

  const fetchDashboard = async () => {
    try {
      const response = await fetch('/api/dashboard');
      const data = await response.json();
      setDashboard(data);
    } catch (error) {
      console.error('Failed to load dashboard', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(login)
    });

    const result = await response.json();
    if (result.token) {
      setAuthToken(result.token);
      setUser(result.user.name);
    }
  };

  const handleCreateFlight = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!flightForm.originId || !flightForm.destinationId) return;

    await fetch('/api/flights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...flightForm,
        originAirportId: flightForm.originId,
        destinationAirportId: flightForm.destinationId
      })
    });

    setFlightForm({
      flightNumber: 'EK-512',
      airline: 'Emirates',
      originId: '',
      destinationId: '',
      scheduledDeparture: '2026-10-13T13:00',
      scheduledArrival: '2026-10-13T18:15',
      aircraftType: 'Airbus A380',
      terminal: 'T2',
      status: 'SCHEDULED'
    });
    fetchDashboard();
  };

  const summaryCards = useMemo(() => {
    if (!dashboard) return [];
    return [
      { label: 'Total Flights', value: dashboard.summary.totalFlights },
      { label: 'On Time', value: dashboard.summary.onTime },
      { label: 'Delayed', value: dashboard.summary.delayed },
      { label: 'Assigned Gates', value: dashboard.summary.assignedGates }
    ];
  }, [dashboard]);

  if (loading) {
    return <div className="loading">Loading airport operations center...</div>;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">✈️ AirportOps</div>
        <nav>
          <span className="nav active">Dashboard</span>
          <span className="nav">Flights</span>
          <span className="nav">Gates</span>
          <span className="nav">Staff</span>
        </nav>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <h1>Operations Dashboard</h1>
            <p>Live airport management overview</p>
          </div>
          <div className="user-panel">
            {!authToken ? (
              <form className="login-box" onSubmit={handleLogin}>
                <input
                  value={login.username}
                  onChange={(e) => setLogin({ ...login, username: e.target.value })}
                  placeholder="Username"
                />
                <input
                  type="password"
                  value={login.password}
                  onChange={(e) => setLogin({ ...login, password: e.target.value })}
                  placeholder="Password"
                />
                <button type="submit">Login</button>
              </form>
            ) : (
              <div className="user-badge">{user}</div>
            )}
          </div>
        </header>

        <section className="stats-grid">
          {summaryCards.map((card) => (
            <div key={card.label} className="stat-card">
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </div>
          ))}
        </section>

        <section className="content-grid">
          <div className="panel flight-panel">
            <div className="panel-header">
              <h2>Upcoming Flights</h2>
              <button onClick={() => fetchDashboard()}>Refresh</button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Flight</th>
                  <th>Route</th>
                  <th>Departure</th>
                  <th>Gate</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {dashboard?.flights.map((flight) => (
                  <tr key={flight.id}>
                    <td>{flight.flightNumber}</td>
                    <td>{flight.origin} → {flight.destination}</td>
                    <td>{new Date(flight.scheduledDeparture).toLocaleString()}</td>
                    <td>{flight.gate || 'Unassigned'}</td>
                    <td>
                      <span className={`status ${flight.status.toLowerCase()}`}>{flight.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="panel form-panel">
            <h2>Create Flight</h2>
            <form onSubmit={handleCreateFlight} className="flight-form">
              <input
                value={flightForm.flightNumber}
                placeholder="Flight Number"
                onChange={(e) => setFlightForm({ ...flightForm, flightNumber: e.target.value })}
              />
              <input
                value={flightForm.airline}
                placeholder="Airline"
                onChange={(e) => setFlightForm({ ...flightForm, airline: e.target.value })}
              />
              <select
                value={flightForm.originId}
                onChange={(e) => setFlightForm({ ...flightForm, originId: e.target.value })}
              >
                <option value="">Origin Airport</option>
                {dashboard?.airports.map((airport) => (
                  <option key={airport.id} value={airport.id}>{airport.code}</option>
                ))}
              </select>
              <select
                value={flightForm.destinationId}
                onChange={(e) => setFlightForm({ ...flightForm, destinationId: e.target.value })}
              >
                <option value="">Destination Airport</option>
                {dashboard?.airports.map((airport) => (
                  <option key={airport.id + '-dest'} value={airport.id}>{airport.code}</option>
                ))}
              </select>
              <input
                type="datetime-local"
                value={flightForm.scheduledDeparture}
                onChange={(e) => setFlightForm({ ...flightForm, scheduledDeparture: e.target.value })}
              />
              <input
                type="datetime-local"
                value={flightForm.scheduledArrival}
                onChange={(e) => setFlightForm({ ...flightForm, scheduledArrival: e.target.value })}
              />
              <input
                value={flightForm.aircraftType}
                placeholder="Aircraft Type"
                onChange={(e) => setFlightForm({ ...flightForm, aircraftType: e.target.value })}
              />
              <input
                value={flightForm.terminal}
                placeholder="Terminal"
                onChange={(e) => setFlightForm({ ...flightForm, terminal: e.target.value })}
              />
              <select
                value={flightForm.status}
                onChange={(e) => setFlightForm({ ...flightForm, status: e.target.value })}
              >
                <option value="SCHEDULED">Scheduled</option>
                <option value="ON_TIME">On Time</option>
                <option value="DELAYED">Delayed</option>
                <option value="ARRIVED">Arrived</option>
              </select>
              <button type="submit">Add Flight</button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
