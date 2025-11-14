document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Create activity name
        const nameHeader = document.createElement("h4");
        nameHeader.textContent = name;
        activityCard.appendChild(nameHeader);

        // Description
        const descP = document.createElement("p");
        descP.textContent = details.description;
        activityCard.appendChild(descP);

        // Schedule
        const scheduleP = document.createElement("p");
        const scheduleStrong = document.createElement("strong");
        scheduleStrong.textContent = "Schedule:";
        scheduleP.appendChild(scheduleStrong);
        scheduleP.appendChild(document.createTextNode(" " + details.schedule));
        activityCard.appendChild(scheduleP);

        // Availability
        const availP = document.createElement("p");
        const availStrong = document.createElement("strong");
        availStrong.textContent = "Availability:";
        availP.appendChild(availStrong);
        availP.appendChild(document.createTextNode(` ${spotsLeft} spots left`));
        activityCard.appendChild(availP);

        // Participants section
        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";
        const participantsTitle = document.createElement("p");
        const participantsStrong = document.createElement("strong");
        participantsStrong.textContent = "Participants:";
        participantsTitle.appendChild(participantsStrong);
        participantsSection.appendChild(participantsTitle);

        if (details.participants.length > 0) {
          const ul = document.createElement("ul");
          ul.className = "participants-list";
          details.participants.forEach(email => {
            const li = document.createElement("li");
            const emailSpan = document.createElement("span");
            emailSpan.className = "participant-email";
            emailSpan.textContent = email;
            li.appendChild(emailSpan);

            const deleteBtn = document.createElement("button");
            deleteBtn.className = "delete-btn";
            deleteBtn.setAttribute("data-activity", name);
            deleteBtn.setAttribute("data-email", email);
            deleteBtn.setAttribute("title", "Delete participant");
            deleteBtn.textContent = "🗑️";
            li.appendChild(deleteBtn);

            ul.appendChild(li);
          });
          participantsSection.appendChild(ul);
        } else {
          const noP = document.createElement("p");
          noP.className = "no-participants";
          noP.textContent = "No participants yet";
          participantsSection.appendChild(noP);
        }

        activityCard.appendChild(participantsSection);
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        
        // Refresh activities list
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Handle delete participant
  activitiesList.addEventListener("click", async (event) => {
    if (event.target.classList.contains("delete-btn")) {
      const activity = event.target.dataset.activity;
      const email = event.target.dataset.email;

      if (!confirm(`Are you sure you want to unregister ${email} from ${activity}?`)) {
        return;
      }

      try {
        const response = await fetch(
          `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
          {
            method: "DELETE",
          }
        );

        const result = await response.json();

        if (response.ok) {
          messageDiv.textContent = result.message;
          messageDiv.className = "success";
          messageDiv.classList.remove("hidden");

          // Refresh activities list
          await fetchActivities();

          // Hide message after 5 seconds
          setTimeout(() => {
            messageDiv.classList.add("hidden");
          }, 5000);
        } else {
          messageDiv.textContent = result.detail || "An error occurred";
          messageDiv.className = "error";
          messageDiv.classList.remove("hidden");
        }
      } catch (error) {
        messageDiv.textContent = "Failed to unregister participant. Please try again.";
        messageDiv.className = "error";
        messageDiv.classList.remove("hidden");
        console.error("Error unregistering participant:", error);
      }
    }
  });

  // Initialize app
  fetchActivities();
});
