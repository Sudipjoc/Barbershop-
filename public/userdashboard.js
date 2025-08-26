const token = localStorage.getItem("token");
const userId = localStorage.getItem("userId");
const username = localStorage.getItem("username");


const socket = io("http://localhost:5000", {
  auth: {
    userId: localStorage.getItem("userId"),
    token: localStorage.getItem("token")
  }
});


const notificationIcon = document.querySelector(".notification-icon");
const notificationList = document.getElementById("notification-list");

let notifications = [];

function addNotification(message) {
  notifications.unshift(message); // Add to beginning
  updateNotificationUI();
}

function updateNotificationUI() {
  if (notifications.length === 0) {
    notificationList.innerHTML = "<p>No new notifications yet.</p>";
    return;
  }

  notificationList.innerHTML = notifications
    .map(msg => `<p style="margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 5px;">${msg}</p>`)
    .join("");
}


if (!token || !userId) {
  window.location.href = "/login.html";
}

document.getElementById("userWelcome").textContent = username || "User";

document.getElementById("logout-btn").addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "/login.html";
});

function showToast(message, type = "success") {
  Toastify({
    text: message,
    duration: 3000,
    close: true,
    gravity: "top",
    position: "right",
    backgroundColor: type === "success" ? "green" : "red",
  }).showToast();
}

async function fetchAppointments() {
  try {
    const res = await fetch("http://localhost:5000/book/my", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const appointments = await res.json();
    renderAppointments(appointments);
  } catch (err) {
    console.error("Error fetching appointments:", err);
  }
}

function renderAppointments(appointments) {
  const list = document.getElementById("appointment-list");
  list.innerHTML = "";

  appointments.forEach(appt => {
    const div = document.createElement("div");
    div.className = "appointment-card";
    div.innerHTML = `
      <p><strong>Barber:</strong> ${appt.barber?.name || "N/A"}</p>
      <p><strong>Service:</strong> ${appt.service || "N/A"}</p>
      <p><strong>Time:</strong> ${new Date(appt.bookingTime).toLocaleString()}</p>
      <p><strong>Status:</strong> ${appt.status}</p>
      <button onclick="cancelBooking('${appt._id}')" ${appt.status !== "Pending" ? "disabled" : ""}>Cancel</button>
      <button onclick="promptFeedback('${appt._id}', '${appt.barber?._id || ""}')" ${appt.status !== "Completed" ? "disabled" : ""}>Feedback</button>
    `;
    list.appendChild(div);
  });
}

async function cancelBooking(id) {
  if (!confirm("Are you sure you want to cancel this appointment?")) return;

  try {
    const res = await fetch(`http://localhost:5000/book/cancel/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Server error response:", text);
      throw new Error(`Server responded with status ${res.status}`);
    }

    const result = await res.json();
    showToast(result.msg || "Appointment canceled.");
    fetchAppointments();
  } catch (err) {
    console.error("Error cancelling booking:", err);
    showToast("Failed to cancel appointment", "error");
  }
}

function promptFeedback(appointmentId, barberId) {
  document.getElementById("reviewBookingId").value = appointmentId;
  document.getElementById("reviewBarberId").value = barberId;
  document.getElementById("reviewText").value = "";
  document.getElementById("reviewRating").value = "";
  document.getElementById("reviewModal").style.display = "flex";
}

async function submitReview(bookingId, reviewText, rating, barberId) {
  try {
    const res = await fetch("http://localhost:5000/reviews", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ bookingId, barberId, userId, reviewText, rating }),
    });

    const data = await res.json();
    if (res.ok) {
      showToast("✅ Review submitted!");
      closeReviewModal(); // Make sure this function exists
      fetchAppointments();
    } else {
      showToast(data.message || "Failed to submit review", "error");
    }
  } catch (err) {
    console.error("Review error:", err);
    showToast("Error submitting review.", "error");
  }
}

function closeReviewModal() {
  document.getElementById("reviewModal").style.display = "none";
}




socket.on("shopStatusUpdate", ({ barberId, status }) => {
  showToast(`Barber ${barberId} shop is now ${status}`);
});

socket.on("appointmentAccepted", (data) => {
  if (data.userId === userId) {
    addNotification(data.message);
    showToast(data.message);
  }
});

socket.on("appointmentRescheduled", (data) => {
  if (data.userId === userId) {
    addNotification(`${data.message} New time: ${new Date(data.newTime).toLocaleString()}`);
    showToast(data.message);
  }
});


fetchAppointments();


document.getElementById("edit-account-btn").addEventListener("click", () => {
  document.getElementById("editModal").style.display = "flex";
});

function closeEditModal() {
  document.getElementById("editModal").style.display = "none";
}

document.getElementById("editAccountForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const firstName = document.getElementById("editFirstName").value.trim();
  const lastName = document.getElementById("editLastName").value.trim();
  const email = document.getElementById("editEmail").value.trim();
  const password = document.getElementById("editPassword").value;

  if (!firstName || !lastName || !email) {
    return showToast("All fields except password are required", "error");
  }

  try {
    const res = await fetch("http://localhost:5000/auth/edit", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ firstName, lastName, email, password })
    });

    const result = await res.json();
    if (res.ok) {
      showToast("✅ Account updated successfully");
      const updatedUsername = `${firstName}${lastName}`.toLowerCase();
      localStorage.setItem("username", updatedUsername);
      document.getElementById("userWelcome").textContent = updatedUsername;
      closeEditModal();
    } else {
      showToast(result.msg || "Update failed", "error");
    }
  } catch (err) {
    console.error("Edit account error:", err);
    showToast("Failed to update account", "error");
  }
});


// ✅ Manage Account: Delete
document.getElementById("delete-account-btn").addEventListener("click", async () => {
  const confirmDelete = confirm("⚠️ Are you sure you want to permanently delete your account?");
  if (!confirmDelete) return;

  try {
    const res = await fetch("http://localhost:5000/auth/delete", {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const result = await res.json();
    if (res.ok) {
      showToast("🗑️ Account deleted successfully");
      localStorage.clear();
      setTimeout(() => {
        window.location.href = "/signup.html";
      }, 2000);
    } else {
      showToast(result.msg || "Deletion failed", "error");
    }
  } catch (err) {
    console.error("Delete account error:", err);
    showToast("Failed to delete account", "error");
  }
});


document.getElementById("reviewForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const bookingId = document.getElementById("reviewBookingId").value;
  const barberId = document.getElementById("reviewBarberId").value;
  const reviewText = document.getElementById("reviewText").value.trim();
  const rating = document.getElementById("reviewRating").value;

  if (!rating || isNaN(rating) || rating < 1 || rating > 5) {
    return showToast("Please enter a rating between 1 and 5", "error");
  }

  submitReview(bookingId, reviewText, rating, barberId);
});



