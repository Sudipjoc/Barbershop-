flatpickr("#newBookingTime", {
  enableTime: true,
  dateFormat: "Y-m-d H:i",
  time_24hr: false,   
  defaultHour: 10,
  minDate: "today"
});


const barberId = localStorage.getItem("barberId") || null;
const token = localStorage.getItem("token") || null;
const socket = io();

if (!barberId || !token) {
  localStorage.clear();
  window.location.href = "/login.html";
}

// Elements
const statusText = document.getElementById("shopStatusDisplay");
const statusToggle = document.getElementById("shopToggle");
const messageBox = document.getElementById("message");
const logoutBtn = document.getElementById("logoutBtn");
const serviceBody = document.getElementById("serviceTableBody");
const addServiceForm = document.getElementById("addServiceForm");
const employeeForm = document.getElementById("addEmployeeForm");
const employeeList = document.getElementById("employeeTableBody");
const dropZone = document.getElementById("dropZone");
const photoInput = document.getElementById("employeePhoto");
const previewImage = document.getElementById("previewImage");

const availabilityText = document.getElementById("availabilityStatusDisplay");
const availabilityToggle = document.getElementById("availabilityToggle");

// Logout
logoutBtn?.addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "/login.html";
});

function logout() {
  localStorage.clear();
  window.location.href = "/login.html";
}

function showMessage(text, type) {
  messageBox.textContent = text;
  messageBox.className = `alert alert-${type}`;
  messageBox.style.display = "block";
  setTimeout(() => (messageBox.style.display = "none"), 3000);
}

// ------------------availability----------------------------



// Update UI based on current availability
function updateAvailabilityUI(status) {
  availabilityText.textContent = status;
  availabilityText.className = status === "Available" ? "available" : "busy";
  availabilityToggle.checked = status === "Available";
}

// Fetch availability status on load
async function fetchBarberAvailability() {
  try {
    const res = await fetch("http://localhost:5000/barber/me/availability", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (res.status === 401) return logout();

    const data = await res.json();
    updateAvailabilityUI(data.availabilityStatus);
  } catch (err) {
    console.error("Error fetching availability:", err);
    showMessage("Failed to load availability", "danger");
  }
}

// Toggle availability status
availabilityToggle?.addEventListener("change", async () => {
  const availabilityStatus = availabilityToggle.checked ? "Available" : "Busy";

  try {
    const res = await fetch("http://localhost:5000/barber/availability", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ availabilityStatus }),
    });

    if (res.status === 401) return logout();

    const data = await res.json();
    updateAvailabilityUI(data.availabilityStatus);
    showMessage("Availability updated", "success");
  } catch (err) {
    console.error("Error updating availability:", err);
    showMessage("Failed to update availability", "danger");
  }
});

// ---------------- SHOP STATUS ----------------
function updateStatusUI(status) {
  statusText.textContent = status.charAt(0).toUpperCase() + status.slice(1);
  statusToggle.checked = status === "open";
  statusText.className = `shop-status ${status}`;
}

async function fetchBarberStatus() {
  const res = await fetch(`http://localhost:5000/barber/${barberId}/status`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) return logout();
  const data = await res.json();
  updateStatusUI(data.shopStatus);
}

statusToggle?.addEventListener("change", async () => {
  const status = statusToggle.checked ? "open" : "closed";
  const res = await fetch("http://localhost:5000/barber/status", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
  if (res.status === 401) return logout();
  const data = await res.json();
  updateStatusUI(data.barber.shopStatus);
  socket.emit("shopStatusUpdate", { barberId, status: data.barber.shopStatus });
  showMessage("Shop status updated", "success");
});

// ---------------- NAVIGATION ----------------
function showSection(section) {
  const sections = ["addServiceSection", "employeesSection", "bookingSection"];
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = id === `${section}Section` ? "block" : "none";
  });

  document.querySelectorAll(".nav-link").forEach(link => {
    link.classList.remove("active");
    if (link.textContent.toLowerCase().includes(section.toLowerCase())) {
      link.classList.add("active");
    }
  });
}

// ---------------- SERVICES ----------------
async function fetchServices() {
  const res = await fetch("http://localhost:5000/barber/services", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) return logout();
  const services = await res.json();

  // Populate service table
  serviceBody.innerHTML = services
    .map(
      (srv, i) => `
    <tr>
      <td>${srv.type}</td>
      <td>NPR ${srv.price}</td>
      <td>
        <button class="btn btn-warning btn-sm" onclick="editService(${i}, '${srv.type}', ${srv.price})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteService(${i})">Delete</button>
      </td>
    </tr>`
    )
    .join("");

  // Populate job title dropdown
  const jobDropdown = document.getElementById("employeeJob");
  if (jobDropdown) {
    jobDropdown.innerHTML = `<option value="">Select Job Title</option>`;
    services.forEach(srv => {
      const option = document.createElement("option");
      option.value = srv.type;
      option.textContent = srv.type;
      jobDropdown.appendChild(option);
    });
  }
}


addServiceForm?.addEventListener("submit", async e => {
  e.preventDefault();
  const type = document.getElementById("newServiceType").value;
  const price = document.getElementById("newServicePrice").value;
  const res = await fetch("http://localhost:5000/barber/services", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ type, price }),
  });
  if (res.status === 401) return logout();
  showMessage("Service added", "success");
  addServiceForm.reset();
  fetchServices();
});

window.editService = async (index, currentType, currentPrice) => {
  const newType = prompt("Edit service type:", currentType);
  const newPrice = prompt("Edit service price:", currentPrice);
  if (!newType || !newPrice) return;
  const res = await fetch(`http://localhost:5000/barber/services/${index}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ type: newType, price: newPrice }),
  });
  if (res.status === 401) return logout();
  showMessage("Service updated", "success");
  fetchServices();
};

window.deleteService = async index => {
  const res = await fetch(`http://localhost:5000/barber/services/${index}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) return logout();
  showMessage("Service deleted", "success");
  fetchServices();
};

// ---------------- EMPLOYEES ----------------
async function fetchEmployees() {
  const res = await fetch("http://localhost:5000/barber/employees", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) return logout();
  const employees = await res.json();

  employeeList.innerHTML = employees
    .map(
      emp => `
    <tr>
      <td><img src="${emp.photo}" height="50" /></td>
      <td>${emp.name}</td>
      <td>${emp.job}</td>
      <td>
        <!-- Add a toggle button for Availability -->
        <label class="form-check form-switch" for="availability-toggle-${emp._id}">
          <input class="form-check-input" type="checkbox" id="availability-toggle-${emp._id}" 
                 ${emp.availabilityStatus === 'Available' ? 'checked' : ''} 
                 onclick="toggleEmployeeAvailability('${emp._id}', '${emp.availabilityStatus}')">
          <span class="form-check-label">${emp.availabilityStatus}</span>
        </label>
      </td>
      <td>
        <button class="btn btn-warning btn-sm" onclick="editEmployee('${emp._id}', '${emp.name}', '${emp.job}', '${emp.photo}')">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteEmployee('${emp._id}')">Delete</button>
      </td>
    </tr>`
    )
    .join("");
}



// Toggle Employee Availability
async function toggleEmployeeAvailability(employeeId, currentStatus) {
  const newStatus = currentStatus === 'Available' ? 'Busy' : 'Available';

  try {
    const res = await fetch(`http://localhost:5000/barber/employees/${employeeId}/availability`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ availabilityStatus: newStatus }),
    });

    if (res.status === 401) return logout();

    const data = await res.json();

    // Update the text and checkbox state
    const label = document.querySelector(`#availability-toggle-${employeeId}`).parentElement.querySelector('.form-check-label');
    const checkbox = document.querySelector(`#availability-toggle-${employeeId}`);
    
    label.textContent = newStatus;
    checkbox.checked = newStatus === 'Available';

    showMessage(data.msg || "Employee availability updated", "success");
  } catch (err) {
    console.error("Error updating employee availability:", err);
    showMessage("Failed to update availability", "danger");
  }
}




employeeForm?.addEventListener("submit", async e => {
  e.preventDefault();
  const name = document.getElementById("employeeName").value;
  const job = document.getElementById("employeeJob").value;
  const photoFile = document.getElementById("employeePhoto").files[0];
  const formData = new FormData();
  formData.append("name", name);
  formData.append("job", job);
  formData.append("photo", photoFile);

  const res = await fetch("http://localhost:5000/barber/employees/add", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (res.status === 401) return logout();
  showMessage("Employee added", "success");
  employeeForm.reset();
  previewImage.style.display = "none";
  fetchEmployees();
});



window.editEmployee = async (id, name, job, photo) => {
  const newName = prompt("Edit name:", name);
  const newJob = prompt("Edit job:", job);
  if (!newName || !newJob) return;

  const res = await fetch(`http://localhost:5000/barber/employees/update/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name: newName, job: newJob, photo }),
  });
  if (res.status === 401) return logout();
  showMessage("Employee updated", "success");
  fetchEmployees();
};

window.deleteEmployee = async id => {
  const res = await fetch(`http://localhost:5000/barber/employees/delete/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) return logout();
  showMessage("Employee deleted", "success");
  fetchEmployees();
};

// ---------------- IMAGE PREVIEW ----------------
dropZone?.addEventListener("dragover", e => e.preventDefault());
dropZone?.addEventListener("drop", e => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file?.type.startsWith("image/")) {
    photoInput.files = e.dataTransfer.files;
    showPreview(file);
  }
});
photoInput?.addEventListener("change", () => {
  if (photoInput.files.length) showPreview(photoInput.files[0]);
});

function showPreview(file) {
  const reader = new FileReader();
  reader.onload = e => {
    previewImage.src = e.target.result;
    previewImage.style.display = "block";
  };
  reader.readAsDataURL(file);
}
// ---------------- BOOKINGS ----------------
function showBookingSection(status) {
  showSection("booking");
  document.getElementById("bookingTitle").textContent = `${status} Bookings`;
  fetchBookingsByStatus(status);
}

async function fetchBookingsByStatus(status) {
  try {
    const res = await fetch("http://localhost:5000/book/bookings", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) return logout();

    const bookings = await res.json();
    const filtered = bookings.filter(
      b => String(b.barber?._id || b.barber) === String(barberId) && b.status === status
    );

    renderBookings(filtered, status);
  } catch (err) {
    console.error("Fetch bookings error:", err);
    showMessage("Failed to load bookings", "danger");
  }
}

function renderBookings(bookings, status) {
  const container = document.getElementById("bookingList");
  container.innerHTML = "";

  if (!bookings.length) {
    container.innerHTML = `<p class="text-muted">No ${status} bookings found.</p>`;
    return;
  }

  bookings.forEach(b => {
    const bookingDate = new Date(b.bookingTime).toLocaleString();
    let actionButtons = "";

    if (b.status === "Pending") {
      actionButtons = `
        <button class="btn btn-success btn-sm" onclick="updateBookingStatus('${b._id}', 'Confirmed')">Confirm</button>
        <button class="btn btn-warning btn-sm" onclick="reschedulePendingBooking('${b._id}')">Reschedule</button>
        <button class="btn btn-danger btn-sm" onclick="deleteBooking('${b._id}')">Delete</button>
      `;
    } else if (b.status === "Confirmed") {
      actionButtons = `
        <button class="btn btn-primary btn-sm" onclick="updateBookingStatus('${b._id}', 'Completed')">Mark Completed</button>
        <button class="btn btn-info btn-sm" onclick="generateBill('${b._id}', '${b.name}', '${b.service}', ${b.price || 0}, '${b.bookingTime}', '${b.phone}', '${b.area}')">Generate Bill</button>
      `;
    } else if (b.status === "Completed") {
      actionButtons = `
        <button class="btn btn-info btn-sm" onclick="generateBill('${b._id}', '${b.name}', '${b.service}', ${b.price || 0}, '${b.bookingTime}', '${b.phone}', '${b.area}')">Generate Bill</button>
      `;
    }

    container.innerHTML += `
      <div class="card mb-3">
        <div class="card-body">
          <h5>${b.name} (${b.service})</h5>
          <p><strong>Time:</strong> ${bookingDate}</p>
          <p><strong>Phone:</strong> ${b.phone} | <strong>Area:</strong> ${b.area}</p>
          <p><strong>Status:</strong> ${b.status}</p>
          <div class="d-flex gap-2 flex-wrap">${actionButtons}</div>
        </div>
      </div>
    `;
  });
}

async function updateBookingStatus(appointmentId, status) {
  let endpoint = "";
  const payload = { appointmentId };

  if (status === "Confirmed") {
    endpoint = `http://localhost:5000/barber/${barberId}/acceptAppointment`;
  } else if (status === "Completed") {
    endpoint = `http://localhost:5000/barber/${barberId}/markAsDone`;
  } else {
    showMessage("Unsupported status change", "danger");
    return;
  }

  try {
    const res = await fetch(endpoint, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (res.status === 401) return logout();

    const data = await res.json();
    showMessage(data.message || "Status updated successfully", "success");

    showBookingSection(status); // Refresh updated status view
  } catch (error) {
    console.error("Status update error:", error);
    showMessage("Failed to update status", "danger");
  }
}

function reschedulePendingBooking(appointmentId) {
  document.getElementById("rescheduleBookingId").value = appointmentId;
  const modal = new bootstrap.Modal(document.getElementById("rescheduleModal"));
  modal.show();
}


document.getElementById("rescheduleForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const newTime = document.getElementById("newBookingTime").value;
  const appointmentId = document.getElementById("rescheduleBookingId").value;

  if (!newTime) return showMessage("Please select a new time.", "warning");

  try {
    const res = await fetch(`http://localhost:5000/barber/${barberId}/updateTime`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ appointmentId, newTime }),
    });

    if (res.status === 401) return logout();
    const data = await res.json();

    bootstrap.Modal.getInstance(document.getElementById("rescheduleModal")).hide();
    showMessage(data.message || "Rescheduled successfully", "success");
    showBookingSection("Confirmed");
  } catch (err) {
    console.error("Reschedule error:", err);
    showMessage("Failed to reschedule", "danger");
  }
});


async function deleteBooking(id) {
  if (!confirm("Are you sure you want to delete this booking?")) return;

  try {
    const res = await fetch(`http://localhost:5000/book/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) return logout();
    const data = await res.json();
    showMessage(data.msg || "Booking deleted", "success");

    const currentStatus = document.getElementById("bookingTitle").textContent.split(" ")[0];
    showBookingSection(currentStatus);
  } catch (err) {
    console.error("Delete error:", err);
    showMessage("Failed to delete booking", "danger");
  }
}

async function generateBill(id, name, service, price, bookingTime, phone, area) {
  const formattedTime = new Date(bookingTime).toLocaleString();

  try {
    const res = await fetch("http://localhost:5000/barber/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        bookingId: id,
        name,
        service,
        price,
        bookingTime,
        phone,
        area,
        barberId
      }),
    });

    if (res.status === 409) {
      showMessage("⚠️ Bill already generated for this booking", "warning");
      return;
    }

    if (!res.ok) throw new Error("Failed to save bill");

    const data = await res.json();
    showMessage(data.message || "Bill saved", "success");
  } catch (err) {
    console.error("Bill error:", err);
    showMessage("Error saving bill", "danger");
    return;
  }

  const billHtml = `
    <div style="padding:20px; font-family:sans-serif;">
      <h2 style="text-align:center;">Barber Shop - Invoice</h2>
      <hr />
      <p><strong>Invoice ID:</strong> ${id}</p>
      <p><strong>Customer:</strong> ${name}</p>
      <p><strong>Service:</strong> ${service}</p>
      <p><strong>Price:</strong> NPR ${price.toFixed(2)}</p>
      <p><strong>Booking Time:</strong> ${formattedTime}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Area:</strong> ${area}</p>
      <hr />
      <h3 style="text-align:right;">Total: NPR ${price.toFixed(2)}</h3>
      <p style="text-align:center;">Thank you for choosing us!</p>
    </div>
  `;

  const printWindow = window.open('', '', 'width=600,height=700');
  printWindow.document.write(`<html><head><title>Invoice</title></head><body>${billHtml}</body></html>`);
  printWindow.document.close();
  printWindow.print();
}


async function updateBookingStatus(appointmentId, status) {
  let endpoint = "";
  const payload = { appointmentId };

  if (status === "Confirmed") {
    endpoint = `http://localhost:5000/barber/${barberId}/acceptAppointment`;
  } else if (status === "Completed") {
    endpoint = `http://localhost:5000/barber/${barberId}/markAsDone`;
  } else {
    showMessage("Unsupported status change", "danger");
    return;
  }

  try {
    const res = await fetch(endpoint, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (res.status === 401) return logout();

    const data = await res.json();
    showMessage(data.message || "Status updated successfully", "success");

    showBookingSection(status); // Refresh updated status view

  } catch (error) {
    console.error("Status update error:", error);
    showMessage("Failed to update status", "danger");
  }
}

// function reschedulePendingBooking(appointmentId) {
//   const newTime = prompt("Enter new time (YYYY-MM-DD HH:mm):");
//   if (!newTime) return;

//   fetch(`http://localhost:5000/barber/${barberId}/updateTime`, {
//     method: "PUT",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${token}`,
//     },
//     body: JSON.stringify({ appointmentId, newTime }),
//   })
//     .then(res => {
//       if (res.status === 401) return logout();
//       return res.json();
//     })
//     .then(data => {
//       showMessage(data.message || "Rescheduled successfully", "success");
//       showBookingSection("Confirmed"); // Move it to confirmed after reschedule
//     })
//     .catch(err => {
//       console.error("Reschedule error:", err);
//       showMessage("Failed to reschedule", "danger");
//     });
// }

async function deleteBooking(id) {
  if (!confirm("Are you sure you want to delete this booking?")) return;

  try {
    const res = await fetch(`http://localhost:5000/book/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) return logout();
    const data = await res.json();
    showMessage(data.msg || "Booking deleted", "success");

    const currentStatus = document.getElementById("bookingTitle").textContent.split(" ")[0];
    showBookingSection(currentStatus);
  } catch (err) {
    console.error("Delete error:", err);
    showMessage("Failed to delete booking", "danger");
  }
}



async function fetchBarberSummary() {
  try {
    const res = await fetch("http://localhost:5000/barber/summary", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 401) return logout();

    const data = await res.json();

    // Populate DOM
    document.getElementById("totalAppointments").textContent = data.totalAppointments;
    document.getElementById("totalRevenue").textContent = `NPR ${data.totalRevenue.toFixed(2)}`;
    document.getElementById("employeeCount").textContent = data.employeeCount;
    
  } catch (err) {
    console.error("Error fetching summary:", err);
    showMessage("Failed to load summary", "danger");
  }
}



// ---------------- INIT ----------------
window.addEventListener("DOMContentLoaded", () => {
  fetchBarberStatus();
  fetchBarberAvailability();
  fetchBarberSummary();
  fetchServices();
  fetchEmployees();
  showBookingSection("Pending");
});


