// Firebase конфигурация
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
firebase.initializeApp(firebaseConfig);
firebase.analytics();
const db = firebase.firestore();

// Функция для добавления данных в Firestore
async function addData(name, value) {
    try {
        const docRef = await db.collection("data").add({
            name: name,
            value: value
        });
        console.log("Документ добавлен с ID: ", docRef.id);
        loadData();
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
        const newItem = document.createElement('li');
        newItem.textContent = `${data.name}: ${data.value}`;
        dataList.appendChild(newItem);
    });
}

// Обработка события отправки формы
document.getElementById('data-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const value = document.getElementById('value').value;

    if (name && value) {
        // Добавляем данные в Firestore
        addData(name, value);
        // Очистка полей
        document.getElementById('name').value = '';
        document.getElementById('value').value = '';
    }
});

// Загружаем данные при старте страницы
loadData();
// Функция для извлечения параметров из URL
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Получаем параметры 'name' и 'value' из URL
const nameFromUrl = getQueryParam('name');
const valueFromUrl = getQueryParam('value');

if (nameFromUrl && valueFromUrl) {
    // Если параметры существуют, добавляем их в Firestore
    addData(nameFromUrl, valueFromUrl);
}

