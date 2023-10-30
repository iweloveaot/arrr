// Получение ссылок на элементы UI
let connectButton = document.getElementById('connect');
let disconnectButton = document.getElementById('disconnect');
let terminalContainer = document.getElementById('terminal');
let sendForm = document.getElementById('send-form');
let inputField = document.getElementById('input');
// Кэш объекта выбранного устройства
let deviceCache = null;
// Кэш объекта характеристики
let characteristicCache = null;

// Подключение к устройству при нажатии на кнопку Connect
connectButton.addEventListener('click', function() {
  connect();
});

// Отключение от устройства при нажатии на кнопку Disconnect
disconnectButton.addEventListener('click', function() {
  disconnect();
});

// Обработка события отправки формы
sendForm.addEventListener('submit', function(event) {
  event.preventDefault(); // Предотвратить отправку формы
  send(inputField.value); // Отправить содержимое текстового поля
  inputField.value = '';  // Обнулить текстовое поле
  inputField.focus();     // Вернуть фокус на текстовое поле
});

// Запустить выбор Bluetooth устройства и подключиться к выбранному
function connect() {
    return (deviceCache ? Promise.resolve(deviceCache) :
        requestBluetoothDevice()).
        then(device => connectDeviceAndCacheCharacteristic(device)).
        then(characteristic => startNotifications(characteristic)).
        catch(error => log(error));
}

// Запрос выбора Bluetooth устройства
function requestBluetoothDevice() {
    log('Requesting bluetooth device...');
  
    return navigator.bluetooth.requestDevice({
      filters: [{services: [0xFFE0]}],
    }).
        then(device => {
          log('"' + device.name + '" bluetooth device selected');
          deviceCache = device;
  
          return deviceCache;
        });
  }
  
 // Подключение к определенному устройству, получение сервиса и характеристики
function connectDeviceAndCacheCharacteristic(device) {
    if (device.gatt.connected && characteristicCache) {
      return Promise.resolve(characteristicCache);
    }
  
    log('Connecting to GATT server...');
  
    return device.gatt.connect().
        then(server => {
          log('GATT server connected, getting service...');
  
          return server.getPrimaryService(0xFFE0);
        }).
        then(service => {
          log('Service found, getting characteristic...');
  
          return service.getCharacteristic(0xFFE1);
        }).
        then(characteristic => {
          log('Characteristic found');
          characteristicCache = characteristic;
  
          return characteristicCache;
        });
  }
  
  // Включение получения уведомлений об изменении характеристики
function startNotifications(characteristic) {
    log('Starting notifications...');
  
    return characteristic.startNotifications().
        then(() => {
          log('Notifications started');
        });
  }
  
  // Вывод в терминал
function log(data, type = '') {
    terminalContainer.insertAdjacentHTML('beforeend',
        '<div' + (type ? ' class="' + type + '"' : '') + '>' + data + '</div>');
  }

// Отключиться от подключенного устройства
function disconnect() {
  //
}

// Отправить данные подключенному устройству
function send(data) {
  //
}