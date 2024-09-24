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
const imageModal = document.getElementById('image-modal');
const modalImage = document.getElementById('modal-image');
const closeImageModal = document.getElementById('close-image-modal');

// Открытие модального окна для добавления новой записи
openModalBtn.addEventListener('click', async () => {
  document.getElementById('doc-id').value = ''; // Очистить скрытое поле ID документа
  const nextNumber = await getNextNumber(); // Получаем следующий номер
  document.getElementById('number').value = nextNumber; // Устанавливаем значение в поле номера
  modal.style.display = 'flex';
});

// Закрытие модального окна
closeModalBtn.addEventListener('click', () => {
  modal.style.display = 'none';
});

// Закрытие модального окна с изображением
closeImageModal.addEventListener('click', () => {
  imageModal.style.display = 'none';
});

// Функция для автоматического получения следующего номера
async function getNextNumber() {
  const q = query(collection(db, "data"), orderBy("number", "desc"), limit(1)); // Находим запись с максимальным номером
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    const lastDoc = querySnapshot.docs[0].data();
    return lastDoc.number + 1; // Возвращаем следующий номер
  } else {
    return 1; // Если записей нет, начинаем с 1
  }
}

// Функция для добавления/обновления данных
async function saveData(docId, number, name, initialBalance, incoming, outgoing, finalBalance, imageUrl) {
  try {
    if (docId) {
      await updateDoc(doc(db, "data", docId), {
        number,
        name,
        initialBalance,
        incoming,
        outgoing,
        finalBalance,
        imageUrl
      });
    } else {
      await addDoc(collection(db, "data"), {
        number,
        name,
        initialBalance,
        incoming,
        outgoing,
        finalBalance,
        imageUrl
      });
    }
    loadData(); // Обновляем список данных
    modal.style.display = 'none'; // Закрываем модальное окно после успешного добавления
  } catch (e) {
    console.error("Ошибка при добавлении документа: ", e);
    alert("Ошибка при добавлении данных.");
  }
}

// Функция для загрузки изображения в Firebase Storage
async function uploadImage(file) {
  const storageRef = ref(storage, 'images/' + file.name);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref); // Возвращаем URL загруженного изображения
}

// Обработка отправки формы
document.getElementById('data-form').addEventListener('submit', async function(e) {
  e.preventDefault();

  // Получаем значения из полей формы
  const docId = document.getElementById('doc-id').value;
  const number = parseInt(document.getElementById('number').value);
  const name = document.getElementById('name').value;
  const initialBalance = parseFloat(document.getElementById('initial-balance').value);
  const incoming = parseFloat(document.getElementById('incoming').value);
  const outgoing = parseFloat(document.getElementById('outgoing').value);
  const file = document.getElementById('image').files[0]; // Получаем выбранный файл

  if (!name || isNaN(initialBalance) || isNaN(incoming) || isNaN(outgoing)) {
    alert('Пожалуйста, заполните все поля правильно.');
    return;
  }

  // Загружаем изображение и получаем его URL
  let imageUrl = '';
  if (file) {
    imageUrl = await uploadImage(file);
  }

  const finalBalance = initialBalance + incoming - outgoing;

  // Сохраняем данные в Firestore
  await saveData(docId, number, name, initialBalance, incoming, outgoing, finalBalance, imageUrl);

  // Очищаем поля формы
  document.getElementById('doc-id').value = '';
  document.getElementById('number').value = '';
  document.getElementById('name').value = '';
  document.getElementById('initial-balance').value = '';
  document.getElementById('incoming').value = '';
  document.getElementById('outgoing').value = '';
  document.getElementById('image').value = ''; // Очищаем поле выбора файла
});

// Функция для загрузки данных
async function loadData() {
  const q = query(collection(db, "data"), orderBy("number", "asc"));
  const querySnapshot = await getDocs(q);
  const dataList = document.getElementById('data-list');
  dataList.innerHTML = ''; // Очищаем список

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
      <td>${data.imageUrl ? `<img src="${data.imageUrl}" class="image-preview" alt="image" width="50">` : 'Нет изображения'}</td>
      <td>
        <button class="edit-button" data-id="${docSnapshot.id}">Редактировать</button>
        <button class="delete-button" data-id="${docSnapshot.id}">Удалить</button>
      </td>
    `;
    dataList.appendChild(row);
  });

  // Добавляем обработчики для удаления и редактирования
  document.querySelectorAll('.delete-button').forEach(button => {
    button.addEventListener('click', function() {
      const docId = this.getAttribute('data-id');
      deleteData(docId);
    });
  });

  document.querySelectorAll('.edit-button').forEach(button => {
    button.addEventListener('click', async function() {
      const docId = this.getAttribute('data-id');
      const docRef = doc(db, "data", docId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        document.getElementById('doc-id').value = docId;
        document.getElementById('number').value = data.number;
        document.getElementById('name').value = data.name;
        document.getElementById('initial-balance').value = data.initialBalance;
        document.getElementById('incoming').value = data.incoming;
        document.getElementById('outgoing').value = data.outgoing;
        modal.style.display = 'flex';
      } else {
        alert("Запись не найдена.");
      }
    });
  });

  // Добавляем обработчик для увеличения изображений
  document.querySelectorAll('.image-preview').forEach(image => {
    image.addEventListener('click', function() {
      modalImage.src = this.src;
      imageModal.style.display = 'block';
    });
  });
}

// Функция для удаления данных
async function deleteData(docId) {
  try {
    await deleteDoc(doc(db, "data", docId));
    loadData(); // Обновляем список данных
  } catch (e) {
    console.error("Ошибка при удалении документа: ", e);
    alert("Ошибка при удалении данных.");
  }
}

// Загружаем данные при старте страницы
loadData();
