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
  display.dim(true);
  Serial.begin(9600);
  Bluetooth.begin(9600);
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  display.display();
  delay(2000);
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
    display.pri9nt(BluetoothReceived);
    display.display();
    delay(2000);
  }
}