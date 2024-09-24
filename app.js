import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy, limit, getDoc } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-storage.js";

// Конфигурация Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCW4FLiBL59useJxL2P9zXu_pQkeMfieW8",
  authDomain: "editable-db-site.firebaseapp.com",
  projectId: "editable-db-site",
  storageBucket: "editable-db-site.appspot.com",
  messagingSenderId: "508766975047",
  appId: "1:508766975047:web:bf6dc400c95ed25ca06d62",
  measurementId: "G-V9XLXKEHC7"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Открытие/закрытие модального окна
const modal = document.getElementById('modal');
const openModalBtn = document.getElementById('open-modal');
const closeModalBtn = document.getElementById('close-modal');

// Модальное окно для изображения
const imageModal = document.createElement('div');
imageModal.className = 'image-modal';
imageModal.innerHTML = `
  <span class="close-image-modal">&times;</span>
  <img src="" alt="Просмотр изображения">
`;
document.body.appendChild(imageModal);

const closeImageModalBtn = imageModal.querySelector('.close-image-modal');
const modalImage = imageModal.querySelector('img');

// Открытие модального окна для добавления новой записи
openModalBtn.addEventListener('click', async () => {
  const nextNumber = await getNextNumber();
  document.getElementById('number').value = nextNumber;
  modal.style.display = 'flex';
});

// Закрытие модального окна
closeModalBtn.addEventListener('click', () => {
  modal.style.display = 'none';
});

// Закрытие модального окна для изображения
closeImageModalBtn.addEventListener('click', () => {
  imageModal.style.display = 'none';
});

// Функция для автоматического получения следующего номера
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

// Функция для добавления данных
async function addData(number, name, initialBalance, incoming, outgoing, finalBalance, imageUrl) {
  try {
    await addDoc(collection(db, "data"), {
      number,
      name,
      initialBalance,
      incoming,
      outgoing,
      finalBalance,
      imageUrl
    });
    loadData();
    modal.style.display = 'none';
  } catch (e) {
    console.error("Ошибка при добавлении документа: ", e);
    alert("Ошибка при добавлении данных.");
  }
}

// Функция для загрузки изображения в Firebase Storage
async function uploadImage(file) {
  const storageRef = ref(storage, 'images/' + file.name);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
}

// Обработка отправки формы
document.getElementById('data-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const number = parseInt(document.getElementById('number').value);
  const name = document.getElementById('name').value;
  const initialBalance = parseFloat(document.getElementById('initial-balance').value);
  const incoming = parseFloat(document.getElementById('incoming').value);
  const outgoing = parseFloat(document.getElementById('outgoing').value);
  const file = document.getElementById('image').files[0];

  if (!name || isNaN(initialBalance) || isNaN(incoming) || isNaN(outgoing)) {
    alert('Пожалуйста, заполните все поля правильно.');
    return;
  }

  let imageUrl = '';
  if (file) {
    imageUrl = await uploadImage(file);
  }

  const finalBalance = initialBalance + incoming - outgoing;
  await addData(number, name, initialBalance, incoming, outgoing, finalBalance, imageUrl);

  document.getElementById('number').value = '';
  document.getElementById('name').value = '';
  document.getElementById('initial-balance').value = '';
  document.getElementById('incoming').value = '';
  document.getElementById('outgoing').value = '';
  document.getElementById('image').value = '';

  loadData();
});

// Функция для загрузки данных
async function loadData() {
  const q = query(collection(db, "data"), orderBy("number", "asc"));
  const querySnapshot = await getDocs(q);
  const dataList = document.getElementById('data-list');
  dataList.innerHTML = '';

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
      <td>
        ${data.imageUrl ? `<img src="${data.imageUrl}" alt="image" class="clickable-image" width="50">` : 'Нет изображения'}
      </td>
      <td>
        <button class="edit-button" data-id="${docSnapshot.id}">Редактировать</button>
        <button class="delete-button" data-id="${docSnapshot.id}">Удалить</button>
      </td>
    `;
    dataList.appendChild(row);
  });

  document.querySelectorAll('.delete-button').forEach(button => {
    button.addEventListener('click', function() {
      const docId = this.getAttribute('data-id');
      deleteData(docId);
    });
  });

  document.querySelectorAll('.clickable-image').forEach(image => {
    image.addEventListener('click', function() {
      modalImage.src = this.src;
      imageModal.style.display = 'flex'; // Открываем модальное окно с изображением
    });
  });

  document.querySelectorAll('.edit-button').forEach(button => {
    button.addEventListener('click', function() {
      const docId = this.getAttribute('data-id');
      editData(docId);
    });
  });

  // Добавляем возможность редактирования ячеек
  document.querySelectorAll('.editable').forEach(cell => {
    cell.addEventListener('click', handleCellEdit);
  });
}

// Обработчик редактирования ячеек
function handleCellEdit(event) {
  const cell = event.target;

  if (cell.querySelector('input')) return;

  const originalValue = cell.textContent;
  const input = document.createElement('input');
  const saveBtn = document.createElement('button');
  input.type = 'text';
  input.value = originalValue;
  saveBtn.textContent = 'ОК';
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
      const fieldValue = isNaN(parseFloat(newValue)) ? newValue : parseFloat(newValue);
      await updateDoc(doc(db, "data", docId), { [field]: fieldValue });

      if (['initialBalance', 'incoming', 'outgoing'].includes(field)) {
        const updatedDoc = await getDoc(doc(db, "data", docId));
        const updatedData = updatedDoc.data();
        const finalBalance = updatedData.initialBalance + updatedData.incoming - updatedData.outgoing;
        await updateDoc(doc(db, "data", docId), { finalBalance: finalBalance });
      }
    }
    loadData();
  });

  input.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
      saveBtn.click();
    }
  });
}

// Функция для редактирования записи
async function editData(docId) {
  const docRef = doc(db, "data", docId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    const nameField = document.querySelector(`td[data-id='${docId}'][data-field='name']`);
    const initialBalanceField = document.querySelector(`td[data-id='${docId}'][data-field='initialBalance']`);
    const incomingField = document.querySelector(`td[data-id='${docId}'][data-field='incoming']`);
    const outgoingField = document.querySelector(`td[data-id='${docId}'][data-field='outgoing']`);

    // Устанавливаем поля для редактирования
    nameField.innerHTML = `<input type="text" value="${data.name}">`;
    initialBalanceField.innerHTML = `<input type="number" value="${data.initialBalance}">`;
    incomingField.innerHTML = `<input type="number" value="${data.incoming}">`;
    outgoingField.innerHTML = `<input type="number" value="${data.outgoing}">`;
  }
}

// Функция для удаления данных
async function deleteData(docId) {
  try {
    await deleteDoc(doc(db, "data", docId));
    loadData();
  } catch (e) {
    console.error("Ошибка при удалении документа: ", e);
    alert("Ошибка при удалении данных.");
  }
}

loadData();
