const pageConfig = {
  overview: { title: 'Overview', heading: 'Good morning, Jordan', subtitle: "Here’s what’s happening across your shipments today.", table: 'Recent shipments', description: 'Keep an eye on every parcel, from pickup to delivery.', endpoint: '/api/shipments', search: 'Search shipments...', empty: 'No shipments yet', columns: [['id', 'Shipment'], ['customer_id', 'Customer'], ['route', 'Route'], ['status', 'Status'], ['created_at', 'Created']] },
  shipments: { title: 'Shipments', heading: 'Shipments, at a glance', subtitle: 'Every parcel, from pickup to its final destination.', table: 'All shipments', description: 'Search and follow the progress of every shipment.', endpoint: '/api/shipments', search: 'Search shipments...', empty: 'No shipments yet', columns: [['id', 'Shipment'], ['customer_id', 'Customer'], ['route', 'Route'], ['status', 'Status'], ['created_at', 'Created']] },
  deliveries: { title: 'Deliveries', heading: 'Delivery operations', subtitle: 'Assignments and handoffs, all in one place.', table: 'All deliveries', description: 'Review the latest driver and vehicle assignments.', endpoint: '/api/deliveries', search: 'Search deliveries...', empty: 'No deliveries yet', columns: [['id', 'Delivery'], ['shipment_id', 'Shipment'], ['driver_id', 'Driver'], ['vehicle_id', 'Vehicle'], ['status', 'Status'], ['pickup_time', 'Pickup']] },
  customers: { title: 'Customers', heading: 'Your customers', subtitle: 'The people and businesses behind every delivery.', table: 'Customer directory', description: 'Customer accounts registered in your workspace.', endpoint: '/api/users', search: 'Search customers...', empty: 'No customers found', columns: [['id', 'Customer'], ['full_name', 'Name'], ['email', 'Email'], ['phone', 'Phone'], ['role', 'Role']] },
  drivers: { title: 'Drivers', heading: 'Meet your drivers', subtitle: 'Your trusted team keeps every delivery moving.', table: 'Driver directory', description: 'Drivers registered in your workspace.', endpoint: '/api/drivers', search: 'Search drivers...', empty: 'No drivers found', columns: [['id', 'Driver'], ['user_id', 'User'], ['license_number', 'License'], ['created_at', 'Registered']] },
  vehicles: { title: 'Vehicles', heading: 'Your fleet', subtitle: 'A clear view of the vehicles on the road.', table: 'Fleet overview', description: 'Vehicles registered in your workspace.', endpoint: '/api/vehicles', search: 'Search vehicles...', empty: 'No vehicles found', columns: [['id', 'Vehicle'], ['plate_number', 'Plate'], ['type', 'Type'], ['capacity', 'Capacity']] },
  invoices: { title: 'Invoices', heading: 'Billing overview', subtitle: 'Keep shipment billing organized and up to date.', table: 'Recent invoices', description: 'Invoices associated with your shipments.', endpoint: '/api/invoices', search: 'Search invoices...', empty: 'No invoices yet', columns: [['id', 'Invoice'], ['shipment_id', 'Shipment'], ['amount', 'Amount'], ['payment_status', 'Payment'], ['created_at', 'Created']] },
  tracking: { title: 'Tracking', heading: 'Track a shipment', subtitle: 'Tracking events are organized by shipment.', table: 'Shipment tracking', description: 'Enter a shipment ID to see its tracking history.', endpoint: null, search: 'Search tracking events...', empty: 'Select a shipment to get started', columns: [['event_time', 'Time'], ['location', 'Location'], ['status', 'Status']] }
};

const state = { page: 'overview', data: [], shipments: [], statusFilter: 'all', search: '', toastTimer: null, shipmentError: null };
const $ = (selector) => document.querySelector(selector);

function safeText(value, fallback = '—') {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
}

function initials(value) {
  return safeText(value, '?').trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function displayDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? safeText(value) : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

function titleCase(value) {
  return safeText(value).replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function setConnectionError(message) {
  $('#connection-message').textContent = message;
  $('#connection-banner').hidden = false;
}

function clearConnectionError() {
  $('#connection-banner').hidden = true;
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Request failed (${response.status})`);
  return payload;
}

async function loadShipments() {
  try {
    state.shipments = await requestJson('/api/shipments');
    $('#metric-total').textContent = state.shipments.length;
    $('#metric-transit').textContent = state.shipments.filter((item) => item.status === 'in_transit').length;
    $('#metric-delivered').textContent = state.shipments.filter((item) => item.status === 'delivered').length;
    $('#metric-pending').textContent = state.shipments.filter((item) => ['pending', 'picked_up'].includes(item.status)).length;
    $('#shipment-nav-count').textContent = state.shipments.length;
    state.shipmentError = null;
    clearConnectionError();
  } catch (error) {
    state.shipments = [];
    state.shipmentError = error.message;
    $('#metric-total').textContent = '—';
    $('#metric-transit').textContent = '—';
    $('#metric-delivered').textContent = '—';
    $('#metric-pending').textContent = '—';
    $('#shipment-nav-count').textContent = '—';
    setConnectionError(`Could not load shipment data: ${error.message}`);
  }
}

function renderTableHead(config) {
  const head = $('#table-head');
  head.replaceChildren();
  const row = document.createElement('tr');
  for (const [, label] of config.columns) {
    const th = document.createElement('th');
    th.textContent = label.toUpperCase();
    row.append(th);
  }
  const actions = document.createElement('th');
  actions.setAttribute('aria-label', 'Actions');
  row.append(actions);
  head.append(row);
}

function renderCell(key, item) {
  const cell = document.createElement('td');
  if (key === 'id') {
    cell.className = 'shipment-id';
    cell.textContent = `#${safeText(item.id)}`;
  } else if (key === 'customer_id' && state.page !== 'customers') {
    const customer = document.createElement('span');
    customer.className = 'shipment-customer';
    const avatar = document.createElement('span');
    avatar.className = 'customer-avatar';
    avatar.textContent = `C${safeText(item.customer_id)}`;
    const name = document.createElement('span');
    name.textContent = `Customer ${safeText(item.customer_id)}`;
    customer.append(avatar, name);
    cell.append(customer);
  } else if (key === 'route') {
    const route = document.createElement('span');
    route.className = 'route-cell';
    const origin = document.createElement('span');
    origin.textContent = safeText(item.origin);
    const arrow = document.createElement('span');
    arrow.className = 'route-arrow';
    arrow.textContent = '→';
    const destination = document.createElement('span');
    destination.textContent = safeText(item.destination);
    route.append(origin, arrow, destination);
    cell.append(route);
  } else if (key === 'status' || key === 'payment_status') {
    const pill = document.createElement('span');
    const status = safeText(item[key], 'unknown').toLowerCase().replace(/\s+/g, '_');
    pill.className = `status-pill status-${status}`;
    pill.textContent = titleCase(status);
    cell.append(pill);
  } else if (key === 'created_at' || key === 'pickup_time' || key === 'dropoff_time' || key === 'event_time') {
    cell.textContent = displayDate(item[key]);
  } else if (key === 'amount') {
    const amount = Number(item.amount);
    cell.textContent = Number.isFinite(amount) ? new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(amount) : safeText(item.amount);
  } else if (key === 'full_name') {
    const customer = document.createElement('span');
    customer.className = 'shipment-customer';
    const avatar = document.createElement('span');
    avatar.className = 'customer-avatar';
    avatar.textContent = initials(item.full_name);
    const name = document.createElement('span');
    name.textContent = safeText(item.full_name);
    customer.append(avatar, name);
    cell.append(customer);
  } else {
    cell.textContent = safeText(item[key]);
  }
  return cell;
}

function currentRows() {
  return state.data.filter((item) => {
    const statusMatches = state.statusFilter === 'all' || item.status === state.statusFilter;
    const searchable = Object.values(item).join(' ').toLowerCase();
    return statusMatches && searchable.includes(state.search.toLowerCase());
  });
}

function renderTable() {
  const config = pageConfig[state.page];
  const body = $('#table-body');
  body.replaceChildren();
  const rows = currentRows();
  $('#result-count').textContent = rows.length;
  $('.filter-select').hidden = !['overview', 'shipments'].includes(state.page);
  $('#new-shipment-button').hidden = !['overview', 'shipments'].includes(state.page);
  $('#search-input').placeholder = config.search;
  $('#table-title').textContent = config.table;
  $('#table-description').textContent = config.description;
  $('#empty-title').textContent = config.empty;
  $('#empty-action').hidden = !['overview', 'shipments'].includes(state.page);
  $('#empty-state').hidden = rows.length > 0;
  $('#table-head').parentElement.hidden = rows.length === 0;
  $('#table-footer-copy').textContent = rows.length ? `Showing ${rows.length} ${rows.length === 1 ? 'record' : 'records'}` : 'No records to display';
  $('#view-all-button').hidden = !['overview', 'shipments'].includes(state.page) || state.page === 'shipments';

  for (const item of rows) {
    const row = document.createElement('tr');
    for (const [key] of config.columns) row.append(renderCell(key, item));
    const actions = document.createElement('td');
    const button = document.createElement('button');
    button.className = 'row-action';
    button.type = 'button';
    button.setAttribute('aria-label', `View ${config.title.toLowerCase()} record`);
    button.textContent = '···';
    button.addEventListener('click', () => showToast(`${config.title}: ${safeText(item.id, 'record')}`));
    actions.append(button);
    row.append(actions);
    body.append(row);
  }
}

async function loadPage(page) {
  const config = pageConfig[page] || pageConfig.overview;
  state.page = page;
  state.statusFilter = 'all';
  state.search = '';
  $('#search-input').value = '';
  $('#status-filter').value = 'all';
  $('#page-title').textContent = config.heading;
  $('#page-subtitle').textContent = config.subtitle;
  $('#breadcrumb-current').textContent = config.title;
  document.title = `${config.title} · Waypoint Logistics`;
  document.querySelectorAll('.nav-link').forEach((link) => link.classList.toggle('active', link.dataset.page === page));
  renderTableHead(config);
  $('#sidebar').classList.remove('open');

  if (page === 'tracking') {
    const shipmentId = window.prompt('Enter the shipment ID to view its tracking history:');
    if (!shipmentId || !/^[1-9]\d*$/.test(shipmentId)) {
      state.data = [];
      $('#empty-copy').textContent = 'Enter a valid shipment ID from your shipments list to view its tracking history.';
      renderTable();
      return;
    }
    try {
      state.data = await requestJson(`/api/shipments/${encodeURIComponent(shipmentId)}/tracking`);
      $('#empty-copy').textContent = 'Tracking events will appear here.';
      clearConnectionError();
    } catch (error) {
      state.data = [];
      $('#empty-copy').textContent = error.message;
      setConnectionError(`Could not load tracking data: ${error.message}`);
    }
  } else {
    try {
      state.data = page === 'overview' || page === 'shipments'
        ? state.shipments
        : await requestJson(config.endpoint);
      if (page !== 'overview' && page !== 'shipments') clearConnectionError();
    } catch (error) {
      state.data = [];
      setConnectionError(`Could not load ${config.title.toLowerCase()}: ${error.message}`);
    }
  }
  if ((page === 'overview' || page === 'shipments') && state.shipmentError) {
    setConnectionError(`Could not load shipment data: ${state.shipmentError}`);
  }
  renderTable();
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => toast.classList.remove('visible'), 2800);
}

function openDialog() {
  $('#form-feedback').textContent = '';
  $('#shipment-form').reset();
  $('#shipment-dialog').showModal();
}

async function refreshData() {
  const page = state.page;
  await loadShipments();
  await loadPage(page);
}

document.querySelectorAll('.nav-link').forEach((link) => {
  link.addEventListener('click', async (event) => {
    event.preventDefault();
    await loadPage(link.dataset.page);
  });
});

$('#new-shipment-button').addEventListener('click', openDialog);
$('#empty-action').addEventListener('click', openDialog);
$('#dialog-close').addEventListener('click', () => $('#shipment-dialog').close());
$('#cancel-button').addEventListener('click', () => $('#shipment-dialog').close());
$('#refresh-button').addEventListener('click', refreshData);
$('#retry-button').addEventListener('click', refreshData);
$('#mobile-menu').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
$('#search-input').addEventListener('input', (event) => {
  state.search = event.target.value.trim();
  renderTable();
});
$('#status-filter').addEventListener('change', (event) => {
  state.statusFilter = event.target.value;
  renderTable();
});
$('#view-all-button').addEventListener('click', () => loadPage('shipments'));
$('#shipment-dialog').addEventListener('click', (event) => {
  if (event.target === $('#shipment-dialog')) $('#shipment-dialog').close();
});
$('#shipment-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const button = $('#submit-button');
  const feedback = $('#form-feedback');
  button.disabled = true;
  button.textContent = 'Creating…';
  feedback.textContent = '';
  try {
    await requestJson('/api/shipments', {
      method: 'POST',
      body: JSON.stringify({
        customer_id: Number(form.get('customer_id')),
        origin: String(form.get('origin')).trim(),
        destination: String(form.get('destination')).trim()
      })
    });
    $('#shipment-dialog').close();
    showToast('Shipment created successfully.');
    await refreshData();
  } catch (error) {
    feedback.textContent = error.message;
  } finally {
    button.disabled = false;
    button.textContent = 'Create shipment';
  }
});

const now = new Date();
$('#today-label').textContent = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(now);
$('#current-year').textContent = now.getFullYear();
const hour = now.getHours();
pageConfig.overview.heading = `${hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'}, Jordan`;
$('#empty-copy').textContent = 'When you create a shipment, it’ll show up here.';
loadShipments().then(() => loadPage('overview'));
