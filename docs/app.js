let activeFilters = []; // Move this to the top
const activeFiltersContainer = document.getElementById("activeFilters"); // Move this to the top
let activeSorts = []; // Add this to the top
const activeSortsContainer = document.getElementById("activeSorts"); // Add this to the top

function updateRowCount() {
  const visibleRows = document.querySelectorAll("#internshipTable tbody tr:not([style*='display: none'])").length;
  rowCount.textContent = `Total Rows: ${visibleRows}`;
}

function applyFilters() {
  document.querySelectorAll("#internshipTable tbody tr").forEach(row => {
    let shouldDisplay = true;

    activeFilters.forEach(filter => {
      let cellText = "";
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
          const fromDate = filter.fromDate ? new Date(filter.fromDate) : new Date(-8640000000000000);
          const toDate = filter.toDate ? new Date(filter.toDate) : new Date(8640000000000000);
          const dateText = new Date(row.cells[4].textContent); // Updated index
          shouldDisplay = shouldDisplay && dateText >= fromDate && dateText <= toDate;
          break;
        case "applied": // Change this to "applied" to match the new header
          const isChecked = row.cells[5].querySelector("input").checked; // Updated index
          shouldDisplay = shouldDisplay && ((filter.applied && isChecked) || (!filter.applied && !isChecked));
          break;
        case "active":
          const isActive = row.cells[6].textContent.toLowerCase() === "active"; // Updated index
          shouldDisplay = shouldDisplay && ((filter.active && isActive) || (!filter.active && !isActive));
          break;
      }

      if (filter.column !== "date" && filter.column !== "applied" && filter.column !== "active") {
        let conditionMet = false;
        if (filter.conditions) {
          // Use some() to implement OR logic between conditions
          conditionMet = filter.conditions.some(condition => {
            switch (condition.type) {
              case "contains":
                return cellText.includes(condition.value);
              case "equals":
                return cellText === condition.value;
              case "not-equals":
                return cellText !== condition.value;
              case "not-contains":
                return !cellText.includes(condition.value);
              default:
                return false;
            }
          });
        }
        shouldDisplay = shouldDisplay && conditionMet;
      }
    });

    row.style.display = shouldDisplay ? "" : "none";
  });
  updateRowCount();
}

// Fetch both files and combine the data
Promise.all([
  fetch("https://raw.githubusercontent.com/abhira0/Summer2025-Internships/dev/.github/scripts/listings.json"),
  fetch("simplify_tracker.json")
])
  .then(responses => Promise.all(responses.map(r => r.json())))
  .then(([listings, tracker]) => {
    const table = document.querySelector("#internshipTable tbody");
    const rowCount = document.getElementById("rowCount");

    // Create a Set of applied job IDs
    const appliedJobIds = new Set(tracker.map(item => item.job_posting_id));

    // Populate the table
    listings.forEach((item, index) => {
      const row = document.createElement("tr");
      const date = new Date(item.date_updated * 1000);
      const formattedDate = date.toLocaleDateString("en-US", {
        year: "2-digit",
        month: "short",
        day: "2-digit"
      });

      const isApplied = appliedJobIds.has(item.id);
      
      row.innerHTML = `
        <td>${item.company_name}</td>
        <td>${item.title}</td>
        <td>${item.locations}</td>
        <td>
          <div class="apply-links">
            <a href="${item.url}" class="apply-btn" target="_blank">Apply</a>
            <a href="https://simplify.jobs/p/${item.id}" target="_blank">
              <img src="simplify-logo.png" alt="Simplify" class="simplify-logo" data-tooltip="See on Simplify">
            </a>
          </div>
        </td>
        <td>${formattedDate}</td>
        <td>
          <input type="checkbox" data-id="${index}" ${isApplied ? "checked" : ""}>
        </td>
        <td>${item.active ? "Active" : "Inactive"}</td>
      `;
      table.appendChild(row);
    });

    // Apply default filters
    activeFilters.push({ column: "date", fromDate: "2024-01-01", toDate: "" });
    activeFilters.push({ column: "active", active: true });
    activeFilters.push({ column: "location", conditions: [{ type: "not-equals", value: "toronto, on, canada" }] });
    activeFilters.push({ column: "location", conditions: [{ type: "not-equals", value: "toronto, canada" }] });
    activeFilters.push({ column: "location", conditions: [{ type: "not-equals", value: "canada" }] });
    activeFilters.push({ column: "location", conditions: [{ type: "not-equals", value: "remote in canada" }] });
    activeFilters.push({ column: "location", conditions: [{ type: "not-equals", value: "mississauga, on, canada" }] });
    activeFilters.push({ column: "location", conditions: [{ type: "not-equals", value: "montreal, qc, canada" }] });
    activeFilters.push({ column: "location", conditions: [{ type: "not-equals", value: "vancouver, bc, canada" }] });
    activeFilters.push({ column: "location", conditions: [{ type: "not-equals", value: "canada" }] });
    activeFilters.push({ column: "location", conditions: [{ type: "not-equals", value: "canada" }] });
    activeFilters.push({ column: "location", conditions: [{ type: "not-contains", value: "vancouver, canada" }] });
    activeFilters.push({ column: "location", conditions: [{ type: "not-contains", value: "ottawa, canada" }] });
    activeFilters.push({ column: "location", conditions: [{ type: "not-contains", value: "london, uk" }] });
    updateActiveFilters();
    applyFilters();

    // Add default sort
    activeSorts.push({ column: "date", order: "desc" });
    updateActiveSorts();
    sortTable();

    // Update row count
    updateRowCount();

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

    // Add event listener for Escape key
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        filterModal.style.display = 'none';
        sortModal.style.display = 'none';
      }
    });

    // Global filter functionality
    const filterModal = document.getElementById("filterModal");
    const addFilterBtn = document.getElementById("addFilter");
    const closeBtn = document.querySelector(".close");
    const filterColumn = document.getElementById("filterColumn");
    const filterOptions = document.getElementById("filterOptions");
    const applyGlobalFilterBtn = document.getElementById("applyGlobalFilter");
    let editIndex = null;

    addFilterBtn.onclick = () => {
      filterModal.style.display = "block";
      editIndex = null;
    };

    closeBtn.onclick = () => {
      filterModal.style.display = "none";
    };

    window.onclick = (event) => {
      if (event.target === filterModal || event.target === sortModal) {
        filterModal.style.display = "none";
        sortModal.style.display = "none";
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
      } else if (column === "applied" || column === "active") {
        filterOptions.innerHTML = `
          <select id="${column}Filter">
            <option value="true">${column === "applied" ? "Applied" : "Active"}</option>
            <option value="false">${column === "applied" ? "Not Applied" : "Inactive"}</option>
          </select>
        `;
      } else {
        addFilterInput();
      }
    };

    function addFilterInput() {
      const filterInput = document.createElement("div");
      filterInput.className = "filter-input";
      filterInput.innerHTML = `
        <select class="filterType">
          <option value="contains">Contains</option>
          <option value="equals">Equals</option>
          <option value="not-equals">Not Equals</option>
          <option value="not-contains">Not Contains</option>
        </select>
        <input type="text" class="filterValue">
        <button class="add-input">+</button>
        <button class="remove-input">-</button>
      `;
      filterOptions.appendChild(filterInput);

      filterInput.querySelector(".add-input").onclick = () => {
        addFilterInput();
      };

      filterInput.querySelector(".remove-input").onclick = () => {
        filterInput.remove();
      };

      filterInput.querySelector(".filterValue").addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
          applyGlobalFilterBtn.click();
        }
      });
    }

    applyGlobalFilterBtn.onclick = () => {
      const column = filterColumn.value;
      let filter = { column };

      if (column === "date") {
        filter.fromDate = document.getElementById("fromDate").value;
        filter.toDate = document.getElementById("toDate").value;
      } else if (column === "applied" || column === "active") {
        filter[column] = document.getElementById(`${column}Filter`).value === "true";
      } else {
        filter.conditions = [];
        document.querySelectorAll(".filter-input").forEach(input => {
          const type = input.querySelector(".filterType").value;
          const value = input.querySelector(".filterValue").value.toLowerCase();
          filter.conditions.push({ type, value });
        });
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

    function getConditionSymbol(type) {
      switch (type) {
        case "contains":
          return "∈";  // Element of (more intuitive than superset)
        case "equals":
          return "=";  // Simple equals
        case "not-equals":
          return "≠";  // Standard not equals
        case "not-contains":
          return "∉";  // Not element of (more intuitive than not superset)
        default:
          return type;
      }
    }

    function updateActiveFilters() {
      activeFiltersContainer.innerHTML = "";
      activeFilters.forEach((filter, index) => {
        const filterTag = document.createElement("div");
        filterTag.className = "filter-tag";
        
        let filterContent = `<span class="filter-column">${filter.column}</span>`;
        
        if (filter.column === "date") {
          filterContent += `
            <span class="filter-condition">:</span>
            <span class="filter-value">${filter.fromDate || "Any"}</span>
            <span class="filter-condition">→</span>
            <span class="filter-value">${filter.toDate || "Any"}</span>`;
        } else if (filter.column === "applied" || filter.column === "active") {
          filterContent += `
            <span class="filter-condition">is</span>
            <span class="filter-value">${filter[filter.column] ? 
            (filter.column === "applied" ? "Applied" : "Active") : 
            (filter.column === "applied" ? "Not Applied" : "Inactive")}</span>`;
        } else {
          filter.conditions.forEach((condition, i) => {
            if (i > 0) filterContent += `<span class="filter-condition">∨</span>`; // OR symbol
            filterContent += `
              <span class="filter-condition">${getConditionSymbol(condition.type)}</span>
              <span class="filter-value">${condition.value}</span>`;
          });
        }
        
        filterContent += `
          <button class="edit" data-index="${index}" data-tooltip="Edit"><i class="fas fa-edit"></i></button>
          <button class="duplicate" data-index="${index}" data-tooltip="Duplicate"><i class="fas fa-copy"></i></button>
          <button class="remove" data-index="${index}" data-tooltip="Delete"><i class="fas fa-times"></i></button>
        `;
        
        filterTag.innerHTML = filterContent;
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
          } else if (filter.column === "applied" || filter.column === "active") {
            document.getElementById(`${filter.column}Filter`).value = filter[filter.column] ? "true" : "false";
          } else {
            filter.conditions.forEach((condition, i) => {
              if (i > 0) {
                addFilterInput();
              }
              const filterInputs = document.querySelectorAll(".filter-input");
              filterInputs[i].querySelector(".filterType").value = condition.type;
              filterInputs[i].querySelector(".filterValue").value = condition.value;
            });
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

    // Sort functionality
    const sortModal = document.getElementById("sortModal");
    const addSortBtn = document.getElementById("addSort");
    const closeSortBtn = document.querySelector(".closeSort");
    const sortColumn = document.getElementById("sortColumn");
    const sortOrder = document.getElementById("sortOrder");
    const applySortBtn = document.getElementById("applySort");
    let editSortIndex = null;

    addSortBtn.onclick = () => {
      sortModal.style.display = "block";
      editSortIndex = null;
    };

    closeSortBtn.onclick = () => {
      sortModal.style.display = "none";
    };

    applySortBtn.onclick = () => {
      const column = sortColumn.value;
      const order = sortOrder.value;
      let sort = { column, order };

      if (editSortIndex !== null) {
        activeSorts[editSortIndex] = sort;
      } else {
        activeSorts.push(sort);
      }

      updateActiveSorts();
      sortTable();
      sortModal.style.display = "none";
    };

    function getSortSymbol(order) {
      return order === 'asc' 
        ? '<i class="fas fa-sort-amount-up-alt" data-tooltip="Ascending"></i>' 
        : '<i class="fas fa-sort-amount-down-alt" data-tooltip="Descending"></i>';
    }

    function updateActiveSorts() {
      activeSortsContainer.innerHTML = "";
      activeSorts.forEach((sort, index) => {
        const sortTag = document.createElement("div");
        sortTag.className = "sort-tag";
        sortTag.draggable = true;
        sortTag.dataset.index = index;
        
        sortTag.innerHTML = `
          <span class="sort-column">${sort.column}</span>
          <span class="sort-direction">${getSortSymbol(sort.order)}</span>
          <button class="edit" data-index="${index}" data-tooltip="Edit"><i class="fas fa-edit"></i></button>
          <button class="remove" data-index="${index}" data-tooltip="Delete"><i class="fas fa-times"></i></button>
        `;

        // Add drag event listeners
        sortTag.addEventListener('dragstart', handleDragStart);
        sortTag.addEventListener('dragend', handleDragEnd);
        sortTag.addEventListener('dragover', handleDragOver);
        sortTag.addEventListener('drop', handleDrop);

        activeSortsContainer.appendChild(sortTag);
      });

      document.querySelectorAll(".sort-tag .remove").forEach(button => {
        button.onclick = () => {
          const index = button.dataset.index;
          activeSorts.splice(index, 1);
          updateActiveSorts();
          sortTable();
        };
      });

      document.querySelectorAll(".sort-tag .edit").forEach(button => {
        button.onclick = () => {
          const index = button.dataset.index;
          const sort = activeSorts[index];
          editSortIndex = index;

          sortColumn.value = sort.column;
          sortOrder.value = sort.order;

          sortModal.style.display = "block";
        };
      });
    }

    function handleDragStart(e) {
      e.target.classList.add('dragging');
      e.dataTransfer.setData('text/plain', e.target.dataset.index);
    }

    function handleDragEnd(e) {
      e.target.classList.remove('dragging');
    }

    function handleDragOver(e) {
      e.preventDefault();
    }

    function handleDrop(e) {
      e.preventDefault();
      const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
      const toIndex = parseInt(e.target.closest('.sort-tag').dataset.index);
      
      if (fromIndex !== toIndex) {
        const [movedSort] = activeSorts.splice(fromIndex, 1);
        activeSorts.splice(toIndex, 0, movedSort);
        updateActiveSorts();
        sortTable();
      }
    }

    function sortTable() {
      const rows = Array.from(table.querySelectorAll("tr"));
      
      rows.sort((a, b) => {
        // Try each sort rule in order until we find a difference
        for (const sort of activeSorts) {
          const columnIndex = {
            company: 0,
            role: 1,
            location: 2,
            date: 4,        // Updated indices
            applied: 5,      // Updated indices
            active: 6       // Updated indices
          }[sort.column];

          let aText = a.cells[columnIndex].textContent.toLowerCase();
          let bText = b.cells[columnIndex].textContent.toLowerCase();

          if (sort.column === "date") {
            aText = new Date(aText);
            bText = new Date(bText);
          } else if (sort.column === "applied" || sort.column === "active") {
            aText = aText === "active" || aText === "applied";
            bText = bText === "active" || bText === "applied";
          }

          if (aText < bText) return sort.order === "asc" ? -1 : 1;
          if (aText > bText) return sort.order === "asc" ? 1 : -1;
          // If equal, continue to next sort rule
        }
        return 0; // All sort rules resulted in equality
      });

      rows.forEach(row => table.appendChild(row));
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
