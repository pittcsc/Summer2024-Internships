// Fetch internship data from the README file (or a preprocessed JSON file)
fetch("../.github/scripts/listings.json")
  .then(response => response.json())
  .then(data => {
    const table = document.querySelector("#internshipTable tbody");
    const rowCount = document.getElementById("rowCount");

    // Populate the table with the first 100 rows
    data.slice(0, 1000).forEach((item, index) => {
      const row = document.createElement("tr");
      const date = new Date(item.date_updated * 1000);
      const formattedDate = date.toLocaleDateString("en-US", {
        year: "2-digit",
        month: "short",
        day: "2-digit"
      });

      row.innerHTML = `
        <td>${item.company_name}</td>
        <td>${item.title}</td>
        <td>${item.locations}</td>
        <td><a href="${item.url}" target="_blank">Link</a></td>
        <td><a href="https://simplify.jobs/p/${item.id}" target="_blank">Link</a></td>
        <td>${formattedDate}</td>
        <td>
          <input type="checkbox" data-id="${index}" ${item.applied ? "checked" : ""}>
        </td>
      `;
      table.appendChild(row);
    });

    // Update row count
    updateRowCount();

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

    // Add event listeners for filter buttons
    document.querySelectorAll(".apply-filter").forEach((button, index) => {
      button.addEventListener("click", () => {
        const filterType = button.previousElementSibling.previousElementSibling.value;
        const filterValue = button.previousElementSibling.value.toLowerCase();
        const columnIndex = index;

        document.querySelectorAll("#internshipTable tbody tr").forEach(row => {
          const cellText = row.cells[columnIndex].textContent.toLowerCase();
          let shouldDisplay = true;

          switch (filterType) {
            case "contains":
              shouldDisplay = cellText.includes(filterValue);
              break;
            case "equals":
              shouldDisplay = cellText === filterValue;
              break;
            case "not-equals":
              shouldDisplay = cellText !== filterValue;
              break;
            case "not-contains":
              shouldDisplay = !cellText.includes(filterValue);
              break;
          }

          row.style.display = shouldDisplay ? "" : "none";
        });
      });
    });

    // Global filter functionality
    const filterModal = document.getElementById("filterModal");
    const addFilterBtn = document.getElementById("addFilter");
    const closeBtn = document.querySelector(".close");
    const filterColumn = document.getElementById("filterColumn");
    const filterOptions = document.getElementById("filterOptions");
    const applyGlobalFilterBtn = document.getElementById("applyGlobalFilter");
    const activeFiltersContainer = document.getElementById("activeFilters");
    let activeFilters = [];
    let editIndex = null;

    addFilterBtn.onclick = () => {
      filterModal.style.display = "block";
      editIndex = null;
    };

    closeBtn.onclick = () => {
      filterModal.style.display = "none";
    };

    window.onclick = (event) => {
      if (event.target == filterModal) {
        filterModal.style.display = "none";
      }
    };

    filterColumn.onchange = () => {
      const column = filterColumn.value;
      filterOptions.innerHTML = "";

      if (column === "date") {
        filterOptions.innerHTML = `
          <label for="fromDate">From:</label>
          <input type="date" id="fromDate">
          <label for="toDate">To:</label>
          <input type="date" id="toDate">
        `;
      } else if (column === "status") {
        filterOptions.innerHTML = `
          <select id="statusFilter">
            <option value="applied">Applied</option>
            <option value="not-applied">Not Applied</option>
          </select>
        `;
      } else {
        filterOptions.innerHTML = `
          <select id="filterType">
            <option value="contains">Contains</option>
            <option value="equals">Equals</option>
            <option value="not-equals">Not Equals</option>
            <option value="not-contains">Not Contains</option>
          </select>
          <input type="text" id="filterValue">
        `;
      }
    };

    applyGlobalFilterBtn.onclick = () => {
      const column = filterColumn.value;
      let filter = { column };

      if (column === "date") {
        filter.fromDate = document.getElementById("fromDate").value;
        filter.toDate = document.getElementById("toDate").value;
      } else if (column === "status") {
        filter.status = document.getElementById("statusFilter").value;
      } else {
        filter.type = document.getElementById("filterType").value;
        filter.value = document.getElementById("filterValue").value.toLowerCase();
      }

      if (editIndex !== null) {
        activeFilters[editIndex] = filter;
      } else {
        activeFilters.push(filter);
      }

      updateActiveFilters();
      applyFilters();
      filterModal.style.display = "none";
    };

    function updateActiveFilters() {
      activeFiltersContainer.innerHTML = "";
      activeFilters.forEach((filter, index) => {
        const filterTag = document.createElement("div");
        filterTag.className = "filter-tag";
        filterTag.innerHTML = `
          ${filter.column}: ${filter.type || ""} ${filter.value || filter.fromDate + " to " + filter.toDate || filter.status}
          <button class="edit" data-index="${index}">Edit</button>
          <button class="duplicate" data-index="${index}">Duplicate</button>
          <button class="remove" data-index="${index}">&times;</button>
        `;
        activeFiltersContainer.appendChild(filterTag);
      });

      document.querySelectorAll(".filter-tag .remove").forEach(button => {
        button.onclick = () => {
          const index = button.dataset.index;
          activeFilters.splice(index, 1);
          updateActiveFilters();
          applyFilters();
        };
      });

      document.querySelectorAll(".filter-tag .edit").forEach(button => {
        button.onclick = () => {
          const index = button.dataset.index;
          const filter = activeFilters[index];
          editIndex = index;

          filterColumn.value = filter.column;
          filterColumn.onchange();

          if (filter.column === "date") {
            document.getElementById("fromDate").value = filter.fromDate;
            document.getElementById("toDate").value = filter.toDate;
          } else if (filter.column === "status") {
            document.getElementById("statusFilter").value = filter.status;
          } else {
            document.getElementById("filterType").value = filter.type;
            document.getElementById("filterValue").value = filter.value;
          }

          filterModal.style.display = "block";
        };
      });

      document.querySelectorAll(".filter-tag .duplicate").forEach(button => {
        button.onclick = () => {
          const index = button.dataset.index;
          const filter = activeFilters[index];
          activeFilters.push({ ...filter });
          updateActiveFilters();
          applyFilters();
        };
      });

      updateRowCount();
    }

    function applyFilters() {
      document.querySelectorAll("#internshipTable tbody tr").forEach(row => {
        let shouldDisplay = true;

        activeFilters.forEach(filter => {
          let cellText;
          switch (filter.column) {
            case "company":
              cellText = row.cells[0].textContent.toLowerCase();
              break;
            case "role":
              cellText = row.cells[1].textContent.toLowerCase();
              break;
            case "location":
              cellText = row.cells[2].textContent.toLowerCase();
              break;
            case "date":
              const fromDate = new Date(filter.fromDate);
              const toDate = new Date(filter.toDate);
              const dateText = new Date(row.cells[5].textContent);
              shouldDisplay = shouldDisplay && dateText >= fromDate && dateText <= toDate;
              break;
            case "status":
              const isChecked = row.cells[6].querySelector("input").checked;
              shouldDisplay = shouldDisplay && ((filter.status === "applied" && isChecked) || (filter.status === "not-applied" && !isChecked));
              break;
          }

          if (filter.column !== "date" && filter.column !== "status") {
            switch (filter.type) {
              case "contains":
                shouldDisplay = shouldDisplay && cellText.includes(filter.value);
                break;
              case "equals":
                shouldDisplay = shouldDisplay && cellText === filter.value;
                break;
              case "not-equals":
                shouldDisplay = shouldDisplay && cellText !== filter.value;
                break;
              case "not-contains":
                shouldDisplay = shouldDisplay && !cellText.includes(filter.value);
                break;
            }
          }
        });

        row.style.display = shouldDisplay ? "" : "none";
      });
      updateRowCount();
    }

    function updateRowCount() {
      const visibleRows = document.querySelectorAll("#internshipTable tbody tr:not([style*='display: none'])").length;
      rowCount.textContent = `Total Rows: ${visibleRows}`;
    }
  })
  .catch(err => console.error(err));

// Search functionality
document.querySelector("#search").addEventListener("input", (event) => {
  const query = event.target.value.toLowerCase();
  document.querySelectorAll("#internshipTable tbody tr").forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(query) ? "" : "none";
  });
  updateRowCount();
});
