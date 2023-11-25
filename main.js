// Получение ссылок на элементы UI
let isFirstUse = true;
let connectButton = document.getElementById('connect');
let disconnectButton = document.getElementById('disconnect');
let terminalContainer = document.getElementById('terminal');
let sendForm = document.getElementById('send-form');
let inputField = document.getElementById('input');
// Кэш объекта выбранного устройства
let deviceCache = null;
// Кэш объекта характеристики
let characteristicCache = null;
let installPrompt = null;
const installButton = document.getElementById("install-button");
const aboutDialog = document.getElementById("about-dialog");

const isSidebarPWA = (() => {
  if (navigator.userAgentData) {
    return navigator.userAgentData.brands.some(b => {
      return b.brand === "Edge Side Panel";
    });
  }

  return false;
})();

// Whether we are running as an installed PWA or not.
const isInstalledPWA = window.matchMedia('(display-mode: window-controls-overlay)').matches ||
                       window.matchMedia('(display-mode: standalone)').matches;

if (isFirstUse && !isInstalledPWA && !isSidebarPWA) {
    aboutDialog.showModal();
    isFirstUse = false;
  }

if (!isInstalledPWA && !isSidebarPWA) {
  window.addEventListener('beforeinstallprompt', e => {
    // Don't let the default prompt go.
    e.preventDefault();

    // Instead, wait for the user to click the install button.
    aboutDialog.addEventListener('close', () => {
      if (aboutDialog.returnValue === "install") {
        e.prompt();
      }
    });
  });
} else {
  installButton.disabled = true;
}

addEventListener('appinstalled', () => {
  aboutDialog.close();
});

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
          deviceCache.addEventListener('gattserverdisconnected',
            handleDisconnection);

          return deviceCache;
        });
  }

// Обработчик разъединения
function handleDisconnection(event) {
    let device = event.target;

    log('"' + device.name +
        '" bluetooth device disconnected, trying to reconnect...');

    connectDeviceAndCacheCharacteristic(device).
        then(characteristic => startNotifications(characteristic)).
        catch(error => log(error));
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
          characteristic.addEventListener('characteristicvaluechanged',
            handleCharacteristicValueChanged);
        });

  }

  // Вывод в терминал
function log(data, type = '') {
    terminalContainer.insertAdjacentHTML('beforeend',
        '<div' + (type ? ' class="' + type + '"' : '') + '>' + data + '</div>');
  }

// Отключиться от подключенного устройства
function disconnect() {
    if (deviceCache) {
      log('Disconnecting from "' + deviceCache.name + '" bluetooth device...');
      deviceCache.removeEventListener('gattserverdisconnected',
          handleDisconnection);

      if (deviceCache.gatt.connected) {
        deviceCache.gatt.disconnect();
        log('"' + deviceCache.name + '" bluetooth device disconnected');
      }
      else {
        log('"' + deviceCache.name +
            '" bluetooth device is already disconnected');
      }
    }
    if (characteristicCache) {
      characteristicCache.removeEventListener('characteristicvaluechanged',
          handleCharacteristicValueChanged);
      characteristicCache = null;
    }

    deviceCache = null;
}

// Промежуточный буфер для входящих данных
let readBuffer = '';

// Получение данных
function handleCharacteristicValueChanged(event) {
  let value = new TextDecoder().decode(event.target.value);

  for (let c of value) {
    if (c === '\n') {
      let data = readBuffer.trim();
      readBuffer = '';

      if (data) {
        receive(data);
      }
    }
    else {
      readBuffer += c;
    }
  }
}

// Обработка полученных данных
function receive(data) {
  log(data, 'in');
}

// Отправить данные подключенному устройству
function send(data) {
  data = String(data);

  if (!data || !characteristicCache) {
    return;
  }

  data += '\n';

  if (data.length > 20) {
    let chunks = data.match(/(.|[\r\n]){1,20}/g);

    writeToCharacteristic(characteristicCache, chunks[0]);

    for (let i = 1; i < chunks.length; i++) {
      setTimeout(() => {
        writeToCharacteristic(characteristicCache, chunks[i]);
      }, i * 100);
    }
  }
  else {
    writeToCharacteristic(characteristicCache, data);
  }

  log(data, 'out');
}

// Записать значение в характеристику
function writeToCharacteristic(characteristic, data) {
  characteristic.writeValue(new TextEncoder().encode(data));
}

