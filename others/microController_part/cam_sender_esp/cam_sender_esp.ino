#include <WiFi.h>
#include <HTTPClient.h>
#include <esp32cam.h>
#include <TinyGPSPlus.h>
#include <SoftwareSerial.h>

// Wi-Fi credentials
const char* ssid = "RobolCT x UYNBD Zone";
const char* password = "Tech4Tomorrow#Zone";

String serverName = "http://192.168.0.112:8080";
String bus_id = "1";
String lattitude, longitude;

TinyGPSPlus gps;
const int RXPin = 4, TXPin = 13;
SoftwareSerial GPSchan(RXPin, TXPin);
const uint32_t GPSBaud = 9600;

// Function Prototypes
void connectToWiFi();
void initializeCamera();
std::unique_ptr<esp32cam::Frame> captureImage();
String collectCordinate();

void sendImageToServer(std::unique_ptr<esp32cam::Frame>& frame);
void sendCordinateToServer(String latlng);

void sendDataToServer(String latlng, std::unique_ptr<esp32cam::Frame>& frame);


void setup() {
  // put your setup code here, to run once:
    Serial.begin(GPSBaud);
    GPSchan.begin(GPSBaud);
    delay(1000);

    connectToWiFi();
    initializeCamera();

}

void loop() {
    auto frame = captureImage();
    // String cordinate = collectCordinate();
    String cordinate = "3.1415/5141.3";
    sendDataToServer(cordinate, frame);

    delay(10000);
}


void connectToWiFi() {
  Serial.println("Connecting to Wi-Fi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWi-Fi connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

void initializeCamera() {
  using namespace esp32cam;
  esp32cam::Config cfg; // Fully qualify the Config class to resolve ambiguity
  cfg.setPins(pins::AiThinker); // Pin configuration for AI-Thinker ESP32-CAM
  cfg.setResolution(Resolution::find(1280, 720)); // Set resolution to 1280x720
  cfg.setJpeg(80); // Set JPEG quality (0-100)

  if (!Camera.begin(cfg)) {
    Serial.println("Failed to initialize the camera");
    while (true) delay(1000); // Halt if initialization fails
  }
  Serial.println("Camera initialized successfully!");
}

std::unique_ptr<esp32cam::Frame> captureImage() {
  Serial.println("Capturing image...");
  auto frame = esp32cam::capture();
  if (!frame) {
    Serial.println("Failed to capture image");
    return nullptr;
  }
  Serial.printf("Image captured, size: %d bytes\n", frame->size());
  return frame;
}

void sendImageToServer(std::unique_ptr<esp32cam::Frame>& frame) {
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClient client;
    HTTPClient http;

    String serverPath = serverName + "/upload/" + bus_id;

    Serial.println("Sending request to: " + serverPath);
    http.begin(client, serverPath);

    String boundary = "----ESP32CamBoundary";
    http.addHeader("Content-Type", "multipart/form-data; boundary=" + boundary);

    String bodyStart = "--" + boundary + "\r\n";
    bodyStart += "Content-Disposition: form-data; name=\"image\"; filename=\"image.jpg\"\r\n";
    bodyStart += "Content-Type: image/jpeg\r\n\r\n";

    String bodyEnd = "\r\n--" + boundary + "--\r\n";

    size_t totalLength = bodyStart.length() + frame->size() + bodyEnd.length();
    std::unique_ptr<uint8_t[]> bodyBuffer(new uint8_t[totalLength]);

    memcpy(bodyBuffer.get(), bodyStart.c_str(), bodyStart.length());
    memcpy(bodyBuffer.get() + bodyStart.length(), frame->data(), frame->size());
    memcpy(bodyBuffer.get() + bodyStart.length() + frame->size(), bodyEnd.c_str(), bodyEnd.length());

    int httpResponseCode = http.POST(bodyBuffer.get(), totalLength);
    if (httpResponseCode == 200) {
      Serial.printf("HTTP Response code: %d\n", httpResponseCode);
      Serial.println(http.getString());
    } else {
      Serial.printf("Error code: %d\n", httpResponseCode);
    }

    http.end();
  } else {
    Serial.println("Wi-Fi disconnected, cannot send image");
  }
}

String collectCordinate() {
  while (GPSchan.available() > 0)
    if (gps.encode(GPSchan.read())){
      if (gps.location.isValid()) {
        lattitude = String(gps.location.lat(), 6);
        longitude = String(gps.location.lng(), 6);

        return lattitude + "/" + longitude;
      }
      else {
        Serial.println("Searching Satallite");
      }
    }

  if (millis() > 5000 && gps.charsProcessed() < 10) {
    Serial.println(F("No GPS detected: check wiring."));
    while(true);
  }
}


void sendCordinateToServer(String latlng) {
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


void sendDataToServer(String latlng, std::unique_ptr<esp32cam::Frame>& frame) {
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClient client;
    HTTPClient http;

    String serverPath = serverName + "/upload/" + bus_id;
    Serial.println("Sending request to: " + serverPath);

    http.begin(client, serverPath);

    String boundary = "----ESP32CamBoundary";
    http.addHeader("Content-Type", "multipart/form-data; boundary=" + boundary);

    String bodyStart = "--" + boundary + "\r\n";
    bodyStart += "Content-Disposition: form-data; name=\"coordinates\"\r\n\r\n";
    bodyStart += latlng + "\r\n";
    bodyStart += "--" + boundary + "\r\n";
    bodyStart += "Content-Disposition: form-data; name=\"image\"; filename=\"image.jpg\"\r\n";
    bodyStart += "Content-Type: image/jpeg\r\n\r\n";

    String bodyEnd = "\r\n--" + boundary + "--\r\n";

    size_t totalLength = bodyStart.length() + frame->size() + bodyEnd.length();
    std::unique_ptr<uint8_t[]> bodyBuffer(new uint8_t[totalLength]);

    memcpy(bodyBuffer.get(), bodyStart.c_str(), bodyStart.length());
    memcpy(bodyBuffer.get() + bodyStart.length(), frame->data(), frame->size());
    memcpy(bodyBuffer.get() + bodyStart.length() + frame->size(), bodyEnd.c_str(), bodyEnd.length());

    int httpResponseCode = http.POST(bodyBuffer.get(), totalLength);

    if (httpResponseCode == 200) {
      Serial.printf("HTTP Response code: %d\n", httpResponseCode);
      Serial.println(http.getString());
    } else {
      Serial.printf("Error code: %d\n", httpResponseCode);
    }

    http.end();
  } else {
    Serial.println("Wi-Fi disconnected, cannot send data");
  }
}
