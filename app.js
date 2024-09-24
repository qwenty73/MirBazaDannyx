// Импорт необходимых функций из SDK
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";

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
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Функция для добавления данных в Firestore
async function addData(name, value) {
    try {
        const docRef = await addDoc(collection(db, "data"), {
            name: name,
            value: value
        });
        console.log("Document written with ID: ", docRef.id);
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}

// Функция для загрузки данных из Firestore
async function loadData() {
    const querySnapshot = await getDocs(collection(db, "data"));
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
        addData(name, value).then(() => {
            // Загружаем обновленные данные
            loadData();
        });

        // Очистка полей
        document.getElementById('name').value = '';
        document.getElementById('value').value = '';
    }
});

// Загрузка данных при загрузке страницы
loadData();
