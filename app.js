import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

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

// Инициализация Firebase и Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Открытие/закрытие модального окна
const modal = document.getElementById('modal');
const openModalBtn = document.getElementById('open-modal');
const closeModalBtn = document.getElementById('close-modal');

openModalBtn.addEventListener('click', () => {
  modal.style.display = 'flex';
});

closeModalBtn.addEventListener('click', () => {
  modal.style.display = 'none';
});

// Функция для добавления данных в Firestore
async function addData(number, name, initialBalance, incoming, outgoing, finalBalance) {
  try {
    await addDoc(collection(db, "data"), {
      number: number,
      name: name,
      initialBalance: initialBalance,
      incoming: incoming,
      outgoing: outgoing,
      finalBalance: finalBalance
    });
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
      <span>№ ${data.number}: ${data.name} | Начальный остаток: ${data.initialBalance}, Приход: ${data.incoming}, Расход: ${data.outgoing}, Конечный остаток: ${data.finalBalance}</span>
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

// Функция для удаления данных
async function deleteData(docId) {
  try {
    await deleteDoc(doc(db, "data", docId));
    loadData(); // Обновляем список данных
  } catch (e) {
    console.error("Ошибка при удалении документа: ", e);
  }
}

// Обработка отправки формы
document.getElementById('data-form').addEventListener('submit', function(e) {
  e.preventDefault();

  // Получаем значения из полей формы
  const number = document.getElementById('number').value;
  const name = document.getElementById('name').value;
  const initialBalance = parseFloat(document.getElementById('initial-balance').value);
  const incoming = parseFloat(document.getElementById('incoming').value);
  const outgoing = parseFloat(document.getElementById('outgoing').value);
  const finalBalance = initialBalance + incoming - outgoing;

  // Добавляем данные в Firestore
  addData(number, name, initialBalance, incoming, outgoing, finalBalance);

  // Закрываем модальное окно после сохранения
  modal.style.display = 'none';

  // Очищаем поля формы
  document.getElementById('number').value = '';
  document.getElementById('name').value = '';
  document.getElementById('initial-balance').value = '';
  document.getElementById('incoming').value = '';
  document.getElementById('outgoing').value = '';
});

// Загружаем данные при старте страницы
loadData();
