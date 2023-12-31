const form = document.getElementById("add-form");
const itemList = document.getElementById("item-list");
const selectEspDropdownIP = document.getElementById("ip");
let isEditingItem = false;
let editingItemId = null; // Track the ID of the item being edited
// Add item to list
function addItem(event) {
  event.preventDefault();
  submitLights();
  const name = document.getElementById("name").value;
  const link = document.getElementById("link").value;
  const image = document.getElementById("image").value;
  const position = localStorage.getItem('led_positions');
  const quantity = document.getElementById("quantity").value;
  const selectedEspDropdown = document.getElementById("ip"); // Get the selected ESP dropdown

  const selectedEspValue = selectedEspDropdown.value;

  if (selectedEspValue === "select") {
    // Check if the user has not selected anything
    alert("Please select an ESP.");
    return;
  }
  if (position === "[]") {
    // Check if the user has not selected anything
    alert("Please select an LEDS to light up.");
    return;
  }
  // Fetch the IP associated with the selected ESP
  fetch(`/api/esp/${selectedEspValue}`)
      .then((response) => response.json())
      .then((espData) => {
        const ip = espData.esp_ip;
        const item = {
          name,
          link,
          image,
          position,
          quantity,
          ip, // Set the IP as the IP of the selected ESP
        };

        if (isEditingItem) {
          // We are editing, so send a PUT request to update the existing item
          fetch(`/api/items/${editingItemId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item),
          })
              .then((response) => response.json())
              .then((data) => {
                const li = itemList.querySelector(`li[data-id="${editingItemId}"]`);
                const updatedLi = createItemElement(data);
                itemList.replaceChild(updatedLi, li);
                isEditingItem = false; // Reset the editing flag
                form.reset();
                toggleAddForm();
                document.getElementById("btn-add").innerHTML = "Add item"; // Change the button text back to "Add item"
              })
              .catch((error) => console.error(error));
        } else {
          // Add the item with the correct IP
          fetch("/api/items", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item),
          })
              .then((response) => response.json())
              .then((data) => {
                const li = createItemElement(data);
                itemList.appendChild(li);
                form.reset();
                isEditingItem = false;
                toggleAddForm();
              })
              .catch((error) => console.error(error));
        }
      })
      .catch((error) => console.error(error));
      // Clear the stored data in the 'led_positions' key
      localStorage.removeItem('led_positions');

}




function toggleAddForm() {
  const btn = document.getElementById("btn-add");
  const container = document.getElementById("form-container");
  document.getElementById("select_led_container").style.display = "none";
  if (container.style.display === "block" && isEditingItem === false) {
    container.style.display = "none";
    btn.innerHTML = "Add item";
    form.reset();
    document.getElementById("save-item").innerHTML = "Add";
  } else {
    container.style.display = "block";
    btn.innerHTML = "Close";
    if(isEditingItem === false){
      form.reset();
      localStorage.removeItem('led_positions');
    }
  }
}

// Delete item
function deleteItem(item) {
  const response = confirm(`Are you sure you want to delete ${item.name}?`);
  const id = item.id;
  if (response) {
    // Delete item from database
    fetch(`/api/items/${id}`, { method: "DELETE" })
        .then(() => {
          const li = itemList.querySelector(`li[data-id="${id}"]`);
          li.parentNode.removeChild(li);
        })
        .catch((error) => console.error(error));
  }
}

// Create delete button
function createDeleteButton(item) {
  const deleteBtn = document.createElement("button");
  deleteBtn.innerText = "Delete";
  deleteBtn.classList.add(
      "bg-red-500",
      "hover:bg-red-700",
      "h-8",
      "w-full",
      "rounded-md",
      "text-white",
      "text-xs",
      "justify-center",
      "items-center",
      "mx-auto"
  );
  deleteBtn.addEventListener("click", () => deleteItem(item));
  return deleteBtn;
}

// Create edit button
function createEditButton(item) {
  const editBtn = document.createElement("button");
  editBtn.innerText = "Edit";
  editBtn.classList.add(
      "bg-blue-500",
      "hover:bg-blue-700",
      "h-8",
      "w-full",
      "rounded-md",
      "text-white",
      "text-xs",
      "justify-center",
      "items-center",
      "mx-auto"
  );
  editBtn.addEventListener("click", () => {
    isEditingItem = true;
    document.getElementById("name").value = item.name;
    document.getElementById("link").value = item.link;
    document.getElementById("image").value = item.image;
    document.getElementById("quantity").value = item.quantity;
    console.log("item quantity:", item.quantity);
    localStorage.setItem('led_positions', JSON.stringify(item.position))
    //console.log('LED data:', JSON.parse(localStorage.getItem('led_positions')));
    const selectedValue = item.ip; // The IP to select
    selectEspDropdownIP.selectedIndex = findIndexByIP(selectedValue);
    window.scrollTo({
      top: 10,
      behavior: "auto" // You can change this to "auto" for an instant scroll
    });
    toggleAddForm();
    editingItemId = item.id;
    document.getElementById("save-item").innerHTML = "Save Changes";
    generateGrid();
    // Scroll to the top of the page

  });

  return editBtn;
}
// Create locate button
function createLocateButton(item) {
  const locateBtn = document.createElement("button");
  locateBtn.innerText = "Locate";
  locateBtn.classList.add(
      "bg-blue-500",
      "hover:bg-blue-700",
      "h-8",
      "w-full",
      "rounded-md",
      "text-white",
      "text-xs",
      "justify-center",
      "items-center",
      "mx-auto"
  );
  locateBtn.addEventListener("click", () => {
    fetch(`/api/items/${item.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ action: "locate" }),
    }).catch((error) => console.error(error));
  });
  return locateBtn;
}
// Create add quantity button
function createAddQuantityButton(item) {
  const addQuantityBtn = document.createElement("button");
  addQuantityBtn.innerText = "+";
  addQuantityBtn.classList.add(
      "bg-blue-500",
      "hover:bg-blue-700",
      "h-8",
      "w-8",
      "rounded-full",
      "text-white",
      "text-lg",
      "font-bold",
      "flex",
      "justify-center",
      "items-center",
      "mx-auto"
  );
  addQuantityBtn.addEventListener("click", () => {
    updatedItem = { ...item, quantity: item.quantity + 1 };
    fetch(`/api/items/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedItem),
    })
        .then(() => {
          const li = itemList.querySelector(`li[data-id="${item.id}"]`);
          const updatedLi = createItemElement(updatedItem);
          itemList.replaceChild(updatedLi, li);
        })
        .catch((error) => console.error(error));
  });
  return addQuantityBtn;
}

// Remove quantity
function removeQuantity(item) {
  console.log(`Quantity of ${item.name}: ${item.quantity}`);
}

// Create remove quantity button
function createRemoveQuantityButton(item) {
  const removeQuantityBtn = document.createElement("button");
  removeQuantityBtn.innerText = "-";
  removeQuantityBtn.classList.add(
      "bg-blue-500",
      "hover:bg-red-700",
      "h-8",
      "w-8",
      "rounded-full",
      "text-white",
      "text-lg",
      "font-bold",
      "flex",
      "justify-center",
      "items-center",
      "mx-auto"
  );
  removeQuantityBtn.addEventListener("click", () => {
    if (item.quantity > 0) {
      updatedItem = { ...item, quantity: item.quantity - 1 };
      fetch(`/api/items/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedItem),
      })
          .then(() => {
            const li = itemList.querySelector(`li[data-id="${item.id}"]`);
            const updatedLi = createItemElement(updatedItem);
            itemList.replaceChild(updatedLi, li);
          })
          .catch((error) => console.error(error));
    }
  });
  return removeQuantityBtn;
}

// show quantity
function showQuantity(item) {
  console.log(`Quantity of ${item.name}: ${item.quantity}`);
}

const search = document.getElementById("search");

function filterItems(e) {
  const searchText = e.target.value.toLowerCase();
  const items = itemList.getElementsByTagName("li");

  Array.from(items).forEach((item) => {
    const itemName = item.getElementsByTagName("h2")[0].textContent;
    if (itemName.toLowerCase().indexOf(searchText) !== -1) {
      item.style.display = "flex";
    } else {
      item.style.display = "none";
    }
  });
}

search.addEventListener("input", filterItems);

// Create item element
function createItemElement(item) {
  const li = document.createElement("li");
  li.dataset.id = item.id;
  li.dataset.name = item.name;
  li.dataset.quantity = parseInt(item.quantity, 10);  // Store as numbers
  li.dataset.ip = item.ip;
  li.classList.add("item");

  const wrapper = document.createElement("div");
  wrapper.classList.add(
      "bg-gray-800",
      "text-gray-100",
      "drop-shadow-md",
      "h-full",
      "w-11/12",
      "md:w-full",
      "mx-auto",
      "p-2",
      "rounded-md",
      "grid",
      "grid-cols-1",
      "gap-2",
      "items-center"
  );
  li.appendChild(wrapper);

  const img = document.createElement("img");
  img.src = item.image;
  img.classList.add("h-32", "w-32", "rounded-lg", "mx-auto","bg-gray-800");
  wrapper.appendChild(img);

  const div = document.createElement("div");
  div.classList.add(
      "text-center",
      "text-slate",
      "text-sm",
      "grid",
      "grid-cols-1",
      "gap-2"
  );
  wrapper.appendChild(div);

  const h2 = document.createElement("h2");
  h2.innerText = item.name;
  h2.classList.add(
      "text-lg",
      "text-slate",
      "overflow-hidden",
      "whitespace-nowrap",
      "overflow-ellipsis",
      "hover:whitespace-normal",
  );
  div.appendChild(h2);

  const p = document.createElement("p");
  const a = document.createElement("a");
  a.href = item.link;
  a.target = "_blank";
  a.innerText = "Buy more";
  a.classList.add("hover:font-bold", "hover:underline", "hover:text-blue-700"); // Add hover styles
  p.appendChild(a);
  div.appendChild(p);

  const innerWrapper = document.createElement("div");
  innerWrapper.classList.add("grid", "grid-cols-3", "gap-2");
  div.appendChild(innerWrapper);

  const deleteBtn = createDeleteButton(item);
  innerWrapper.appendChild(deleteBtn);

  const editBtn = createEditButton(item);
  innerWrapper.appendChild(editBtn);

  const locateBtn = createLocateButton(item);
  innerWrapper.appendChild(locateBtn);

  const removeQuantityBtn = createRemoveQuantityButton(item);
  innerWrapper.appendChild(removeQuantityBtn);

  const quantity = document.createElement("span");
  quantity.innerText = item.quantity;
  quantity.classList.add(
      "text-center",
      "text-slate",
      "text-lg",
      "justify-center",
      "items-center",
      "mx-auto",
      "pt-1"
  );
  innerWrapper.appendChild(quantity);

  const addQuantityBtn = createAddQuantityButton(item);
  innerWrapper.appendChild(addQuantityBtn);

  return li;
}

// Load items from server
function loadItems() {
  fetch("/api/items")
      .then((response) => response.json())
      .then((data) => {
        data.forEach((item) => {
          const li = createItemElement(item);
          itemList.appendChild(li);

        });
      })
      .catch((error) => console.error(error));

}

loadItems();


document.getElementById("save-item").addEventListener("click", addItem);
document.getElementById("btn-add").addEventListener("click", function() {isEditingItem = false;});
document.getElementById("btn-add").addEventListener("click", toggleAddForm);
document.getElementById("btn-add").addEventListener("click", populateEspDropdown);
//Function to Ad ESPs
// Function to add an ESP item

function populateEspDropdown() {
  selectEspDropdownIP.innerHTML = "";
  // Add "Add ESP" option at the first position
  const addEspOption = document.createElement("option");
  addEspOption.value = "select";
  addEspOption.textContent = "Select ESP";
  selectEspDropdownIP.appendChild(addEspOption);
  // Fetch and populate the rest of the options
  fetch("/api/esp")
      .then((response) => response.json())
      .then((data) => {
        data.forEach((esp) => {
          const option = document.createElement("option");
          option.value = esp.id;
          option.textContent = esp.esp_ip;
          selectEspDropdownIP.appendChild(option);
        });
      })
      .catch((error) => console.error(error));
}
function findIndexByIP(ip) {
  const options = selectEspDropdownIP.options;
  for (let i = 0; i < options.length; i++) {
    const optionValue = options[i].textContent.trim(); // Trim whitespace from option value
    if (optionValue.toLowerCase() === ip.trim().toLowerCase()) { // Case-insensitive comparison
      return i; // Return the index when the IP matches the selected option value.
    }
  }
  return 0; // Return 0 if no match is found.
}
document.getElementById("sort_method").addEventListener("click", sortItems);
document.getElementById("sort_method").addEventListener("change", sortItems);

// Sorting function
function sortItems() {
  const sortMethod = document.getElementById("sort_method").value;
  updateSortTitle();
  // Get the list of items
  const items = Array.from(itemList.children);
  // Sort the items based on the selected sorting method
  const sortedItems = items.sort((a, b) => {
    const itemA = a.dataset[sortMethod];
    const itemB = b.dataset[sortMethod];
    if (sortMethod === 'quantity') {
      // Convert values to numbers for numeric comparison
      return parseInt(itemA, 10) - parseInt(itemB, 10);
    } else {
      // For other fields, use string comparison
      return itemA.localeCompare(itemB);
    }
  });

  // Clear the current list
  itemList.innerHTML = '';

  // Append the sorted items to the list
  sortedItems.forEach(item => {
    itemList.appendChild(item);
  });
}

function updateSortTitle() {
  var select = document.getElementById("sort_method");
  var selectedOption = select.options[select.selectedIndex];
  var title = document.getElementById("sort_title");

  title.textContent = "Sort by: " + selectedOption.textContent;
}




// Define a function to populate the "select_esp" dropdown
populateEspDropdown();
updateSortTitle();


