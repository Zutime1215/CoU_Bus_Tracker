#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <TinyGPSPlus.h>
#include <SoftwareSerial.h>

const int RXPin = D4, TXPin = D3;
const uint32_t GPSBaud = 9600;

const char* ssid = "sbond";
const char* password = "61913132";
String serverName = "http://ready-sensibly-kingfish.ngrok-free.app";

String bus_id = "1", lattitude, longitude;

TinyGPSPlus gps;
SoftwareSerial ss(RXPin, TXPin);


void setup() {
  Serial.begin(GPSBaud);
  ss.begin(GPSBaud);
  WiFi.begin(ssid, password);
  while(WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
}

void loop() {
  while (ss.available() > 0)
    if (gps.encode(ss.read())){
      if (gps.location.isValid()) {
        lattitude = String(gps.location.lat(), 6);
        longitude = String(gps.location.lng(), 6);
        push(lattitude + "/" + longitude);
      }
      else {
        Serial.println("Searching Satallite");
      }
      delay(6000);
    }

  if (millis() > 5000 && gps.charsProcessed() < 10) {
    Serial.println(F("No GPS detected: check wiring."));
    while(true);
  }

}


void push(String latlng) {
  if(WiFi.status()== WL_CONNECTED){
    WiFiClient client;
    HTTPClient http;

    String serverPath = serverName + "/locations/" + bus_id + "/" + latlng;
    Serial.println("sending request to: " + serverPath + "...");
    http.begin(client, serverPath);
    int httpResponseCode = http.PATCH("");

    if (httpResponseCode == 200) {
      Serial.println("HTTP Response code: " + httpResponseCode);
      String payload = http.getString();
      Serial.println(payload);
      Serial.println("success");
    } else {
      Serial.println("Error code: " + httpResponseCode);
    }

    http.end();
  } else {
    Serial.println("WiFi Disconnected");
  }
}