// Импорт необходимых функций из Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-analytics.js";

// Ваша конфигурация Firebase
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
const analytics = getAnalytics(app);

// Инициализация Firestore
const db = getFirestore(app);

// Функция для добавления данных в Firestore
async function addData(name, value) {
  try {
    const docRef = await addDoc(collection(db, "data"), {
      name: name,
      value: value
    });
    console.log("Документ добавлен с ID: ", docRef.id);
    loadData(); // Обновляем список данных
  } catch (e) {
    console.error("Ошибка при добавлении документа: ", e);
  }
}

// Функция для загрузки данных из Firestore
async function loadData() {
  const querySnapshot = await getDocs(collection(db, "data"));
  const dataList = document.getElementById('data-list');
  dataList.innerHTML = ''; // Очищаем текущий список

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const listItem = document.createElement('li');
    listItem.innerHTML = `
      <span>${data.name}: ${data.value}</span>
      <button class="delete-button" data-id="${doc.id}">Удалить</button>
    `;
    dataList.appendChild(listItem);
  });

  // Добавляем обработчик событий для всех кнопок "Удалить"
  document.querySelectorAll('.delete-button').forEach(button => {
    button.addEventListener('click', function() {
      const docId = this.getAttribute('data-id');
      deleteData(docId);
    });
  });
}

// Функция для удаления данных из Firestore
async function deleteData(docId) {
  try {
    await deleteDoc(doc(db, "data", docId));
    console.log("Документ с ID: " + docId + " был удален");
    loadData(); // Обновляем список данных после удаления
  } catch (e) {
    console.error("Ошибка при удалении документа: ", e);
  }
}

// Обработка отправки формы
document.getElementById('data-form').addEventListener('submit', function(e) {
  e.preventDefault(); // Предотвращаем отправку формы по умолчанию

  // Получаем значения из полей формы
  const name = document.getElementById('name').value;
  const value = document.getElementById('value').value;

  if (name && value) {
    // Добавляем данные в Firestore
    addData(name, value);

    // Очищаем поля формы после отправки
    document.getElementById('name').value = '';
    document.getElementById('value').value = '';
  }
});

// Загружаем данные при старте страницы
loadData();
