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
    modal.style.display = 'none'; // Закрываем модальное окно после успешного добавления
  } catch (e) {
    console.error("Ошибка при добавлении документа: ", e);
    alert("Ошибка при добавлении данных.");
  }
}

// Функция для загрузки данных из Firestore
async function loadData() {
  try {
    const querySnapshot = await getDocs(collection(db, "data"));
    const dataList = document.getElementById('data-list');
    dataList.innerHTML = ''; // Очищаем текущий список

    let index = 1; // Счётчик для нумерации
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${index}</td>
        <td>${data.name}</td>
        <td>${data.initialBalance}</td>
        <td>${data.incoming}</td>
        <td>${data.outgoing}</td>
        <td>${data.finalBalance}</td>
        <td><button class="delete-button" data-id="${doc.id}">Удалить</button></td>
      `;
      dataList.appendChild(row);
      index++; // Увеличиваем индекс для следующей записи
    });

    // Добавляем обработчик событий для всех кнопок "Удалить"
    document.querySelectorAll('.delete-button').forEach(button => {
      button.addEventListener('click', function() {
        const docId = this.getAttribute('data-id');
        deleteData(docId);
      });
    });
  } catch (e) {
    console.error("Ошибка при загрузке данных: ", e);
  }
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

// Функция для автоматического получения текущей позиции (последовательного номера)
async function getNextNumber() {
  const querySnapshot = await getDocs(collection(db, "data"));
  return querySnapshot.size + 1; // Следующий номер - это количество текущих записей + 1
}

// Обработка отправки формы
document.getElementById('data-form').addEventListener('submit', async function(e) {
  e.preventDefault();

  // Получаем значения из полей формы
  const name = document.getElementById('name').value;
  const initialBalance = parseFloat(document.getElementById('initial-balance').value);
  const incoming = parseFloat(document.getElementById('incoming').value);
  const outgoing = parseFloat(document.getElementById('outgoing').value);

  if (!name || isNaN(initialBalance) || isNaN(incoming) || isNaN(outgoing)) {
    alert('Пожалуйста, заполните все поля правильно.');
    return;
  }

  const finalBalance = initialBalance + incoming - outgoing;

  // Получаем следующий номер автоматически
  const nextNumber = await getNextNumber();

  // Добавляем данные в Firestore
  addData(nextNumber, name, initialBalance, incoming, outgoing, finalBalance);

  // Очищаем поля формы
  document.getElementById('name').value = '';
  document.getElementById('initial-balance').value = '';
  document.getElementById('incoming').value = '';
  document.getElementById('outgoing').value = '';
});

// Загружаем данные при старте страницы
loadData();
