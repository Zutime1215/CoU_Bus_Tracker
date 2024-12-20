#include <WiFi.h>
#include <HTTPClient.h>
#include <esp32cam.h>

// Wi-Fi credentials
const char* ssid = "RobolCT x UYNBD Zone";
const char* password = "Tech4Tomorrow#Zone";

// Server details
String serverName = "http://192.168.0.117:3000"; // Replace with your Node.js server URL
String device_id = "camera1"; // Identifier for the ESP32-CAM

// Function Prototypes
void connectToWiFi();
void initializeCamera();
std::unique_ptr<esp32cam::Frame> captureImage();
void sendImageToServer(std::unique_ptr<esp32cam::Frame>& frame);

void setup() {
  Serial.begin(115200);
  delay(1000);

  connectToWiFi();
  initializeCamera();
}

void loop() {
  // Capture an image
  auto frame = captureImage();
  if (frame) {
    // Send the image to the server
    sendImageToServer(frame);
  }
  
  delay(10000); // Wait 10 seconds before capturing the next image
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
  Config cfg;
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

    String serverPath = serverName + "/upload/" + device_id;

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
