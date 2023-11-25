#include <SPI.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
//#include <Fonts/FreeSerif9pt7b.h>
#include <SoftwareSerial.h>

#define OLED_RESET 4
Adafruit_SSD1306 display(OLED_RESET);
// #define screen_width 128 // OLED display width, in pixels
// #define screen_height 64 // OLED display height, in pixels
// Adafruit_SSD1306 display(screen_width, screen_height);

SoftwareSerial Bluetooth(2, 3); //RX >> D3, TX >> D2
String BluetoothReceived;


void setup() {
  Serial.begin(9600);
  Bluetooth.begin(9600);
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  display.cp437(true);
  display.clearDisplay();

  //display.setFont(&FreeSerif9pt7b);
  display.setTextSize(1);
  display.setTextColor(WHITE);
}


String utf8rus(String source) {
  int i = 0, k = source.length();
  String target;
  unsigned char n;
  char m[2] = { '0', '\0' };

  k = source.length();
  i = 0;

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
    BluetoothReceived = utf8rus(Bluetooth.readString());
    // display.setCursor(0, 0);
    // display.println(BluetoothReceived);
    // display.display();
    // delay(3000);
    // display.clearDisplay();
    for(int i = 0; i > -50; i--) {
      display.setCursor(0, i);
      display.println(BluetoothReceived);
      display.display();
      if(i%30==0)
      delay(300);
      display.clearDisplay();
    }
  }
}
