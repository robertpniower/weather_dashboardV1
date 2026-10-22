#include <WiFi.h>
#include <MQTTClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

#define CLIENT_ID "ESP32-001" 

const char WIFI_SSID[] = "MOVISTAR_27B6";          // CHANGE TO YOUR WIFI SSID
const char WIFI_PASSWORD[] = "P62p5PLR2SaHbFYjKS3z";          // CHANGE TO YOUR WIFI PASSWORD
const char MQTT_BROKER_ADRRESS[] = "192.168.1.51";  // CHANGE TO MQTT BROKER'S IP ADDRESS
const int MQTT_PORT = 1883;

// The MQTT topics that this device should publish/subscribe
#define PUBLISH_TOPIC "esp32-001/send"
#define SUBSCRIBE_TOPIC "esp32-001/receive"

#define PUBLISH_INTERVAL 30000  // 30 seconds

// DHT11 Sensor Setup
#define DHTPIN 21     // Digital pin connected to the DHT11 data pin
#define DHTTYPE DHT11   // Defining the sensor type as DHT11
DHT dht(DHTPIN, DHTTYPE);

WiFiClient network;
MQTTClient mqtt = MQTTClient(256);

unsigned long lastPublishTime = 0;

void setup() {
  Serial.begin(9600);

  // Initialize the DHT sensor
  dht.begin();

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.println("ESP32 - Connecting to Wi-Fi");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();

  connectToMQTT();
}

void loop() {
  mqtt.loop();

  if (millis() - lastPublishTime > PUBLISH_INTERVAL) {
    sendToMQTT();
    lastPublishTime = millis();
  }
}

void connectToMQTT() {
  mqtt.begin(MQTT_BROKER_ADRRESS, MQTT_PORT, network);
  mqtt.onMessage(messageHandler);

  Serial.print("ESP32 - Connecting to MQTT broker");

  while (!mqtt.connect(CLIENT_ID)) {
    Serial.print(".");
    delay(500);
  }
  Serial.println();

  if (!mqtt.connected()) {
    Serial.println("ESP32 - MQTT broker Timeout!");
    return;
  }

  if (mqtt.subscribe(SUBSCRIBE_TOPIC))
    Serial.print("ESP32 - Subscribed to the topic: ");
  else
    Serial.print("ESP32 - Failed to subscribe to the topic: ");

  Serial.println(SUBSCRIBE_TOPIC);
  Serial.println("ESP32  - MQTT broker Connected!");
}

void sendToMQTT() {
  // Read humidity and temperature from DHT11
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature(); // Celsius by default

  // Check if readings failed and exit early to try again next cycle
  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("Failed to read from DHT sensor!");
    return;
  }

  StaticJsonDocument<200> message;
  message["timestamp"] = millis();
  message["temperature"] = temperature;
  message["humidity"] = humidity;
  
  char messageBuffer[512];
  serializeJson(message, messageBuffer);

  mqtt.publish(PUBLISH_TOPIC, messageBuffer);

  Serial.println("ESP32 - sent to MQTT:");
  Serial.print("- topic: ");
  Serial.println(PUBLISH_TOPIC);
  Serial.print("- payload: ");
  Serial.println(messageBuffer);
}

void messageHandler(String &topic, String &payload) {
  Serial.println("ESP32 - received from MQTT:");
  Serial.println("- topic: " + topic);
  Serial.println("- payload:");
  Serial.println(payload);
}