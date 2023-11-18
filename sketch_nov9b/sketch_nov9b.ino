#include <SPI.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "SoftwareSerial.h"

#define OLED_RESET 4

Adafruit_SSD1306 display(OLED_RESET);
SoftwareSerial Bluetooth(2, 3); //RX >> D3, TX >> D2
String BluetoothReceived;

void setup() {
  Serial.begin(9600);
  Bluetooth.begin(9600);
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  display.dim(true);
  display.cp437(true);
  display.display();
  delay(2000);
}

String utf8rus(String source) {
  int i,k;
  String target;
  unsigned char n;
  char m[2] = { '0', '\0' };
  k = source.length(); i = 0;
  while (i < k) {
    n = source[i]; i++;
    if (n >= 0xC0) {
      switch (n) {
        case 0xD0: {
          n = source[i]; i++;
          if (n == 0x81) { n = 0xA8; break; }
          if (n >= 0x90 && n <= 0xBF) n = n + 0x30;
          break;
        }
        case 0xD1: {
          n = source[i]; i++;
          if (n == 0x91) { n = 0xB8; break; }
          if (n >= 0x80 && n <= 0x8F) n = n + 0x70;
          break;
        }
      }
    }
    m[0] = n; target = target + String(m);
  }
  return target;
}

void loop() {
  if (Bluetooth.available() > 0) {
    BluetoothReceived = Bluetooth.readString();
    Serial.print("Bluetooth Connected");
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(WHITE);
    display.setCursor(0, 5);
    display.setTextWrap(true);
    display.print(utf8rus(BluetoothReceived));
    display.display();
    delay(2000);
  }
}