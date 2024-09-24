import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy, limit, getDoc } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-storage.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCW4FLiBL59useJxL2P9zXu_pQkeMfieW8",
  authDomain: "editable-db-site.firebaseapp.com",
  projectId: "editable-db-site",
  storageBucket: "editable-db-site.appspot.com",
  messagingSenderId: "508766975047",
  appId: "1:508766975047:web:bf6dc400c95ed25ca06d62",
  measurementId: "G-V9XLXKEHC7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Modal handling for adding records
const modal = document.getElementById('modal');
const openModalBtn = document.getElementById('open-modal');
const closeModalBtn = document.getElementById('close-modal');

// Open modal for adding new record
openModalBtn.addEventListener('click', async () => {
  const nextNumber = await getNextNumber();
  document.getElementById('number').value = nextNumber;
  modal.style.display = 'flex';
});

// Close modal
closeModalBtn.addEventListener('click', () => {
  modal.style.display = 'none';
});

// Get next available number for a new entry
async function getNextNumber() {
  const q = query(collection(db, "data"), orderBy("number", "desc"), limit(1));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    const lastDoc = querySnapshot.docs[0].data();
    return lastDoc.number + 1;
  } else {
    return 1;
  }
}

// Add new data to Firestore
async function addData(number, name, initialBalance, incoming, outgoing, finalBalance, imageUrl) {
  try {
    await addDoc(collection(db, "data"), {
      number,
      name,
      initialBalance,
      incoming,
      outgoing,
      finalBalance,
      imageUrl,
      dateModified: new Date().toLocaleString()
    });
    loadData(); // Reload the data after adding
    modal.style.display = 'none'; // Close modal
  } catch (e) {
    console.error("Error adding document: ", e);
    alert("Error adding data.");
  }
}

// Upload image to Firebase Storage
async function uploadImage(file) {
  const storageRef = ref(storage, 'images/' + file.name);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
}

// Form submission
document.getElementById('data-form').addEventListener('submit', async function(e) {
  e.preventDefault();

  const number = parseInt(document.getElementById('number').value);
  const name = document.getElementById('name').value;
  const initialBalance = parseFloat(document.getElementById('initial-balance').value);
  const incoming = parseFloat(document.getElementById('incoming').value);
  const outgoing = parseFloat(document.getElementById('outgoing').value);
  const file = document.getElementById('image').files[0];

  if (!name || isNaN(initialBalance) || isNaN(incoming) || isNaN(outgoing)) {
    alert('Please fill out all fields correctly.');
    return;
  }

  let imageUrl = '';
  if (file) {
    imageUrl = await uploadImage(file);
  }

  const finalBalance = initialBalance + incoming - outgoing;
  await addData(number, name, initialBalance, incoming, outgoing, finalBalance, imageUrl);

  // Clear form fields
  document.getElementById('number').value = '';
  document.getElementById('name').value = '';
  document.getElementById('initial-balance').value = '';
  document.getElementById('incoming').value = '';
  document.getElementById('outgoing').value = '';
  document.getElementById('image').value = '';
});

// Load data from Firestore and populate the table
async function loadData() {
  const q = query(collection(db, "data"), orderBy("number", "asc"));
  const querySnapshot = await getDocs(q);
  const dataList = document.getElementById('data-list');
  dataList.innerHTML = ''; // Clear existing data

  querySnapshot.forEach((docSnapshot) => {
    const data = docSnapshot.data();
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${data.number}</td>
      <td class="editable" data-id="${docSnapshot.id}" data-field="name">${data.name}</td>
      <td class="editable" data-id="${docSnapshot.id}" data-field="initialBalance">${data.initialBalance}</td>
      <td class="editable" data-id="${docSnapshot.id}" data-field="incoming">${data.incoming}</td>
      <td class="editable" data-id="${docSnapshot.id}" data-field="outgoing">${data.outgoing}</td>
      <td>${data.finalBalance}</td>
      <td>${data.imageUrl ? `<img src="${data.imageUrl}" alt="image" class="table-image" width="50">` : 'No image'}</td>
      <td>${data.dateModified || 'Not modified'}</td>
      <td>
        <button class="edit-button" data-id="${docSnapshot.id}">Edit</button>
        <button class="delete-button" data-id="${docSnapshot.id}">Delete</button>
      </td>
    `;
    dataList.appendChild(row);
  });

  // Add delete functionality
  document.querySelectorAll('.delete-button').forEach(button => {
    button.addEventListener('click', function() {
      const docId = this.getAttribute('data-id');
      deleteData(docId);
    });
  });

  // Enable cell editing
  document.querySelectorAll('.editable').forEach(cell => {
    cell.addEventListener('click', handleCellEdit);
  });

  // Add click event for image enlargement
  document.querySelectorAll('.table-image').forEach(img => {
    img.addEventListener('click', handleImageEnlarge);
  });
}

// Edit cell functionality
function handleCellEdit(event) {
  const cell = event.target;

  if (cell.querySelector('input')) return;

  const originalValue = cell.textContent;
  const input = document.createElement('input');
  const saveBtn = document.createElement('button');
  input.type = 'text';
  input.value = originalValue;
  saveBtn.textContent = 'OK';
  saveBtn.className = 'save-button';

  cell.textContent = '';
  cell.appendChild(input);
  cell.appendChild(saveBtn);
  input.focus();

  saveBtn.addEventListener('click', async () => {
    const newValue = input.value.trim();
    if (newValue !== originalValue) {
      const docId = cell.getAttribute('data-id');
      const field = cell.getAttribute('data-field');
      const numericFields = ['initialBalance', 'incoming', 'outgoing'];
      const fieldValue = numericFields.includes(field) ? parseFloat(newValue) : newValue;

      await updateDoc(doc(db, "data", docId), { [field]: fieldValue, dateModified: new Date().toLocaleString() });

      // Recalculate final balance if necessary
      if (numericFields.includes(field)) {
        const updatedDoc = await getDoc(doc(db, "data", docId));
        const updatedData = updatedDoc.data();
        const finalBalance = updatedData.initialBalance + updatedData.incoming - updatedData.outgoing;
        await updateDoc(doc(db, "data", docId), { finalBalance: finalBalance });
      }
    }
    loadData(); // Refresh the data after editing
  });

  input.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
      saveBtn.click();
    }
  });
}

// Enlarge image functionality
function handleImageEnlarge(event) {
  const imageModal = document.getElementById('image-modal');
  const modalImg = imageModal.querySelector('img');
  modalImg.src = event.target.src;
  imageModal.style.display = 'flex';

  // Close enlarged image
  document.querySelector('.close-image-modal').addEventListener('click', () => {
    imageModal.style.display = 'none';
  });
}

// Delete data
async function deleteData(docId) {
  try {
    await deleteDoc(doc(db, "data", docId));
    loadData(); // Refresh the table after deletion
  } catch (e) {
    console.error("Error deleting document: ", e);
    alert("Error deleting data.");
  }
}

// Load data when the page loads
loadData();
// ... другие функции

// Функция для поиска и выделения текста в таблице
document.getElementById('search-input').addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    const rows = document.querySelectorAll('#data-table tbody tr');

    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        let found = false;

        cells.forEach(cell => {
            const cellText = cell.textContent.toLowerCase();

            // Убираем предыдущее выделение
            cell.innerHTML = cell.textContent;

            // Проверяем наличие строки поиска в ячейке
            if (searchTerm && cellText.includes(searchTerm)) {
                found = true;
                const regex = new RegExp(`(${searchTerm})`, 'gi');
                cell.innerHTML = cell.textContent.replace(regex, '<span class="highlight">$1</span>');
            }
        });

        // Показываем только те строки, которые содержат совпадение
        row.style.display = found ? '' : 'none';
    });
});

// Остальная логика загрузки и редактирования данных
