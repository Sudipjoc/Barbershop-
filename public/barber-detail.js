document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const barberId = urlParams.get("id");

  const baseUrl = "http://localhost:5000";
  const profileContainer = document.getElementById("barber-profile");
  const employeeGrid = document.getElementById("employeeGrid");
  const reviewSection = document.getElementById("reviewSection");

  if (!barberId) {
    profileContainer.innerHTML = `<p style="color:red;">❌ Invalid or missing barber ID.</p>`;
    return;
  }

  profileContainer.innerHTML = `<p>Loading barber profile...</p>`;

  try {
    const res = await fetch(`${baseUrl}/barber/barbers/${barberId}/profile`);
    if (!res.ok) throw new Error(`Failed to fetch barber data: ${res.status}`);

    const { barber, employees, reviews } = await res.json();

    // 🧑‍🎨 Barber Info
    const imagePath = barber.image
      ? `${baseUrl}${barber.image.startsWith("/") ? barber.image : `/uploads/${barber.image}`}`
      : `${baseUrl}/uploads/default.png`;

    profileContainer.innerHTML = `
      <h2 class="centered">${barber.name}</h2>
      <div class="centered">
        <img src="${imagePath}" alt="${barber.name}" class="barber-image" />
      </div>
      <p><strong>Location:</strong> ${barber.location}</p>
      <p><strong>Shop Status:</strong> ${barber.shopStatus}</p>
      <p><strong>Availability:</strong> ${barber.availabilityStatus}</p>

      <h3>Services</h3>
    <ul>
  ${barber.services?.length
    ? barber.services.map(s => `<li>${s.type} - Rs ${s.price}</li>`).join("")
    : `<li>No services listed.</li>`}
</ul>
    `;

    // 👥 Employees
    employeeGrid.innerHTML = employees?.length
      ? employees.map(e => `
          <article>
            <img src="${baseUrl}${e.photo}" alt="${e.name}" class="employee-photo" />
            <div class="text">
              <h4>${e.name}</h4>
              <p>${e.job}</p>
            </div>
          </article>
        `).join("")
      : `<p>No employees found.</p>`;

    // 🌟 Reviews
    reviewSection.innerHTML = reviews?.length
      ? reviews.map(r => `
          <div class="review">
            <p><strong>Name:</strong> ${r.user.username}</p>
            <p><strong>Comment:</strong> ${r.text}</p>
            <p><strong>Service:</strong> ${r.booking?.service || "N/A"}</p>
            <p><strong>Rating:</strong> ${r.rating}/5</p>
          </div>
        `).join("")
      : `<p>No reviews yet.</p>`;

  } catch (err) {
    console.error("❌ Error fetching profile:", err);
    profileContainer.innerHTML = `<p style="color:red;">Failed to load barber profile.</p>`;
  }
});
