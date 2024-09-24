// Firebase конфигурация
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Функция для добавления данных в Firestore
async function addData(name, value) {
    try {
        const docRef = await db.collection("data").add({
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
    const querySnapshot = await db.collection("data").get();
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
        await db.collection("data").doc(docId).delete();
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
