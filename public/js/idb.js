// create variable for db connection
let db;

// establish a connection to IndexedDB database and set to version 1
const request = indexedDB.open('budget_tracker', 1);

// this is for if database version changes.
request.onupgradeneeded = function(event) {

    // database reference
    const db = event.target.result;

    // create new_transation which is an object store (table), set so it auto increments
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

// if successful
request.onsuccess = function(event) {

    // save reference to db in global variable
    db = event.target.result;
  
    // check for is app is online, if yes function runs
    if (navigator.onLine) {
      uploadTransaction();
    }
  };
  
  request.onerror = function(event) {
    // log error 
    console.log(event.target.errorCode);
};

// function will run if there is no internet connection
function saveRecord(record) {

    // read and write permissions for new transaction
    const transaction = db.transaction(['new_transaction'], 'readwrite');
  
    // object store for `new_transaction`
    const  budgetObjectStore = transaction.objectStore('new_transaction');
  
    // add method to add record to the store.
    budgetObjectStore.add(record);
};

function uploadTransaction() {

    // open a transaction
    const transaction = db.transaction(['new_transaction'], 'readwrite');
  
    // access the object store
    const budgetObjectStore = transaction.objectStore('new_transaction');
  
    // get all records and set to variable
    const getAll = budgetObjectStore.getAll();
  
    getAll.onsuccess = function() {

    // send stored data to the api server.
    if (getAll.result.length > 0) {
      fetch('/api/transaction', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      })
        .then(response => response.json())
        .then(serverResponse => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }

          // open another transaction
          const transaction = db.transaction(['new_transaction'], 'readwrite');

          // access the new_transaction 
          const budgetObjectStore = transaction.objectStore('new_transaction');
          
          // clear all items
          budgetObjectStore.clear();

          alert('All saved transactions has been submitted!');
        })
        .catch(err => {
          console.log(err);
        });
    }
  }
};

// listen for app to come back online
window.addEventListener('online', uploadTransaction);