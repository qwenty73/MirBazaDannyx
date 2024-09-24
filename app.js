import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

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

openModalBtn.addEventListener('click', async () => {
  const nextNumber = await getNextNumber(); // Получаем следующий номер
  document.getElementById('number').value = nextNumber; // Устанавливаем значение в поле номера
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
    const q = query(collection(db, "data"), orderBy("number", "asc")); // Сортируем по возрастанию поля "number"
    const querySnapshot = await getDocs(q);
    const dataList = document.getElementById('data-list');
    dataList.innerHTML = ''; // Очищаем текущий список

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
        <td><button class="delete-button" data-id="${docSnapshot.id}">Удалить</button></td>
      `;
      dataList.appendChild(row);
    });

    // Добавляем обработчик событий для всех кнопок "Удалить"
    document.querySelectorAll('.delete-button').forEach(button => {
      button.addEventListener('click', function() {
        const docId = this.getAttribute('data-id');
        deleteData(docId);
      });
    });

    // Добавляем возможность редактирования ячеек
    document.querySelectorAll('.editable').forEach(cell => {
      cell.addEventListener('click', handleCellEdit);
    });

  } catch (e) {
    console.error("Ошибка при загрузке данных: ", e);
  }
}

// Обработчик редактирования ячеек
function handleCellEdit(event) {
  const cell = event.target;
  const originalValue = cell.textContent;
  const input = document.createElement('input');
  input.type = 'text';
  input.value = originalValue;
  cell.textContent = ''; // Очищаем ячейку перед вставкой инпута
  cell.appendChild(input);
  input.focus();

  // Обработка завершения редактирования
  input.addEventListener('blur', async () => {
    const newValue = input.value.trim();
    if (newValue !== originalValue) {
      const docId = cell.getAttribute('data-id');
      const field = cell.getAttribute('data-field');
      const fieldValue = isNaN(parseFloat(newValue)) ? newValue : parseFloat(newValue); // Проверка, если это число или текст
      await updateDoc(doc(db, "data", docId), { [field]: fieldValue });

      // Пересчитываем конечный остаток, если изменены приход, расход или начальный остаток
      if (['initialBalance', 'incoming', 'outgoing'].includes(field)) {
        const updatedDoc = await getDoc(doc(db, "data", docId));
        const updatedData = updatedDoc.data();
        const finalBalance = updatedData.initialBalance + updatedData.incoming - updatedData.outgoing;
        await updateDoc(doc(db, "data", docId), { finalBalance: finalBalance });
      }
    }
    loadData(); // Обновляем данные
  });

  // Если нажата клавиша Enter
  input.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
      input.blur();
    }
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

// Обработка отправки формы
document.getElementById('data-form').addEventListener('submit', async function(e) {
  e.preventDefault();

  // Получаем значения из полей формы
  const number = parseInt(document.getElementById('number').value);
  const name = document.getElementById('name').value;
  const initialBalance = parseFloat(document.getElementById('initial-balance').value);
  const incoming = parseFloat(document.getElementById('incoming').value);
  const outgoing = parseFloat(document.getElementById('outgoing').value);

  if (!name || isNaN(initialBalance) || isNaN(incoming) || isNaN(outgoing)) {
    alert('Пожалуйста, заполните все поля правильно.');
    return;
  }

  const finalBalance = initialBalance + incoming - outgoing;

  // Добавляем данные в Firestore
  addData(number, name, initialBalance, incoming, outgoing, finalBalance);

  // Очищаем поля формы
  document.getElementById('number').value = '';
  document.getElementById('name').value = '';
  document.getElementById('initial-balance').value = '';
  document.getElementById('incoming').value = '';
  document.getElementById('outgoing').value = '';
});

// Загружаем данные при старте страницы
loadData();
