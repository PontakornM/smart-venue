#include <SPI.h>
#include <Ethernet.h>
#include <PubSubClient.h>

#include <ArduinoJson.h>

#define IBEACONFORMATLENGTH 70
#define MAJORPOS 42
#define MEASUREDPOWERPOS 50
#define RSSIPOS 66
#define UUIDPOS 9
#define MODULEADDRLENGTH 20

// Update these with values suitable for your network.
byte mac[] = {  0xDE, 0xED, 0xBA, 0xFE, 0xFE, 0xEA };
char deviceName[] = "sv-terminal-zone-A";
String zone = "A";
IPAddress server(172, 30, 88, 12);

EthernetClient ethClient;
PubSubClient client(ethClient);

String inputString = "";
boolean stringNotComplete = true;

void setup() {  
  // Open serial communications
  Serial.begin(9600);
  Serial1.begin(9600);

  // setup the arduino IP address
  Serial.println("Configuring an IP address..... ");
  if (Ethernet.begin(mac) == 0) {
    Serial.println("Failed to configure Ethernet using DHCP");
    // no point in carrying on, so do nothing forevermore:
    for (;;)
      ;
  }
  IPAddress ip = setIPAddress();

  // reserve 1000 bytes for the inputString:
  inputString.reserve(1000);

  // Open MQTT connection
  client.setServer(server, 1883);
  client.setCallback(callback);
  Ethernet.begin(mac, ip);
  
  // Allow the hardware to sort itself out
  delay(1500);
}

void loop() {
  //connect to MQTT broker
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  
  // clear the string
  inputString = "";
  stringNotComplete = true;
  
  // send AT command to query ibeacon
  Serial1.write("AT+DISI?");
  while(stringNotComplete) {
    String bufferString = Serial1.readString();
    // add it to the inputString:
    inputString += bufferString;
    if(inputString.indexOf("DISCE") > 0){
      stringNotComplete = false;
    }
  }
  
  // print the string when a "DISCE" arrives:
  if(!stringNotComplete) {
//    Serial.println(inputString);
  }  
  
  // cut unnecessary part from raw data
  String disitemp = HeaderTrailerTrim(inputString);
//  Serial.println(disitemp);

  // count total of queried devices
  int numofdevice = CountDevice(disitemp);
  Serial.print("\nFounded devices : ");
  Serial.println(numofdevice);

  // make DISI
  String DISI[numofdevice];
  MakeDISI(disitemp, numofdevice, DISI);
  
  //  make JSON string and send to the server
  JsonObject& object = makeJson(DISI, numofdevice);
  int datalength = object.measureLength() + 1;
  char data[datalength];
  object.printTo(data, datalength);
  client.publish("data", data);
  object.printTo(Serial);
}

int CheckDistance(String DiscoveredDevice) {
  int proximity;
  String temp = DiscoveredDevice.substring(MEASUREDPOWERPOS, 52);
  int MeasuredPower = SignedHexToDec(temp);

  temp = DiscoveredDevice.substring(RSSIPOS, 70);
  int rssi = temp.toInt();

  int distance = rssi - MeasuredPower;
  
  if(distance > 0){
    proximity = 1;
  }else if(distance == 0){
    proximity = 0;
  }else if(distance < 0){
    proximity = -1;
  }else{
    proximity = 9;
  }
  
  return proximity;  
}

String CheckType(String DiscoveredDevice) {
  String type = "";
  String temp = DiscoveredDevice.substring(MAJORPOS, 46);
//  Serial.println(temp);
  if(temp == "0000") {
    type = "0";  
  }else if(temp == "0001") {
    type = "1";
  }else {
    type = "9";
  }
  return type;  
}

void MakeDISI(String str, int num, String* disi) {
  String temp;
  int i = 0;
  while(i < num){
    temp = str;
    disi[i] = temp.substring(IBEACONFORMATLENGTH * i, IBEACONFORMATLENGTH * (i + 1));
    Serial.println(disi[i]);
    i++;
  }
}

String HeaderTrailerTrim(String str) {
  // cut the AT command 
  str.replace("OK+DISIS", "");
  str.replace("OK+DISCE", "");
  str.replace("OK+DISC:", "");
  str.replace("OK+ADDR:", "");
  return str;
}


int SignedHexToDec(String str) {
   int hex = (NumHex(str[0])*16) + NumHex(str[1]);
//   Serial.print("HEX:");
//   Serial.println(hex);
   return hex - 256;
}

int NumHex(char hex){
  if(hex >= '0' && hex <= '9')
    return hex -'0';
  if(hex >= 'A' && hex <= 'F'){ 
//    Serial.println(10 + (hex - 'A'));
    return 10 + (hex - 'A');  
  }
}

int CountDevice(String str) {
  int count;
  count = str.length() / IBEACONFORMATLENGTH;
  return count;
}

void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  for (int i=0;i<length;i++) {
    Serial.print((char)payload[i]);
  }
  Serial.println();
}

void reconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    // Attempt to connect
    if (client.connect(deviceName)) {
      Serial.println("connected");
      // Once connected, publish an announcement...
      client.publish("outTopic","hello world");
      // ... and resubscribe
      client.subscribe("inTopic");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      // Wait 5 seconds before retrying
      delay(5000);
    }
  }
}

JsonObject& makeJson(String* str, int numofdevice){
  StaticJsonBuffer<1000> jsonBuffer;
  
  JsonObject& object = jsonBuffer.createObject();
  
  object["zone"] = zone;
  JsonArray&  uuid  = object.createNestedArray("uuid");
  JsonArray&  type  = object.createNestedArray("type");
  JsonArray&  proximity  = object.createNestedArray("proximity");
  
  int i;
  for(i = 0; i < numofdevice; i++){
      uuid.add(str[i].substring(UUIDPOS, 41));
      type.add(CheckType(str[i]));
      proximity.add(CheckDistance(str[i]));
  }
  return object;
}

IPAddress setIPAddress(){
  int myip[4];
  Serial.print("My IP address: ");
  for (byte thisByte = 0; thisByte < 4; thisByte++) {
    // print the value of each byte of the IP address:
    myip[thisByte] = Ethernet.localIP()[thisByte];
    Serial.print(myip[thisByte]);
    Serial.print(".");
  }
  IPAddress ip(myip[0], myip[1], myip[2], myip[3]);

  Serial.println();
  return ip;
}

void getZone(){
  client.subscribe("responseZone");
  String buffaddr = "";
  Serial1.write("AT+ADDR?");
  while(buffaddr.length() < MODULEADDRLENGTH) {
    String bufferString = Serial1.readString();
    // add it to the bufferString:
    buffaddr += bufferString;
  }
  buffaddr = HeaderTrailerTrim(buffaddr);
  Serial.println(buffaddr);
  char addr[MODULEADDRLENGTH];
  buffaddr.toCharArray(addr, MODULEADDRLENGTH);
  client.publish("requestZone", addr);
}

