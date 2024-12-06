// Fetch internship data from the README file (or a preprocessed JSON file)
fetch("path_to_your_data.json")
  .then(response => response.json())
  .then(data => {
    const table = document.querySelector("#internshipTable tbody");

    // Populate the table
    data.forEach((item, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${item.company}</td>
        <td>${item.role}</td>
        <td>${item.location}</td>
        <td>
          <input type="checkbox" data-id="${index}" ${item.applied ? "checked" : ""}>
        </td>
      `;
      table.appendChild(row);
    });

    // Save changes when a checkbox is clicked
    table.addEventListener("change", (event) => {
      const checkbox = event.target;
      if (checkbox.type === "checkbox") {
        const id = checkbox.dataset.id;
        data[id].applied = checkbox.checked;

        // Save to localStorage
        localStorage.setItem("internshipData", JSON.stringify(data));
      }
    });
  })
  .catch(err => console.error(err));

// Search functionality
document.querySelector("#search").addEventListener("input", (event) => {
  const query = event.target.value.toLowerCase();
  document.querySelectorAll("#internshipTable tbody tr").forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(query) ? "" : "none";
  });
});
